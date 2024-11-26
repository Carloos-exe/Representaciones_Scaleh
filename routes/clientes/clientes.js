const express = require('express');
const router = express.Router();
const clientesController = require('../../controller/clientesController');

// Ruta GET para la página de clientes
router.get('/', clientesController.getClientes);

// Ruta GET para editar un cliente
router.get('/editar/:id', clientesController.getClienteById);

// Ruta POST para editar un cliente
router.post('/editar/:id', clientesController.updateCliente);

// Ruta GET para eliminar un cliente
router.get('/eliminar/:id', clientesController.deleteCliente);

module.exports = router;
