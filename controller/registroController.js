const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/dbConnection'); // Conexión a la base de datos
const router = express.Router();

router.post('/registrate', (req, res) => {
    const { nombre, apellido, telefono, correo, nombreUsuario, contraseña } = req.body;

    // Obtener el idPersona de la persona recién insertada
const idPersona = result.insertId;
console.log(`idPersona obtenido: ${idPersona}`);  // Verifica si está obteniendo el valor correcto

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
            db.query('INSERT INTO clientes (idPersona) VALUES (?)', [idPersona], (err, result) => {
                if (err) {
                    console.error('Error al registrar cliente:', err);
                    return res.status(500).send('Error al registrar cliente');
                }
                
                // Verificar que el cliente se haya insertado correctamente
                console.log(`Cliente creado con idPersona: ${idPersona}`);
                
                // Insertar el usuario en la tabla usuarios
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
