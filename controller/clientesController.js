const db = require('../config/dbConnection'); // Asegúrate de que la ruta sea correcta
const express = require('express');
// const db = require('../config/dbConnection'); // Conexión a la base de datos

// Obtener todos los clientes
exports.getClientes = async (req, res) => {
    try {
        const [clientes] = await db.execute(`
            SELECT c.idCliente, p.Nombre, p.Apellido, p.Telefono, p.Correo
            FROM clientes c
            INNER JOIN personas p ON c.idPersona = p.idPersona
        `);
        res.render('clientes', { clientes }); // Renderiza la vista 'clientes' con los datos
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).send('Error al obtener los clientes');
    }
};

// Obtener un cliente por ID
exports.getClienteById = async (req, res) => {
    const { id } = req.params;

    try {
        const [cliente] = await db.execute(`
            SELECT c.idCliente, p.Nombre, p.Apellido, p.Telefono, p.Correo
            FROM clientes c
            INNER JOIN personas p ON c.idPersona = p.idPersona
            WHERE c.idCliente = ?
        `, [id]);

        if (cliente.length === 0) {
            return res.status(404).send('Cliente no encontrado');
        }

        res.render('editarCliente', { cliente: cliente[0] }); // Renderiza la vista 'editarCliente' con los datos del cliente
    } catch (error) {
        console.error('Error al obtener el cliente:', error);
        res.status(500).send('Error al obtener el cliente');
    }
};

// Actualizar cliente
exports.updateCliente = async (req, res) => {
    const { id } = req.params;
    const { Nombre, Apellido, Telefono, Correo } = req.body;

    if (!Nombre || !Apellido || !Telefono || !Correo) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    try {
        await db.execute(`
            UPDATE personas p
            INNER JOIN clientes c ON p.idPersona = c.idPersona
            SET p.Nombre = ?, p.Apellido = ?, p.Telefono = ?, p.Correo = ?
            WHERE c.idCliente = ?
        `, [Nombre, Apellido, Telefono, Correo, id]);

        res.redirect('/admin/clientes'); // Redirige a la lista de clientes
    } catch (error) {
        console.error('Error al actualizar el cliente:', error);
        res.status(500).send('Error al actualizar el cliente');
    }
};

// Eliminar cliente
exports.deleteCliente = async (req, res) => {
    const { id } = req.params;

    try {
        await db.execute(`
            DELETE c, p
            FROM clientes c
            INNER JOIN personas p ON c.idPersona = p.idPersona
            WHERE c.idCliente = ?
        `, [id]);

        res.redirect('/admin/clientes'); // Redirige a la lista de clientes
    } catch (error) {
        console.error('Error al eliminar el cliente:', error);
        res.status(500).send('Error al eliminar el cliente');
    }
};
