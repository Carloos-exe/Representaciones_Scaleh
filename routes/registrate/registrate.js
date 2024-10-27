const express = require('express');
const router = express.Router();
const registroController = require('../../controller/registroController');

// Ruta para mostrar el formulario de registro
router.get('/registrate', (req, res) => {
    res.render('registrate'); // Renderiza el formulario de registro
});

// Ruta para manejar el envío del formulario de registro
router.post('/registrate', registroController.registrarUsuario); // Asegúrate de que esta ruta esté aquí

module.exports = router;
