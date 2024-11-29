const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth'); // Middleware de autenticación
const db = require('../config/dbConnection'); // Conexión a la base de datos

// Ruta para ver el carrito del usuario autenticado
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Consultar el carrito del usuario
        const [cartItems] = await db.execute(
            `SELECT c.idCarrito, p.nombreProducto, p.precio, c.cantidad 
             FROM carrito c
             JOIN productos p ON c.idProducto = p.idProducto
             WHERE c.idUsuario = ?`,
            [userId]
        );

        // Calcular el total del carrito
        const total = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        // Mostrar mensajes de la sesión
        const message = req.session.message || null;
        req.session.message = null;

        res.render('carrito', { cart: cartItems, total, message });
    } catch (err) {
        console.error('Error al obtener el carrito:', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para agregar un producto al carrito
router.post('/agregar', isAuthenticated, async (req, res) => {
    const { productoId, cantidad } = req.body;

    try {
        const userId = req.session.userId;
        const cantidadNumerica = parseInt(cantidad, 10);

        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            req.session.message = 'Cantidad inválida';
            return res.redirect('/carrito');
        }

        // Verificar si el producto existe
        const [producto] = await db.execute(
            `SELECT idProducto, precio FROM productos WHERE idProducto = ?`,
            [productoId]
        );

        if (producto.length === 0) {
            req.session.message = 'Producto no encontrado';
            return res.redirect('/carrito');
        }

        // Verificar si el producto ya está en el carrito
        const [existingCartItem] = await db.execute(
            `SELECT idCarrito, cantidad FROM carrito WHERE idUsuario = ? AND idProducto = ?`,
            [userId, productoId]
        );

        if (existingCartItem.length > 0) {
            // Actualizar cantidad si ya existe
            await db.execute(
                `UPDATE carrito SET cantidad = cantidad + ? WHERE idCarrito = ?`,
                [cantidadNumerica, existingCartItem[0].idCarrito]
            );
        } else {
            // Insertar nuevo producto en el carrito
            await db.execute(
                `INSERT INTO carrito (idUsuario, idProducto, cantidad) VALUES (?, ?, ?)`,
                [userId, productoId, cantidadNumerica]
            );
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
router.post('/eliminar', isAuthenticated, async (req, res) => {
    const { productoId } = req.body;

    try {
        const userId = req.session.userId;

        // Eliminar el producto del carrito
        await db.execute(
            `DELETE FROM carrito WHERE idUsuario = ? AND idProducto = ?`,
            [userId, productoId]
        );

        req.session.message = 'Producto eliminado del carrito';
        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al eliminar del carrito:', err);
        req.session.message = 'Error al eliminar producto';
        res.redirect('/carrito');
    }
});

// Ruta para vaciar el carrito
router.post('/vaciar', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.userId;

        // Eliminar todos los productos del carrito del usuario
        await db.execute(`DELETE FROM carrito WHERE idUsuario = ?`, [userId]);

        req.session.message = 'Carrito vaciado';
        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al vaciar el carrito:', err);
        req.session.message = 'Error al vaciar el carrito';
        res.redirect('/carrito');
    }
});

module.exports = router;
