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
            res.render('incidencia', { id_tanda });
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

router.post('/fin', async (req, res) => {
    var { id_tanda, id_personalizada, kg_teoricos, kg_reales } = req.body;
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
        if (id_personalizada == '') id_personalizada = null;
        var eficienciaRow = {
            id_tanda,
            id_personalizada,
            kg_teoricos,
            kg_reales,
            eficiencia
        }
        await pool.query('INSERT INTO fin_tandas SET ?', [eficienciaRow], (err, result) => {
            if (err) {
                console.log(err.message);
                errors.push({ text: "Ese id ya existe. Por favor, utilice otro id." });
                res.render('eficiencia', {
                    errors,
                    id_tanda
                });
            }
            else res.redirect('/');
        });
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
    var id_tanda = req.body.id_tanda;
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

router.post('/tandas/detalles:id', (req, res) => {
    var id_tanda = req.body.id_tanda;
    pool.query('SELECT * FROM incidencias WHERE id_tanda = ?', [id_tanda], (err, result) => {
        if (err) throw err;
        rows = result;
        res.render('detalles', { rows, id_tanda });
    });
});

router.get('/tolerancia', (req, res) => {
    res.render('tolerancia');
});

router.post('/cubeta', (req, res) => {
    var codigo_semiterminado = req.body.codigo_semiterminado;
    res.render('cubeta', { codigo_semiterminado });
});

router.post('/calcular', (req, res) => {
    var { codigo_semiterminado, peso_cubeta } = req.body;
    var errors = [];

    if (!peso_cubeta) {
        errors.push({ text: "Por favor, rellene el campo \"Peso cubeta\"." });
    }
    pool.query('SELECT * FROM datos', (err, result) => {
        if (err) throw err;
        var datos = result;
        var num_unidades = datos[0].num_unidades;
        var peso_total_bobinas = datos[0].peso_total_bobinas;
        var peso_cubeta_c8231 = datos[0].peso_cubeta_c8231;
        var peso_bobina_cubeta_c8635 = datos[0].peso_bobina_cubeta_c8635;
        var peso_cubeta_neto = (peso_cubeta/2) - peso_cubeta_c8231 - peso_total_bobinas - peso_bobina_cubeta_c8635;
        var unidad = peso_cubeta_neto / num_unidades;
        var producto = codigo_semiterminado;
        var productoRow = {
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
            if (err) throw err;
            console.log(productoRow);
            res.render('cubeta', { codigo_semiterminado, peso_cubeta_neto, unidad, errors, nRoj, nAma, nVer, uRoj, uAma, uVer });
        });
    });
});

module.exports = router;