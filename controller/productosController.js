const db = require('../config/dbConnection');

// Función para obtener productos de la base de datos
const getProductos = (req, res) => {
    db.query('SELECT * FROM Productos', (err, results) => {
        if (err) {
            console.error('Error al obtener productos:', err);
            res.status(500).send('Error al obtener productos');
        } else {
            res.render('productos', { productos: results }); // Renderiza la vista de productos y pasa los datos
        }
    });
};

module.exports = {
    getProductos
};
