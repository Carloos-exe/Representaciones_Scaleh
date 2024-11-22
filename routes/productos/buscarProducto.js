const express = require('express');
const router = express.Router();
const db = require('../../config/dbConnection'); // Conexión a la base de datos

// Ruta para buscar productos
router.get('/', async (req, res) => {
    const { search } = req.query;

    try {
        const [productos] = await db.execute(
            'SELECT * FROM productos WHERE nombreProducto LIKE ?',
            [`%${search}%`]
        );

        res.render('productos', { productos });
    } catch (err) {
        console.error('Error al buscar productos:', err);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
