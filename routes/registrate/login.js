const express = require('express');
const router = express.Router();

// Ruta para mostrar el formulario de login
router.get('/', (req, res) => {
    res.render('login');
});

// Ruta para procesar el inicio de sesión
router.post('/', (req, res) => {
    // lógica de autenticación aquí
    res.redirect('/');
});

module.exports = router;
