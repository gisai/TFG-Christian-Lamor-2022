const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/inicio', (req, res) => {
    res.render('inicio');
});

router.post('/inicio', (req, res) => {
    var { jefe, linea, producto, id_personalizada } = req.body;
    var errors = [];

    if (!jefe) {
        errors.push({ text: "Por favor, rellene el campo \"Jefe de equipo\"." });
    }
    if (!linea) {
        errors.push({ text: "Por favor, rellene el campo \"Linea\"." });
    }
    if (!producto) {
        errors.push({ text: "Por favor, rellene el campo \"Producto\"." });
    }
    if (errors.length > 0) {
        res.render('inicio', {
            errors,
            id_personalizada,
            jefe,
            linea,
            producto
        });
    }
    else {
        if (id_personalizada == '') id_personalizada = null;
        var tandaRow = {
            id_personalizada,
            jefe,
            linea,
            producto
        }
        pool.query('INSERT INTO inicio_tandas SET ?', [tandaRow], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log(err.message);
                    errors.push({ text: "Ese id ya existe. Por favor, utilice otro id o deje el campo vacio." });
                    res.render('inicio', {
                        errors,
                        id_personalizada,
                        jefe,
                        linea,
                        producto
                    });
                }
            }
            else {
                var id_tanda = result.insertId;
                res.render('incidencia', { id_tanda });
            }
        });
    }
});

router.post('/incidencia/:id', async (req, res) => {
    var { id_tanda, descripcion, horaParada, minutosParada, horaReinicio, minutosReinicio } = req.body;
    var errors = [];

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
            id_tanda,
            descripcion,
            horaParada,
            minutosParada,
            horaReinicio,
            minutosReinicio
        });
    }
    else {
        var parada = (Number(horaParada) * 60) + Number(minutosParada);
        var reinicio = (Number(horaReinicio) * 60) + Number(minutosReinicio);
        var minutos_perdidos = reinicio - parada;

        if (minutos_perdidos <= 0) {
            errors.push({ text: "La hora de reinicio debe ser posterior a la hora de parada." });
        }
        if (errors.length > 0) {
            res.render('incidencia', {
                errors,
                id_tanda,
                descripcion,
                horaParada,
                minutosParada,
                horaReinicio,
                minutosReinicio
            });
        }
        else {
            var hora_parada = '' + horaParada + ':' + minutosParada + ':00';
            var hora_reinicio = '' + horaReinicio + ':' + minutosReinicio + ':00';
            var incidenciaRow = {
                id_tanda,
                descripcion,
                hora_parada,
                hora_reinicio,
                minutos_perdidos
            }
            await pool.query('INSERT INTO incidencias SET ?', [incidenciaRow]);
            res.render('incidencia', { id_tanda });
        }
    }
});

router.post('/eficiencia/:id', (req, res) => {
    var id_tanda = req.body.id_tanda;
    res.render('eficiencia', { id_tanda });
});

router.post('/fin', (req, res) => {
    var { id_tanda, kg_teoricos, kg_reales } = req.body;
    var errors = [];

    if (!kg_teoricos) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos teoricos\"." });
    }
    if (!kg_reales) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos reales\"." });
    }
    if (errors.length > 0) {
        res.render('eficiencia', {
            errors,
            id_tanda,
            kg_teoricos,
            kg_reales
        });
    }
    else {
        var eficiencia = kg_reales / kg_teoricos * 100;
        var eficienciaRow = {
            id_tanda,
            kg_teoricos,
            kg_reales,
            eficiencia
        }
        pool.query('INSERT INTO fin_tandas SET ?', [eficienciaRow], (err, result) => {
            if (err) throw err;
            res.redirect('/');
        });
    }
});

router.get('/tandas', (req, res) => {
    pool.query('SELECT * FROM tandas', (err, result) => {
        if (err) throw err;
        var rows = result;
        res.render('tandas', { rows });
    });
});

router.post('/tandas/buscar', (req, res) => {
    var id_tanda = req.body.id_tanda;

    if (id_tanda == '' || id_tanda == null) {
        pool.query('SELECT * FROM tandas', (err, result) => {
            if (err) throw err;
            var rows = result;
            res.render('tandas', { rows });
        });
    }
    else {
        pool.query('SELECT * FROM tandas WHERE id = ? OR id_personalizada = ?', [id_tanda, id_tanda], (err, result) => {
            if (err) throw err;
            rows = result;
            res.render('tandas', { rows });
        });
    }
});

router.post('/tandas/detalles:id', (req, res) => {
    var id_tanda = req.body.id_tanda;
    pool.query('SELECT * FROM tandas WHERE id = ?', [id_tanda], (err, result) => {
        if (err) throw err;
        var tanda = result;
        pool.query('SELECT * FROM incidencias WHERE id_tanda = ?', [id_tanda], (err, secResult) => {
            if (err) throw err;
            var incidenciaRows = secResult;
            pool.query('SELECT * FROM pesos WHERE id_tanda = ?', [id_tanda], (err, thirdResult) => {
                if (err) throw err;
                var pesoRows = thirdResult;
                res.render('detalles', { tanda, incidenciaRows, pesoRows, id_tanda });
            });
        });
    });

});

router.get('/inicio-pesaje', (req, res) => {
    res.render('inicio-pesaje');
});

router.post('/inicio-pesaje', (req, res) => {
    var { id_tanda, id_personalizada, codigo_semiterminado } = req.body;
    var errors = [];

    if (id_personalizada == '') id_personalizada = null
    if (!id_tanda && !id_personalizada) {
        errors.push({ text: "Por favor, introduzca el numero de tanda o su id asociada." });
    }
    if (codigo_semiterminado == "--") {
        errors.push({ text: "Por favor, seleccione un producto." });
    }
    if (errors.length > 0) {
        res.render('inicio-pesaje', {
            errors,
            id_tanda,
            id_personalizada,
            codigo_semiterminado
        });
    }
    else {
        if (!id_tanda) {
            pool.query('SELECT id FROM inicio_tandas WHERE id_personalizada = ?', [id_personalizada], (err, result) => {
                if (err) throw err;
                else {
                    if (result && result.length == 0) {
                        errors.push({ text: "Ese id no existe. Por favor, introduzca otro id." });
                        res.render('inicio-pesaje', { id_tanda, codigo_semiterminado, errors });
                    }
                    else {
                        id_tanda = result[0].id;
                        res.render('pesaje', { id_tanda, codigo_semiterminado });
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
                        res.render('inicio-pesaje', { id_tanda, codigo_semiterminado, errors });
                    }
                    else {
                        res.render('pesaje', { id_tanda, codigo_semiterminado });
                    }
                }
            });
        }
    }
});

router.post('/pesaje', (req, res) => {
    var { id_tanda, codigo_semiterminado, peso_cubeta } = req.body;
    var errors = [];

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
        pool.query('SELECT * FROM datos', (err, result) => {
            if (err) throw err;
            var datos = result;

            var num_unidades = datos[0].num_unidades;
            var peso_total_bobinas = datos[0].peso_total_bobinas;
            var peso_cubeta_c8231 = datos[0].peso_cubeta_c8231;
            var peso_bobina_cubeta_c8635 = datos[0].peso_bobina_cubeta_c8635;
            var peso_cubeta_neto = (peso_cubeta / 2) - peso_cubeta_c8231 - peso_total_bobinas - peso_bobina_cubeta_c8635;
            var unidad = peso_cubeta_neto / num_unidades;

            var producto = codigo_semiterminado;
            var productoRow = {
                id_tanda,
                producto,
                peso_cubeta_neto,
                unidad
            }

            var { nRoj, nAma, nVer, uRoj, uAma, uVer } = 0;
            if (peso_cubeta_neto < 172.3) nRoj = 1;
            else if (peso_cubeta_neto < 180) nAma = 1;
            else if (peso_cubeta_neto < 188.3) nVer = 1;
            else nAma = 1;
            if (unidad < 34.5) uRoj = 1;
            else if (unidad < 36) uAma = 1;
            else if (unidad < 37.7) uVer = 1;
            else uAma = 1;

            pool.query('INSERT INTO pesos SET ?', [productoRow], (err, result) => {
                if (err) {
                    if (err.code === 'ER_NO_REFERENCED_ROW') {
                        errors.push({ text: "Ese id no existe. Por favor, introduzca otro id." });
                        res.render('inicio-pesaje', { id_tanda, codigo_semiterminado, errors })
                    }
                    else throw err;
                }
                else {
                    console.log(productoRow);
                    res.render('pesaje', { id_tanda, codigo_semiterminado, peso_cubeta_neto, unidad, errors, nRoj, nAma, nVer, uRoj, uAma, uVer });
                }
            });
        });
    }
});

module.exports = router;