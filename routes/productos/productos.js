const express = require('express');
const router = express.Router();
const buscarProductos = require('./buscarProducto'); // Corrección del nombre
const db = require('../../config/dbConnection'); // Conexión a la base de datos

// Ruta para listar todos los productos
router.get('/', async (req, res) => {
    try {
        const [productos] = await db.execute('SELECT * FROM productos');
        res.render('productos', { productos });
    } catch (err) {
        console.error('Error al cargar los productos:', err);
        res.status(500).send('Error al cargar los productos');
    }
});

// Usar las rutas de búsqueda
router.use('/buscar', buscarProductos);

module.exports = router;
