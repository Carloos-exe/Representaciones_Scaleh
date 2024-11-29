const db = require('../config/dbConnection');
const validator = require('validator'); // Asegúrate de incluir solo una vez el módulo

// Función para ver el perfil
exports.verPerfil = async (req, res) => {
    try {
        const userId = req.session.userId;
        const [usuario] = await db.execute(
            `SELECT u.idUsuarios, p.Nombre, p.Apellido, p.Telefono, p.Correo 
             FROM usuarios u 
             JOIN personas p ON u.idPersona = p.idPersona
             WHERE u.idUsuarios = ?`, [userId]
        );

        if (usuario.length > 0) {
            res.render('perfil', { usuario: usuario[0] });
        } else {
            console.log("debug");
            
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
        res.status(500).send('Error al cargar el perfil');
    }
};

// Función para editar el perfil
exports.editarPerfil = (req, res) => {
    const userId = req.session.userId;
    const { nombre, apellido, telefono, correo } = req.body;

    if (!userId) {
        return res.redirect('/login');
    }

    // Validaciones de entrada
    if (!nombre || !apellido || !telefono || !correo) {
        req.flash('message', { type: 'alert-danger', text: 'Todos los campos son obligatorios.' });
        return res.redirect('/perfil');
    }

    if (!validator.isEmail(correo)) {
        req.flash('message', { type: 'alert-danger', text: 'Correo electrónico inválido.' });
        return res.redirect('/perfil');
    }

    if (!validator.isMobilePhone(telefono, 'es-MX')) {
        req.flash('message', { type: 'alert-danger', text: 'Número de teléfono inválido.' });
        return res.redirect('/perfil');
    }

    // Actualización en la base de datos
    const query = `
        UPDATE Personas 
        SET Nombre = ?, Apellido = ?, Telefono = ?, Correo = ? 
        WHERE idPersona = (SELECT idPersona FROM Usuarios WHERE idUsuarios = ?)
    `;

    db.query(query, [nombre, apellido, telefono, correo, userId], (err) => {
        if (err) {
            console.error('Error al actualizar el perfil:', err);

            if (err.code === 'ER_DUP_ENTRY') {
                req.flash('message', { type: 'alert-danger', text: 'El correo ingresado ya está en uso.' });
            } else {
                req.flash('message', { type: 'alert-danger', text: 'Error al actualizar el perfil. Inténtalo de nuevo.' });
            }

            return res.redirect('/perfil');
        }

        // Actualizar datos en la sesión (opcional)
        req.session.usuario = { ...req.session.usuario, Nombre: nombre, Apellido: apellido, Telefono: telefono, Correo: correo };

        req.flash('message', { type: 'alert-success', text: 'Perfil actualizado correctamente.' });
        res.redirect('/perfil');
    });
};
