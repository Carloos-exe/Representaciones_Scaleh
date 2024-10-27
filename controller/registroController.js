const db = require('../config/dbConnection');
const bcrypt = require('bcrypt');

const registrarUsuario = async (req, res) => {
    const { nombre, apellido, telefono, correo, nombreUsuario, contraseña, confirmarContraseña } = req.body;

    // Verificar si las contraseñas coinciden
    if (contraseña !== confirmarContraseña) {
        return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    try {
        // Verificar si el nombre de usuario ya existe
        const sqlCheckUsuario = 'SELECT * FROM usuarios WHERE nombreUsuario = ?';
        db.query(sqlCheckUsuario, [nombreUsuario], async (err, results) => {
            if (err) {
                console.error('Error al verificar el nombre de usuario:', err);
                return res.status(500).json({ mensaje: 'Error en el servidor' });
            }

            if (results.length > 0) {
                return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso' });
            }

            // Si no hay duplicados, continúa con la inserción
            const hashedPassword = await bcrypt.hash(contraseña, 10);

            // Inserta en la tabla personas
            const sqlInsertPersona = 'INSERT INTO personas (Nombre, Apellido, Telefono, Correo) VALUES (?, ?, ?, ?)';
            db.query(sqlInsertPersona, [nombre, apellido, telefono, correo], (err, result) => {
                if (err) {
                    console.error('Error al agregar la persona:', err);
                    return res.status(500).send('Error al agregar la persona');
                }

                const idPersona = result.insertId;

                // Inserta en la tabla usuarios con la contraseña hasheada
                const sqlInsertUsuario = 'INSERT INTO usuarios (idPersona, contraseña, nombreUsuario) VALUES (?, ?, ?)';
                db.query(sqlInsertUsuario, [idPersona, hashedPassword, nombreUsuario], (err) => {
                    if (err) {
                        console.error('Error al agregar el usuario:', err);
                        return res.status(500).send('Error al agregar el usuario');
                    }

                    // Redirige o responde con éxito
                    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
                });
            });
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({ mensaje: 'Error al registrar el usuario' });
    }
};

module.exports = { registrarUsuario };
// module.EXPORTTS= registrarUsuario;