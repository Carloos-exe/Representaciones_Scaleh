const express = require('express');
const router = express.Router();
const db = require('../../config/dbConnection');  // Conexión a la base de datos
const { isAuthenticated } = require('../../middleware/auth');  // Importar el middleware

// Ruta para crear un producto (protegida)
router.post('/crear', isAuthenticated, async (req, res) => {
    const { nombre, descripcion, precio, imagenUrl, idCategoria, marca } = req.body;
    console.log(req.body);  // Verifica qué datos están llegando al servidor

    if (!nombre || !descripcion || !precio || !imagenUrl || !marca) {
        return res.status(400).json({ message: "Faltan parámetros requeridos" });
    }

    const categoria = idCategoria || null;

    try {
        const [result] = await db.execute(
            `INSERT INTO productos (nombreProducto, descripcionProducto, precio, imagenUrl, idCategoria, marca) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nombre, descripcion, precio, imagenUrl, categoria, marca]
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: "Producto creado exitosamente" });
        } else {
            return res.status(500).json({ message: "Error inesperado al crear el producto" });
        }
    } catch (error) {
        console.error('Error al crear el producto:', error);
        res.status(500).json({ message: "Error al crear el producto" });
    }
});

// Ruta para editar un producto (protegida)
router.post('/editar/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagenUrl, idCategoria, marca } = req.body;

    // Validación de parámetros
    if (!id || !nombre || !descripcion || !precio || !imagenUrl || !marca) {
        return res.status(400).json({ message: "Faltan parámetros requeridos" });
    }

    // Validar que precio sea un número válido
    if (isNaN(precio) || precio <= 0) {
        return res.status(400).json({ message: "El precio debe ser un número positivo" });
    }

    // Actualizar producto en base de datos
    try {
        const [result] = await db.execute(
            `UPDATE productos SET nombreProducto = ?, descripcionProducto = ?, precio = ?, imagenUrl = ?, idCategoria = ?, marca = ? 
             WHERE idProducto = ?`,
            [nombre, descripcion, precio, imagenUrl, idCategoria, marca, id]
        );

        if (result.affectedRows > 0) {
            return res.redirect('/admin'); // Redirigir al dashboard después de editar el producto
        } else {
            return res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ message: "Error al actualizar el producto" });
    }
});

// Ruta para eliminar un producto (protegida)
router.get('/eliminar/:id', isAuthenticated, async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "ID del producto requerido" });
    }

    try {
        const [result] = await db.execute(
            `DELETE FROM productos WHERE idProducto = ?`,
            [id]
        );

        if (result.affectedRows > 0) {
            return res.redirect('/admin'); // Redirigir al dashboard después de eliminar el producto
        } else {
            return res.status(404).json({ message: "Producto no encontrado" });
        }
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ message: "Error al eliminar el producto" });
    }
});



module.exports = router;
