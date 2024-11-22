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
