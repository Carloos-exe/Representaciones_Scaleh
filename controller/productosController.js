const db = require('../config/dbConnection');

// Ver perfil
exports.verPerfil = (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login'); // Redirigir si el usuario no está autenticado
    }

    db.query(
        `SELECT u.nombreUsuario, p.Nombre, p.Apellido, p.Correo, p.Telefono 
         FROM Usuarios u 
         JOIN Personas p ON u.idPersona = p.idPersona 
         WHERE u.idUsuarios = ?`,
        [userId],
        (err, result) => {
            if (err) {
                console.error('Error al cargar el perfil:', err);
                return res.status(500).render('error', { message: 'Error al cargar el perfil.' });
            }

            if (result.length === 0) {
                return res.status(404).render('error', { message: 'Perfil no encontrado.' });
            }

            res.render('perfil', { usuario: result[0], message: req.session.message || null });
            req.session.message = null; // Limpiar el mensaje después de mostrarlo
        }
    );
};



// Editar perfil
exports.editarPerfil = (req, res) => {
    const userId = req.session.userId;
    const { nombre, apellido, correo, telefono } = req.body;

    if (!userId) {
        return res.redirect('/login'); // Redirigir si el usuario no está autenticado
    }

    // Validar entradas del usuario
    if (!nombre || !apellido || !correo || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(correo)) {
        return res.status(400).render('perfil', {
            usuario: { Nombre: nombre, Apellido: apellido, Correo: correo, Telefono: telefono },
            message: 'Por favor, completa todos los campos con datos válidos.'
        });
    }

    // Actualizar la información en la base de datos
    db.query(
        `UPDATE Personas 
         SET Nombre = ?, Apellido = ?, Correo = ?, Telefono = ? 
         WHERE idPersona = (SELECT idPersona FROM Usuarios WHERE idUsuarios = ?)`,
        [nombre, apellido, correo, telefono, userId],
        (err) => {
            if (err) {
                console.error('Error al actualizar el perfil:', err);
                return res.status(500).render('error', { message: 'Error al actualizar el perfil.' });
            }

            req.session.message = 'Perfil actualizado correctamente.';
            res.redirect('/perfil'); // Redirigir a la vista del perfil
        }
    );
};


// productosController.js

const productosController = {
    // Función para mostrar productos con paginación
    async mostrarProductos(req, res) {
        const productosPorPagina = 10;  // Número de productos por página
        const pagina = parseInt(req.query.pagina) || 1;  // Página actual (por defecto, página 1)

        // Calcular el índice de inicio de la consulta
        const inicio = (pagina - 1) * productosPorPagina;

        try {
            // Obtener los productos de la base de datos (paginados)
            const productos = await db.query('SELECT * FROM productos LIMIT ?, ?', [inicio, productosPorPagina]);

            // Asegurarse de que cada precio se convierte a número
            productos.forEach(producto => {
                producto.precio = parseFloat(producto.precio); // Asegura que el precio sea un número
            });

            // Obtener el total de productos para calcular cuántas páginas son necesarias
            const [totalProductos] = await db.query('SELECT COUNT(*) AS total FROM productos');
            const totalPáginas = Math.ceil(totalProductos[0].total / productosPorPagina);

            // Renderizar la vista con los productos y la información de la paginación
            res.render('principal/productos', {
                productos,
                pagina,
                totalPáginas
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al obtener los productos");
        }
    }
};



module.exports = productosController;

