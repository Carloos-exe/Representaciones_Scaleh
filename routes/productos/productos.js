const express = require('express');
const router = express.Router();

const { getProductos } = require('../../controller/productosController'); // Ruta corregida
 // Correcto acceso al controlador

// Ruta para obtener y mostrar los productos
router.get('/productos', getProductos);

module.exports = router;
