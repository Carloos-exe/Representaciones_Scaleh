const express = require('express');
const router = express.Router();
const perfilController = require('../controller/perfilController');
const isAuthenticated = require('../middleware/isAuthenticated');

// Ruta para ver el perfil
router.get('/perfil', isAuthenticated, perfilController.verPerfil);

// Ruta para editar el perfil
router.post('/perfil/editar', isAuthenticated, perfilController.editarPerfil);


module.exports = router;
