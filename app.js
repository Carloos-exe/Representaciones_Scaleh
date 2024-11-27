const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./config/dbConnection');
const flash = require('connect-flash');
const helmet = require('helmet');
const validator = require('validator');
const isAuthenticated = require('./middleware/isAuthenticated');
const productosRoutes = require('./routes/productos/productos');
const registroRoutes = require('./routes/registrate/registrate');
const crud = require('./routes/productos/crud');
const perfilRoutes = require('./routes/perfil');
const carritoRoutes = require('./routes/carrito'); // Nueva ruta para el carrito
const buscarRoutes = require('./routes/productos/buscarProducto')
const clientesRoutes = require('./routes/clientes/clientes');



const app = express();

// Configuraciones
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, 'views/principal'), 
    path.join(__dirname, 'views/forms'), 
    path.join(__dirname, 'views/admin')
]);


// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
  });

  
// Configuración de express-session
app.use(session({
    secret: 'tu-clave-secreta',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Asegúrate de usar HTTPS en producción
        maxAge: 1000 * 60 * 60 * 24 // 1 día
    }
}));

// Rutas
app.use('/productos', productosRoutes);
app.use('/registrate', registroRoutes);
app.use('/perfil', perfilRoutes);
app.use('/admin', crud);
app.use('/carrito', carritoRoutes);
app.use('/buscar', buscarRoutes);
app.use('/admin/clientes', clientesRoutes);  




// Ruta para el inicio de sesión (POST)
app.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        if (!correo || !contraseña) {
            return res.status(400).send({ message: 'Correo electrónico y contraseña son requeridos.' });
        }

        const [usuario] = await db.execute(
            `SELECT u.idUsuarios, u.contraseña, u.userRol, p.Nombre, p.Apellido 
             FROM usuarios u 
             JOIN personas p ON u.idPersona = p.idPersona 
             WHERE p.Correo = ?`,
            [correo]
        );

        if (usuario.length === 0) {
            return res.status(400).send({ message: 'Correo electrónico o contraseña incorrectos.' });
        }

        const esCorrecta = await bcrypt.compare(contraseña, usuario[0].contraseña);
        if (!esCorrecta) {
            return res.status(400).send({ message: 'Correo electrónico o contraseña incorrectos.' });
        }

        req.session.regenerate((err) => {
            if (err) {
                console.error('Error al regenerar sesión:', err);
                return res.status(500).send('Error interno del servidor');
            }
            req.session.userId = usuario[0].idUsuarios;
            req.session.userName = usuario[0].Nombre;
            req.session.userRol = usuario[0].userRol; // Guardar el rol en la sesión

            // Redirigir según el rol del usuario
            if (req.session.userRol === 'admin') {
                return res.redirect('/admin');  // Redirige a /admin para el administrador
            } else {
                return res.redirect('/perfil');  // Redirige al perfil para otros usuarios
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
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

        // Validación del teléfono
        if (!validator.isMobilePhone(telefono, 'es-MX')) {
            req.flash('message', { type: 'alert-danger', text: 'Teléfono inválido.' });
            return res.redirect('/perfil');
        }

        // Actualizar los datos del perfil en la base de datos
        await db.execute(
            `UPDATE personas SET Nombre = ?, Apellido = ?, Telefono = ?, Correo = ? 
             WHERE idPersona = (SELECT idPersona FROM usuarios WHERE idUsuarios = ?)` ,
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

// Página de inicio
app.get('/', (req, res) => res.render('index'));

const { ensureRole } = require('./middleware/roles');

// Rutas de administración protegidas
app.get('/admin', isAuthenticated, ensureRole(['admin', 'trabajador']), async (req, res) => {
    try {
        const [productos] = await db.execute(
            `SELECT idProducto, nombreProducto AS nombre, descripcionProducto AS descripcion, 
                    CAST(precio AS DECIMAL(10,2)) AS precio, imagenUrl 
             FROM productos`
        );
        res.render('dashboard',  { productos: JSON.stringify(productos) });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).send('Error al obtener productos');
    }
});



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

app.get('/admin/salir', (req, res) => {
    // Verifica si el usuario tiene el rol de administrador
    if (req.session.userRol === 'admin') {
        // Cierra la sesión de administrador
        req.session.destroy(err => {
            if (err) {
                console.error('Error al cerrar sesión de administrador:', err);
                return res.status(500).send({ message: 'Error al cerrar sesión.' });
            }
            res.clearCookie('connect.sid'); // Limpia la cookie de sesión
            res.redirect('/login'); // Redirige al login
        });
    } else {
        // Si el usuario no es administrador, redirige
        res.status(403).send('Acceso no autorizado');
    }
});

// Ruta GET para el login
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/registrate', (req, res) => res.render('registrate'));

// Ruta para descuentos
app.get('/descuentos', (req, res) => res.render('descuentos'));

// Página de inicio
app.get('/', (req, res) => res.render('index'));

// Middleware global de manejo de errores
app.use((req, res) => {
    res.status(404).render('404', { message: 'Página no encontrada' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Ocurrió un error, por favor intenta más tarde.' 
        : err.message;
    res.status(status).send({ error: { message, status } });
});

app.use((req, res) => {
    res.status(404).send('<h1>404 - Página No Encontrada</h1>');
});

// Exportar la aplicación para Vercel
module.exports = app;
