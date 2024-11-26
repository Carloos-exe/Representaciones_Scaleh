const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../../config/dbConnection'); // Ajusta según la ubicación de tu archivo de conexión a la DB

// Manejar la solicitud POST para registrar un usuario
router.post('/', async (req, res) => {
    const { nombreCompleto, correo, telefono, nombreUsuario, contraseña } = req.body;

    try {
        // Validar datos de entrada
        if (!nombreCompleto || !correo || !nombreUsuario || !contraseña) {
            return res.status(400).send({ message: 'Todos los campos obligatorios deben ser completados.' });
        }

        // Dividir nombre completo en nombre y apellido
        const [nombre, ...apellidos] = nombreCompleto.split(' ');
        const apellido = apellidos.join(' ') || 'Sin apellido';

        // Verificar si el correo ya existe
        const [usuarioExistente] = await db.execute(
            'SELECT idPersona FROM personas WHERE correo = ?',
            [correo]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).send({ message: 'El correo ya está registrado.' });
        }

        // Verificar si el nombre de usuario ya existe
        const [usuarioDuplicado] = await db.execute(
            'SELECT idUsuarios FROM usuarios WHERE nombreUsuario = ?',
            [nombreUsuario]
        );

        if (usuarioDuplicado.length > 0) {
            return res.status(400).send({ message: 'El nombre de usuario ya está en uso.' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        // Insertar datos en la tabla personas
        const [personaResult] = await db.execute(
            'INSERT INTO personas (Nombre, Apellido, Telefono, Correo) VALUES (?, ?, ?, ?)',
            [nombre, apellido, telefono || null, correo]
        );

        // Obtener el idPersona generado
        const idPersona = personaResult.insertId;

        // Insertar datos en la tabla usuarios
        await db.execute(
            'INSERT INTO usuarios (idPersona, contraseña, nombreUsuario, userRol) VALUES (?, ?, ?, ?)',
            [idPersona, hashedPassword, nombreUsuario, 'cliente'] // Asignar rol "cliente" por defecto
        );

        // Insertar datos en la tabla clientes
        await db.execute(
            'INSERT INTO clientes (idPersona) VALUES (?)',
            [idPersona] // Relacionar la persona con el cliente
        );

        // Redirigir al login o enviar respuesta de éxito
        res.status(201).redirect('/login'); // Código 201: Creación exitosa
    } catch (error) {
        console.error('Error al registrar el usuario:', error);

        // Manejar errores específicos de la base de datos
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ message: 'El correo o el nombre de usuario ya están registrados.' });
        }

        // Error genérico
        res.status(500).send({ message: 'Error al registrar el usuario.' });
    }
});

module.exports = router;
