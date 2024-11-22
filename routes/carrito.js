const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth'); // Middleware de autenticación
const db = require('../config/dbConnection'); // Conexión a la base de datos

// Ruta para ver el carrito
router.get('/', isAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Mostrar mensajes de la sesión
    const message = req.session.message || null;
    req.session.message = null;

    res.render('carrito', { cart, total, message });
});

// Ruta para agregar un producto al carrito
router.post('/agregar', isAuthenticated, async (req, res) => {
    const { productoId, cantidad } = req.body;

    try {
        const cantidadNumerica = parseInt(cantidad, 10);
        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            req.session.message = 'Cantidad inválida';
            return res.redirect('/carrito');
        }

        const [producto] = await db.execute(
            `SELECT idProducto, nombreProducto, precio FROM productos WHERE idProducto = ?`,
            [productoId]
        );

        if (producto.length === 0) {
            req.session.message = 'Producto no encontrado';
            return res.redirect('/carrito');
        }

        const item = producto[0];

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const index = req.session.cart.findIndex(p => p.idProducto === item.idProducto);

        if (index !== -1) {
            req.session.cart[index].cantidad += cantidadNumerica;
        } else {
            req.session.cart.push({
                idProducto: item.idProducto,
                nombreProducto: item.nombreProducto,
                precio: parseFloat(item.precio),
                cantidad: cantidadNumerica
            });
        }

        req.session.message = 'Producto agregado al carrito';
        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al agregar al carrito:', err);
        req.session.message = 'Error al agregar producto';
        res.redirect('/carrito');
    }
});

// Ruta para eliminar un producto del carrito
router.post('/eliminar', isAuthenticated, (req, res) => {
    try {
        const { productoId } = req.body;
        const idNumerico = parseInt(productoId, 10);

        if (!req.session.cart || isNaN(idNumerico)) {
            req.session.message = 'Producto no encontrado';
            return res.redirect('/carrito');
        }

        req.session.cart = req.session.cart.filter(item => item.idProducto !== idNumerico);

        req.session.message = 'Producto eliminado del carrito';
        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al eliminar del carrito:', err);
        req.session.message = 'Error al eliminar producto';
        res.redirect('/carrito');
    }
});

// Ruta para vaciar el carrito
router.post('/vaciar', isAuthenticated, (req, res) => {
    try {
        req.session.cart = [];
        req.session.message = 'Carrito vaciado';
        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al vaciar el carrito:', err);
        req.session.message = 'Error al vaciar el carrito';
        res.redirect('/carrito');
    }
});

module.exports = router;
