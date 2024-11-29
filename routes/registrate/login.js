// routes/registrate/registrate.js
const express = require('express');
const bcrypt = require('bcrypt'); // Necesario para comparar contraseñas
const db = require('../config/dbConnection'); // Asegúrate de tener la conexión a tu base de datos
const router = express.Router();

// Ruta para mostrar el formulario de login
router.get('/', (req, res) => {
    res.render('login'); // Renderiza el formulario de login
});

// Ruta para procesar el inicio de sesión
router.post('/', (req, res) => {
    console.log('se utiliza esto?');
    
    const { correo, contrasena } = req.body;

    // Consulta para buscar el correo ingresado en la base de datos
    db.query('SELECT * FROM usuarios u JOIN personas p ON u.idPersona = p.idPersona WHERE p.correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).send('Error en el servidor');
        }

        // Si no se encuentra el usuario, enviar mensaje de error
        if (results.length === 0) {
            return res.status(400).send('Correo o contraseña incorrectos');
        }

        const usuario = results[0];

        // Comparar la contraseña ingresada con la contraseña almacenada
        bcrypt.compare(contrasena, usuario.contrasena, (err, isMatch) => {
            if (err) {
                console.error('Error al comparar contraseñas:', err);
                return res.status(500).send('Error en el servidor');
            }

            if (!isMatch) {
                return res.status(400).send('Correo o contraseña incorrectos');
            }

            // Si las credenciales son correctas, guardar los datos en la sesión
            req.session.userId = usuario.idUsuarios;
            req.session.userName = usuario.nombreUsuario;

            // Verifica que la sesión esté siendo guardada
            console.log('Sesion almacenada:', req.session);

            // Redirigir al perfil después de iniciar sesión correctamente
            res.redirect('/perfil');
        });
    });
});

module.exports = router;
