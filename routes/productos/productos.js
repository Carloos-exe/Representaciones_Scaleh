const express = require('express');
const router = express.Router();
const buscarProductos = require('./buscarProducto'); // Corrección del nombre
const db = require('../../config/dbConnection'); // Conexión a la base de datos
const upload = require('../../config/multerConfig'); // Middleware para subir imágenes


// Ruta para cargar productos con paginación
router.get('/', async (req, res) => {
    const productosPorPagina = 10;  // Número de productos por página
    let pagina = parseInt(req.query.pagina) || 1;  // Obtener la página actual desde la query
    pagina = Math.max(pagina, 1);  // Asegurarse de que la página sea al menos 1
    const inicio = (pagina - 1) * productosPorPagina;  // Calcular el inicio para LIMIT

    const search = req.query.search || '';  // Capturar el término de búsqueda

    // Verificar que los valores sean numéricos
    console.log('Inicio:', inicio); // Verificar el valor de 'inicio'
    console.log('Productos por página:', productosPorPagina); // Verificar el valor de 'productosPorPagina'
    console.log('Search:', search); // Verificar el término de búsqueda

    if (isNaN(inicio) || isNaN(productosPorPagina)) {
        console.error('Los valores para LIMIT no son válidos:', inicio, productosPorPagina);
        return res.status(400).send('Error en los parámetros de la paginación.');
    }

    try {
        // Asegurarse de que los parámetros sean números antes de pasarlos
        const limit = parseInt(productosPorPagina, 12);
        const offset = parseInt(inicio, 10);

        // Modificar la consulta SQL para manejar el parámetro 'search'
        let consultaSQL = `SELECT * FROM productos WHERE nombreProducto LIKE ? LIMIT ${limit} OFFSET ${offset}`;
        const queryParams = [`%${search}%`];  // Agregar el término de búsqueda

        // Ejecutar la consulta con los valores calculados
        const [productos] = await db.execute(consultaSQL, queryParams);  // Pasar el término de búsqueda a la consulta

        // Obtener el total de productos para calcular las páginas
        let totalProductosQuery = 'SELECT COUNT(*) AS total FROM productos';
        if (search) {
            totalProductosQuery += ' WHERE nombreProducto LIKE ?';
        }
        const [totalProductosResult] = await db.execute(totalProductosQuery, [`%${search}%`]);
        const totalProductos = totalProductosResult[0].total;
        const totalPaginas = Math.ceil(totalProductos / productosPorPagina);

        // Renderizar la vista de productos con los productos y la información de la paginación
        res.render('productos', { 
            productos, 
            pagina, 
            totalPaginas,
            search // Pasar el término de búsqueda a la vista
        });
    } catch (err) {
        console.error('Error al cargar los productos:', err);
        res.status(500).send('Error al cargar los productos');
    }
});






// Ruta para agregar un producto con imagen
router.post('/agregar', upload.single('imagen'), async (req, res) => {
    const { nombreProducto, descripcionProducto, precio, marca } = req.body;
    const imagenUrl = req.file ? `/img/productos/${req.file.filename}` : null;

    try {
        await db.execute(
            `INSERT INTO productos (nombreProducto, descripcionProducto, precio, marca, imagenUrl) 
             VALUES (?, ?, ?, ?, ?)`,
            [nombreProducto, descripcionProducto, precio, marca, imagenUrl]
        );
        req.flash('message', { type: 'alert-success', text: 'Producto agregado correctamente.' });
        res.redirect('/productos');
    } catch (err) {
        console.error('Error al agregar el producto:', err);
        req.flash('message', { type: 'alert-danger', text: 'Error al agregar el producto.' });
        res.redirect('/productos');
    }
});

// Usar las rutas de búsqueda
router.use('/buscar', buscarProductos);

module.exports = router;
