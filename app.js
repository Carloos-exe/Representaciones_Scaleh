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
const carritoRoutes = require('./routes/carrito');
const buscarRoutes = require('./routes/productos/buscarProducto');
const clientesRoutes = require('./routes/clientes/clientes');

// Importación de Redis y connect-redis
const Redis = require('redis');
const RedisStore = require('connect-redis').default;

// Crear la aplicación Express
const app = express();

// Crear el cliente de Redis
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL, // Usar la variable de entorno
});

redisClient.on('error', (err) => console.error('Error en Redis:', err));
redisClient.connect().catch(console.error);




// Configuración de express-session con RedisStore
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'your-secret-key', // Cambia esto por una clave segura
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Segura en producción (HTTPS)
        httpOnly: true,
        maxAge: 1000 * 60 * 60, // 1 hora
    },
}));

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

// Rutas
app.use('/productos', productosRoutes);
app.use('/registrate', registroRoutes);
app.use('/admin', crud);
app.use('/perfil', perfilRoutes);
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
            req.session.userRol = usuario[0].userRol;

            if (req.session.userRol === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/perfil');
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

// Ruta GET para el login
app.get('/login', (req, res) => {
    res.render('login');
});

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

// Exportar la aplicación para Vercel
module.exports = app;
