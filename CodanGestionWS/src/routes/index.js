const express = require('express');
const router = express.Router();
const pool = require('../database');

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/start', (req, res) => {
    res.render('start');
});

router.post('/start', (req, res) => {
    var { jefe, linea, producto } = req.body;
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
        res.render('start', {
            errors,
            jefe,
            linea,
            producto
        });
    }
    else {
        var tandaRow = {
            jefe,
            linea,
            producto
        }
        var id_tanda;
        pool.query('INSERT INTO inicio_tandas SET ?', [tandaRow], (err, result) => {
            if (err) throw err;
            id_tanda = result.insertId;
            res.render('incidence', { id_tanda });
        });
    }
});

/*router.get('/incidence/?id=:id', (req, res) => {
    var id_tanda = req.query.valid;
    res.render('incidence', id_tanda);
});*/

router.post('/incidence/:id', async (req, res) => {
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
        res.render('incidence', {
            errors,
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
            res.render('incidence', {
                errors,
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
            res.render('incidence', { id_tanda });
        }
    }
});

router.post('/eficience/:id', (req, res) => {
    var { id_tanda } = req.body;
    res.render('eficience', { id_tanda });
});

router.post('/index', async (req, res) => {
    var { id_tanda, id_personalizada, kg_teoricos, kg_reales } = req.body;
    var errors = [];

    if (!kg_teoricos) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos teoricos\"." });
    }
    if (!kg_reales) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos reales\"." });
    }
    if (errors.length > 0) {
        res.render('eficience', {
            errors,
            kg_teoricos,
            kg_reales
        });
    }
    else {
        var eficiencia = kg_reales / kg_teoricos * 100;
        var eficienciaRow = {
            id_tanda,
            id_personalizada,
            kg_teoricos,
            kg_reales,
            eficiencia
        }
        await pool.query('INSERT INTO fin_tandas SET ?', [eficienciaRow]);
        res.redirect('/');
    }
});

router.get('/tandas', async (req, res) => {
    var rows;
    pool.query('SELECT * FROM tandas', (err, result) => {
        if (err) throw err;
        rows = result;
        res.render('tandas', { rows });
    });
});

router.post('/tandas/buscar', async (req, res) => {
    var { id_tanda } = req.body;
    var rows;
    if (id_tanda == '' || id_tanda == null) {
        pool.query('SELECT * FROM tandas', (err, result) => {
            if (err) throw err;
            rows = result;
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

router.get('/tolerancia', (req, res) => {
    res.render('tolerancia');
});

router.post('/cubeta', (req, res) => {
    var codigo_semiterminado = req.body;
    res.render('cubeta', { codigo_semiterminado });
});

router.post('/calcular', (req, res) => {
    var peso_cubeta = req.body;
    pool.query('SELECT * FROM datos', (err, result) => {
        if (err) throw err;
        var datos = result;

        var num_unidades = datos[0].num_unidades;
        var peso_bobina_c8086 = datos[0].peso_bobina_c8086;
        var peso_total_bobinas = datos[0].peso_total_bobinas;
        var peso_cubeta_c8231 = datos[0].peso_cubeta_c8231;
        var peso_bobina_cubeta_c8635 = datos[0].peso_bobina_cubeta_c8635;
        var num_cubetas = datos[0].num_cubetas

        var peso_cubeta_neto = (peso_cubeta/2) - peso_cubeta_c8231 - peso_total_bobinas - peso_bobina_cubeta_c8635;
        var peso_unidad = peso_cubeta_neto / num_unidades;

        /*if (peso_cubeta_neto <= 171.9 || peso_unidad <= 34.4) {
            console.log('ROJO');
        }
        else if ((peso_cubeta_neto > 171.9 && peso_cubeta_neto <= 180) || (peso_unidad > 34.4 && peso_unidad <= 35.9)) {
            console.log('AMARILLO');
        }
        else {
            console.log('VERDE');
        }*/
    });
});

module.exports = router;