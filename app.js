const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./config/dbConnection');
const flash = require('connect-flash');
const app = express();

// Rutas
const productosRoutes = require('./routes/productos/productos');
const registroRoutes = require('./routes/registrate/registrate');
const crud = require('./routes/productos/crud');
const perfilRoutes = require('./routes/perfil');

// Middleware
const isAuthenticated = require('./middleware/isAuthenticated');

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/principal'), path.join(__dirname, 'views/forms')]);

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de express-session
app.use(session({
    secret: 'tu-clave-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Cambiar a true si usas HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

// Rutas
app.use('/productos', productosRoutes);
app.use('/registrate', registroRoutes);
app.use('/admin', crud);
app.use('/perfil', perfilRoutes); // Rutas para el perfil

// Ruta para el inicio de sesión (POST)
app.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        if (!correo || !contraseña) {
            return res.status(400).send({ message: 'Correo electrónico y contraseña son requeridos.' });
        }

        const [usuario] = await db.execute(
            'SELECT u.idUsuarios, u.contraseña, p.Nombre, p.Apellido FROM usuarios u JOIN personas p ON u.idPersona = p.idPersona WHERE p.Correo = ?',
            [correo]
        );

        if (usuario.length === 0) {
            return res.status(400).send({ message: 'Correo electrónico o contraseña incorrectos.' });
        }

        const esCorrecta = await bcrypt.compare(contraseña, usuario[0].contraseña);
        if (!esCorrecta) {
            return res.status(400).send({ message: 'Correo electrónico o contraseña incorrectos.' });
        }

        req.session.userId = usuario[0].idUsuarios;
        req.session.userName = usuario[0].Nombre;

        console.log('Usuario autenticado:', req.session);

        res.redirect('/perfil');
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// Ruta GET para el login (formulario de login)
app.get('/login', (req, res) => {
    res.render('login');
});

// Página de inicio
app.get('/', (req, res) => res.render('index'));

// Rutas de administración
app.get('/admin', async (req, res) => {
    try {
        const [productos] = await db.execute(
            `SELECT idProducto, nombreProducto AS nombre, descripcionProducto AS descripcion, 
                    CAST(precio AS DECIMAL(10,2)) AS precio, imagenUrl 
             FROM productos`
        );
        res.render('crud', { productos });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error al obtener productos');
    }
});

// Ruta para ver el perfil
app.get('/perfil', isAuthenticated, async (req, res) => {
    try {
        const [usuario] = await db.execute(
            `SELECT u.idUsuarios, p.Nombre, p.Apellido, p.Telefono, p.Correo 
             FROM usuarios u 
             JOIN personas p ON u.idPersona = p.idPersona
             WHERE u.idUsuarios = ?`, [req.session.userId]
        );

        if (usuario.length > 0) {
            res.render('perfil', { usuario: usuario[0], message: req.flash('message') });
        } else {
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error al obtener datos del perfil:', error);
        res.status(500).send('Error al cargar el perfil');
    }
});

// Ruta para editar el perfil (POST)
app.post('/perfil/editar', isAuthenticated, async (req, res) => {
    const { nombre, apellido, telefono, correo } = req.body;
    try {
        // Validación del correo electrónico
        if (!validator.isEmail(correo)) {
            req.flash('message', { type: 'alert-danger', text: 'Correo electrónico inválido.' });
            return res.redirect('/perfil');
        }

        // Actualizar los datos del perfil en la base de datos
        await db.execute(
            `UPDATE personas SET Nombre = ?, Apellido = ?, Telefono = ?, Correo = ? 
             WHERE idPersona = (SELECT idPersona FROM usuarios WHERE idUsuarios = ?)`,
            [nombre, apellido, telefono, correo, req.session.userId]
        );

        req.flash('message', { type: 'alert-success', text: 'Perfil actualizado correctamente.' });
        res.redirect('/perfil');
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        req.flash('message', { type: 'alert-danger', text: 'Error al actualizar el perfil. Inténtalo de nuevo.' });
        res.redirect('/perfil');
    }
});

// Ruta para cerrar sesión
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return res.status(500).send({ message: 'Error al cerrar sesión.' });
        }
        res.clearCookie('connect.sid'); // Limpia la cookie de sesión
        res.redirect('/login'); // Redirigir al login
    });
});

// Otras rutas
app.get('/registrate', (req, res) => res.render('registrate'));
app.get('/descuentos', (req, res) => res.render('descuentos'));

// Ruta para ver el carrito
app.get('/carrito', isAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    res.render('carrito', { cart, total, message: req.flash('message') });
});

// Ruta para agregar un producto al carrito
app.post('/carrito/agregar', isAuthenticated, async (req, res) => {
    const { productoId, cantidad } = req.body;

    try {
        const cantidadNumerica = parseInt(cantidad, 10);
        if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
            return res.status(400).send('Cantidad inválida');
        }

        const [producto] = await db.execute(
            `SELECT idProducto, nombreProducto, precio FROM productos WHERE idProducto = ?`,
            [productoId]
        );

        if (producto.length === 0) {
            return res.status(404).send('Producto no encontrado');
        }

        const item = producto[0];
        const precioNumerico = parseFloat(item.precio);

        if (!req.session.cart) {
            req.session.cart = [];
        }

        const index = req.session.cart.findIndex(p => p.idProducto === item.idProducto);

        if (index !== -1) {
            req.session.cart[index].cantidad += cantidadNumerica;
        } else {
            req.session.cart.push({
                idProducto: item.idProducto,
                nombreProducto: item.nombreProducto,
                precio: precioNumerico,
                cantidad: cantidadNumerica
            });
        }

        res.redirect('/carrito');
    } catch (err) {
        console.error('Error al agregar al carrito:', err);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para eliminar un producto del carrito
app.post('/carrito/eliminar', isAuthenticated, (req, res) => {
    const { productoId } = req.body;

    if (!req.session.cart) {
        return res.redirect('/carrito');
    }

    req.session.cart = req.session.cart.filter(item => item.idProducto !== productoId);

    res.redirect('/carrito');
});

// Ruta para vaciar el carrito
app.post('/carrito/vaciar', isAuthenticated, (req, res) => {
    req.session.cart = [];
    res.redirect('/carrito');
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Upss, Error!');
});

// Inicia el servidor
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en el puerto ${app.get('port')}`);
});
