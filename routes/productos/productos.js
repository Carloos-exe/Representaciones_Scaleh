const express = require('express');
const router = express.Router();
const buscarProductos = require('./buscarProducto'); // Corrección del nombre
const db = require('../../config/dbConnection'); // Conexión a la base de datos
const upload = require('../../config/multerConfig'); // Middleware para subir imágenes

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

// Ruta para agregar un producto con imagen
router.post('/agregar', upload.single('imagen'), async (req, res) => {
    const { nombreProducto, descripcionProducto, precio, marca } = req.body;
    const imagenUrl = req.file ? `/img/productos/${req.file.filename}` : null;

    try {
        await db.execute(
            `INSERT INTO productos (nombreProducto, descripcionProducto, precio, marca, imagenUrl) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombreProducto, descripcionProducto, precio, marca, imagenUrl]
        );
        req.flash('message', { type: 'alert-success', text: 'Producto agregado correctamente.' });
        res.redirect('/productos');
    } catch (err) {
        console.error('Error al agregar el producto:', err);
        req.flash('message', { type: 'alert-danger', text: 'Error al agregar el producto.' });
        res.redirect('/productos');
    }
});

// Usar las rutas de búsqueda
router.use('/buscar', buscarProductos);

module.exports = router;
