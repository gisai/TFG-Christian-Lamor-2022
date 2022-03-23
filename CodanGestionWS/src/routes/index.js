const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/start', (req, res) => {
    res.render('start');
});

router.post('/start', (req, res) => {
    const { jefeEquipo, linea, producto } = req.body;
    const errors = [];

    if (!jefeEquipo) {
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
            jefeEquipo,
            linea,
            producto
        });
    } else {
        var hoy = new Date();
        var fecha = hoy.getDate() + '-' + (hoy.getMonth() + 1) + '-' + hoy.getFullYear();
        var hora = hoy.getHours() + ':' + hoy.getMinutes() + ':' + hoy.getSeconds();
        var fechaYHora = fecha + ' ' + hora;
        //var id = ;

        console.log("{\n    Jefe: " + req.body.jefeEquipo
            + "\n    Linea: " + req.body.linea
            + "\n    Producto: " + req.body.producto
            + "\n    Fecha: " + fechaYHora + "\n}\n");

        res.render('incidence');
    }
});

router.post('/incidence', (req, res) => {
    const { incidencia, horaParada, minutosParada, horaReinicio, minutosReinicio } = req.body;
    const errors = [];

    if (!incidencia) {
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
            incidencia,
            horaParada,
            minutosParada,
            horaReinicio,
            minutosReinicio
        });
    }
    else {
        var parada = (Number(horaParada) * 60) + Number(minutosParada);
        var reinicio = (Number(horaReinicio) * 60) + Number(minutosReinicio);
        var minutosPerdidos = reinicio - parada;

        if (minutosPerdidos <= 0)
            errors.push({ text: "La hora de reinicio debe ser posterior a la hora de parada." });
        if (errors.length > 0) {
            res.render('incidence', {
                errors,
                incidencia,
                horaParada,
                minutosParada,
                horaReinicio,
                minutosReinicio
            });
        }
        else {
            console.log("{\n    Incidencia: " + req.body.incidencia
                + "\n    Hora de parada: " + parada
                + "\n    Hora de reinicio: " + reinicio
                + "\n    Minutos perdidos: " + minutosPerdidos + "\n}\n");
            res.render('incidence');
        }
    }
});

router.post('/eficience', (req, res) => {
    res.render('eficience');
});

router.post('/index', (req, res) => {
    const { kilosTeoricos, kilosReales } = req.body;
    const errors = [];

    if (!kilosTeoricos) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos teoricos\"." });
    }
    if (!kilosReales) {
        errors.push({ text: "Por favor, rellene el campo \"Kilos reales\"." });
    }
    if (errors.length > 0) {
        res.render('eficience', {
            errors,
            kilosTeoricos,
            kilosReales
        });
    }
    else {
        var eficiencia = (kilosReales / kilosTeoricos) * 100;
        eficiencia = eficiencia.toFixed(3);

        console.log("{\n    KgTeoricos: " + kilosTeoricos
            + "\n    KgReales: " + kilosReales
            + "\n    Eficiencia: " + eficiencia + " %\n}\n")
        res.render('index');
    }
});

module.exports = router;