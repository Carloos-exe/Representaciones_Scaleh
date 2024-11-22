const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/dbConnection'); // Conexión a la base de datos
const router = express.Router();

router.post('/registrate', (req, res) => {
    const { nombre, apellido, telefono, correo, nombreUsuario, contraseña } = req.body;

    // Verificar si ya existe un correo registrado
    db.query('SELECT * FROM personas WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('Error al verificar correo:', err);
            return res.status(500).send('Error al verificar correo');
        }

        if (results.length > 0) {
            return res.status(400).send('Correo ya registrado');
        }

        // Cifrar la contraseña antes de almacenarla
        bcrypt.hash(contraseña, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error al cifrar la contraseña:', err);
                return res.status(500).send('Error al cifrar la contraseña');
            }

            // Insertar la persona en la base de datos
            db.query('INSERT INTO personas (nombre, apellido, telefono, correo) VALUES (?, ?, ?, ?)', 
                [nombre, apellido, telefono, correo], (err, result) => {
                    if (err) {
                        console.error('Error al insertar persona:', err);
                        return res.status(500).send('Error al registrar persona');
                    }

                    // Obtener el idPersona de la persona recién insertada
                    const idPersona = result.insertId;

                    // Insertar el usuario en la tabla usuarios con idPersona y la contraseña cifrada
                    db.query('INSERT INTO usuarios (idPersona, contraseña, nombreUsuario, userRol) VALUES (?, ?, ?, ?)', 
                        [idPersona, hashedPassword, nombreUsuario, 'usuario'], (err) => {
                            if (err) {
                                console.error('Error al insertar usuario:', err);
                                return res.status(500).send('Error al registrar usuario');
                            }

                            res.redirect('/login'); // Redirigir al login después del registro exitoso
                        });
                });
        });
    });
});

module.exports = router;
