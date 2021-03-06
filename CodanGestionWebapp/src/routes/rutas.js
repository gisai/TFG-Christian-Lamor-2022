const express = require('express');
const router = express.Router();
const pool= require('../database');
const contexto_tanda = { id_tanda: 0 };
const contexto_peso = {
    id_tanda: 0,
    codigo_semiterminado: "",
    peso_cubeta_neto: 0,
    unidad: 0,
    nRoj: 0,
    nAma: 0,
    nVer: 0,
    uRoj: 0,
    uAma: 0,
    uVer: 0
}

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/inicio', (req, res) => {
    pool.query('SELECT codigo_producto FROM productos', (err, result) => {
        if (err) throw err;
        else {
            let productos = result;
            res.render('inicio', { productos });
        }
    });
});

router.post('/inicio', (req, res) => {
    let { jefe, linea, producto, id_personalizada } = req.body;
    let errors = [];

    if (!jefe) {
        errors.push({ text: "Por favor, rellene el campo \"Jefe de equipo\"." });
    }
    if (!linea) {
        errors.push({ text: "Por favor, rellene el campo \"Linea\"." });
    }
    if (producto == '--') {
        errors.push({ text: "Por favor, seleccione un producto." });
    }
    if (errors.length > 0) {
        pool.query('SELECT codigo_producto FROM productos', (err, result) => {
            if (err) throw err;
            else {
                let productos = result;
                res.render('inicio', { errors, productos });
            }
        });
    }
    else {
        if (id_personalizada == '') id_personalizada = null;
        let tandaRow = {
            id_personalizada,
            jefe,
            linea,
            producto
        }
        pool.query('INSERT INTO inicio_tandas SET ?', [tandaRow], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    errors.push({ text: "Ese id ya existe. Por favor, utilice otro id o deje el campo vacio." });
                    pool.query('SELECT codigo_producto FROM productos', (err, result) => {
                        if (err) throw err;
                        else {
                            let productos = result;
                            res.render('inicio', { errors, productos });
                        }
                    });
                }
            }
            else {
                contexto_tanda.id_tanda = result.insertId;
                res.redirect('/incidencia');
            }
        });
    }
});

router.get('/incidencia', (req, res) => {
    let id_tanda = contexto_tanda.id_tanda;
    res.render('incidencia', { id_tanda });
});

router.post('/incidencia/:id', async (req, res) => {
    let { id_tanda, descripcion, horaParada, minutosParada, horaReinicio, minutosReinicio } = req.body;
    let errors = [];

    if (!descripcion) {
        errors.push({ text: "Por favor, rellene el campo \"Descripcion\"." });
    }
    if (horaParada == "--" || minutosParada == "--") {
        errors.push({ text: "Por favor, rellene el campo \"Hora de parada\"." });
    }
    if (horaReinicio == "--" || minutosReinicio == "--") {
        errors.push({ text: "Por favor, rellene el campo \"Hora de reinicio\"." });
    }
    if (errors.length > 0) {
        res.render('incidencia', {
            errors,
            id_tanda
        });
    }
    else {
        let parada = (Number(horaParada) * 60) + Number(minutosParada);
        let reinicio = (Number(horaReinicio) * 60) + Number(minutosReinicio);
        let minutos_perdidos = reinicio - parada;

        if (minutos_perdidos <= 0) {
            errors.push({ text: "La hora de reinicio debe ser posterior a la hora de parada." });
        }
        if (errors.length > 0) {
            res.render('incidencia', {
                errors,
                id_tanda
            });
        }
        else {
            let hora_parada = '' + horaParada + ':' + minutosParada + ':00';
            let hora_reinicio = '' + horaReinicio + ':' + minutosReinicio + ':00';
            let incidenciaRow = {
                id_tanda,
                descripcion,
                hora_parada,
                hora_reinicio,
                minutos_perdidos
            }
            await pool.query('INSERT INTO incidencias SET ?', [incidenciaRow]);
            res.redirect('/incidencia');
        }
    }
});

router.post('/eficiencia/:id', (req, res) => {
    let id_tanda = req.body.id_tanda;
    res.render('eficiencia', { id_tanda });
});

router.post('/fin', (req, res) => {
    let { id_tanda, kg_teoricos, kg_reales } = req.body;
    let errors = [];

    if (!kg_teoricos) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos teoricos\"." });
    }
    if (!kg_reales) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos reales\"." });
    }
    if (errors.length > 0) {
        res.render('eficiencia', {
            errors,
            id_tanda
        });
    }
    else {
        let eficiencia = kg_reales / kg_teoricos * 100;
        let eficienciaRow = {
            id_tanda,
            kg_teoricos,
            kg_reales,
            eficiencia
        }
        pool.query('INSERT INTO fin_tandas SET ?', [eficienciaRow], (err, result) => {
            if (err) throw err;
            else {
                res.redirect('/');
            }
        });
    }
});

router.get('/tandas', (req, res) => {
    pool.query('SELECT * FROM tandas', (err, result) => {
        if (err) throw err;
        else {
            let rows = result;
            res.render('tandas', { rows });
        }
    });
});

router.post('/tandas/buscar', (req, res) => {
    let id_tanda = req.body.id_tanda;
    let id_pers = '%' + id_tanda + '%';

    if (id_tanda == '' || id_tanda == null) {
        pool.query('SELECT * FROM tandas', (err, result) => {
            if (err) throw err;
            else {
                let rows = result;
                res.render('tandas', { rows });
            }
        });
    }
    else {
        pool.query('SELECT * FROM tandas WHERE id = ? OR id_personalizada LIKE ?', [id_tanda, id_pers], (err, result) => {
            if (err) throw err;
            else {
                rows = result;
                res.render('tandas', { rows });
            }
        });
    }
});

router.post('/tandas/detalles:id', (req, res) => {
    let id_tanda = req.body.id_tanda;
    pool.query('SELECT * FROM tandas WHERE id = ?', [id_tanda], (err, result) => {
        if (err) throw err;
        let tanda = result;
        pool.query('SELECT * FROM incidencias WHERE id_tanda = ?', [id_tanda], (err, secResult) => {
            if (err) throw err;
            let incidenciaRows = secResult;
            pool.query('SELECT * FROM pesos WHERE id_tanda = ?', [id_tanda], (err, thirdResult) => {
                if (err) throw err;
                let pesoRows = thirdResult;
                let datos = [];
                let media = 0, varianza = 0, numElem = 0;

                pesoRows.forEach(elemento => {
                    let fila = [];
                    fila.push(elemento.hora.toLocaleTimeString());
                    fila.push(elemento.unidad);
                    datos.push(fila);
                    media = media + elemento.unidad;
                    numElem++;
                });

                media = (media / numElem).toFixed(4);
                pesoRows.forEach(elemento => {
                    varianza = varianza + Math.pow(elemento.unidad - media, 2);
                });
                varianza = (varianza / numElem).toFixed(4);

                pool.query('SELECT * FROM datos WHERE producto = ?', [tanda[0].producto], (err, forthResult) => {
                    if (err) throw err;
                    var datosProducto = forthResult[0];

                    let limites = {
                        inferior_rojo: datosProducto.lim_unidad_inferior_rojo,
                        inferior_ama: datosProducto.lim_unidad_inferior_amarillo,
                        superior_ama: datosProducto.lim_unidad_superior_amarillo,
                        superior_rojo: datosProducto.lim_unidad_superior_rojo
                    };
                    res.render('detalles', { tanda, incidenciaRows, pesoRows, id_tanda, datos, media, varianza, limites });
                });
            });
        });
    });
});

router.get('/inicio-pesaje', (req, res) => {
    pool.query('SELECT codigo_producto FROM productos', (err, result) => {
        if (err) throw err;
        else {
            let productos = result;
            res.render('inicio-pesaje', { productos });
        }
    });
});

router.post('/inicio-pesaje', (req, res) => {
    let { id_tanda, id_personalizada, codigo_semiterminado } = req.body;
    let errors = [];

    if (id_personalizada == '') id_personalizada = null
    if (!id_tanda && !id_personalizada) {
        errors.push({ text: "Por favor, introduzca el numero de tanda o su id asociada." });
    }
    if (codigo_semiterminado == "--") {
        errors.push({ text: "Por favor, seleccione un producto." });
    }
    if (errors.length > 0) {
        pool.query('SELECT codigo_producto FROM productos', (err, result) => {
            if (err) throw err;
            else {
                let productos = result;
                res.render('inicio-pesaje', { errors, productos });
            }
        });
    }
    else {
        if (!id_tanda) {
            pool.query('SELECT id FROM inicio_tandas WHERE id_personalizada = ?', [id_personalizada], (err, result) => {
                if (err) throw err;
                else {
                    if (result && result.length == 0) {
                        errors.push({ text: "Ese id no existe. Por favor, introduzca otro id." });
                        pool.query('SELECT codigo_producto FROM productos', (err, result) => {
                            if (err) throw err;
                            else {
                                let productos = result;
                                res.render('inicio-pesaje', { errors, productos });
                            }
                        });
                    }
                    else {
                        id_tanda = result[0].id;
                        pool.query('SELECT producto FROM inicio_tandas WHERE id = ?', [id_tanda], (err, result) => {
                            if (err) throw err;
                            else {
                                if (result[0].producto != codigo_semiterminado) {
                                    errors.push({ text: "Ese producto no corresponde a esa tanda. Por favor, seleccione el producto adecuado." });
                                    pool.query('SELECT codigo_producto FROM productos', (err, result) => {
                                        if (err) throw err;
                                        else {
                                            let productos = result;
                                            res.render('inicio-pesaje', { errors, productos });
                                        }
                                    });
                                } else {
                                    res.render('pesaje', { id_tanda, codigo_semiterminado });
                                }
                            }
                        });
                    }
                }
            });
        }
        else {
            pool.query('SELECT id FROM inicio_tandas WHERE id = ?', [id_tanda], (err, result) => {
                if (err) throw err;
                else {
                    if (result && result.length == 0) {
                        errors.push({ text: "Ese numero de tanda no existe. Por favor, introduzca otro numero de tanda." });
                        pool.query('SELECT codigo_producto FROM productos', (err, result) => {
                            if (err) throw err;
                            else {
                                let productos = result;
                                res.render('inicio-pesaje', { errors, productos });
                            }
                        });
                    }
                    else {
                        pool.query('SELECT producto FROM inicio_tandas WHERE id = ?', [id_tanda], (err, result) => {
                            if (err) throw err;
                            else {
                                if (result[0].producto != codigo_semiterminado) {
                                    errors.push({ text: "Ese producto no corresponde a esa tanda. Por favor, seleccione el producto adecuado." });
                                    pool.query('SELECT codigo_producto FROM productos', (err, result) => {
                                        if (err) throw err;
                                        else {
                                            let productos = result;
                                            res.render('inicio-pesaje', { errors, productos });
                                        }
                                    });
                                } else {
                                    res.render('pesaje', { id_tanda, codigo_semiterminado });

                                }
                            }
                        });
                    }
                }
            });
        }
    }
});

router.post('/pesaje', (req, res) => {
    let { id_tanda, codigo_semiterminado, peso_cubeta } = req.body;
    let errors = [];

    if (!peso_cubeta) {
        errors.push({ text: "Por favor, rellene el campo \"Peso cubeta\"." });
    }
    if (errors.length > 0) {
        res.render('pesaje', {
            errors,
            id_tanda,
            codigo_semiterminado
        });
    }
    else {
        pool.query('SELECT * FROM datos WHERE producto = ?', [codigo_semiterminado], (err, result) => {
            if (err) throw err;
            else {
                var datos = result[0];

                let num_unidades = datos.num_unidades;
                let peso_total_bobinas = datos.peso_total_bobinas;
                let peso_cubeta_c8231 = datos.peso_cubeta_c8231;
                let peso_bobina_cubeta_c8635 = datos.peso_bobina_cubeta_c8635;
                let peso_cubeta_neto = (peso_cubeta / 2) - peso_cubeta_c8231 - peso_total_bobinas - peso_bobina_cubeta_c8635;
                let unidad = peso_cubeta_neto / num_unidades;

                let producto = codigo_semiterminado;
                let productoRow = {
                    id_tanda,
                    producto,
                    peso_cubeta,
                    peso_cubeta_neto,
                    unidad
                }

                let { nRoj, nAma, nVer, uRoj, uAma, uVer } = 0;

                if (peso_cubeta_neto <= datos.lim_neto_inferior_rojo) nRoj = 1;
                else if (peso_cubeta_neto <= datos.lim_neto_inferior_amarillo) nAma = 1;
                else if (peso_cubeta_neto <= datos.lim_neto_superior_amarillo) nVer = 1;
                else if (peso_cubeta_neto <= datos.lim_neto_superior_rojo) nAma = 1;
                else nRoj = 1;

                if (unidad <= datos.lim_unidad_inferior_rojo) uRoj = 1;
                else if (unidad <= datos.lim_unidad_inferior_amarillo) uAma = 1;
                else if (unidad <= datos.lim_unidad_superior_amarillo) uVer = 1;
                else if (unidad <= datos.lim_unidad_superior_rojo) uAma = 1;
                else uRoj = 1;

                pool.query('INSERT INTO pesos SET ?', [productoRow], (err, result) => {
                    if (err) throw err;
                    else {
                        contexto_peso.id_tanda = id_tanda;
                        contexto_peso.codigo_semiterminado = codigo_semiterminado;
                        contexto_peso.peso_cubeta_neto = peso_cubeta_neto;
                        contexto_peso.unidad = unidad;
                        contexto_peso.nRoj = nRoj;
                        contexto_peso.nAma = nAma;
                        contexto_peso.nVer = nVer;
                        contexto_peso.uRoj = uRoj;
                        contexto_peso.uAma = uAma;
                        contexto_peso.uVer = uVer;
                        res.redirect('/pesaje');
                    }
                });
            }
        });
    }
});

router.get('/pesaje', (req, res) => {
    let id_tanda = contexto_peso.id_tanda;
    let codigo_semiterminado = contexto_peso.codigo_semiterminado;
    let peso_cubeta_neto = contexto_peso.peso_cubeta_neto;
    let unidad = contexto_peso.unidad;
    let nRoj = contexto_peso.nRoj;
    let nAma = contexto_peso.nAma;
    let nVer = contexto_peso.nVer;
    let uRoj = contexto_peso.uRoj;
    let uAma = contexto_peso.uAma;
    let uVer = contexto_peso.uVer;
    res.render('pesaje', { id_tanda, codigo_semiterminado, peso_cubeta_neto, unidad, nRoj, nAma, nVer, uRoj, uAma, uVer });
});

module.exports = router;