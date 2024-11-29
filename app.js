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

const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

// Crear la aplicación Express
const app = express();

// Crear el cliente de Redis  // Usamos la nueva sintaxis de importación

const redisClient = createClient({
    url: 'rediss://default:AbULAAIjcDE3YTQ5OGRmMjhkZGE0NDcyYjM3YTBjMWUzNzlmODJjYnAxMA@adjusted-chicken-46347.upstash.io:6379'  // Asegúrate de tener la URL correctamente
});

redisClient.on('error', (err) => {
    console.error('Error en Redis:', err);
});

// Conexión a Redis con async/await
async function testRedisConnection() {
    try {
        await redisClient.connect();  // Establecemos la conexión
        console.log('Conexión a Redis establecida');
        
        // Establecer y obtener un valor de Redis
        await redisClient.set('foo', 'bar');
        const value = await redisClient.get('foo');
        console.log('Valor recuperado de Redis:', value);
    } catch (err) {
        console.error('Error al interactuar con Redis:', err);
    }
}

testRedisConnection();




// Configuración de express-session con RedisStore
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET, // Usamos el valor del archivo .env
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Asegura que la cookie solo se use en HTTPS en producción
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
/*app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));*/

process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
});


  
// Configuración de express-session

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
    console.log('sí entra aqui??? app.js');
    
    const { correo, contraseña } = req.body;


    // Validación de entrada
    if (!correo || !contraseña) {
        return res.status(400).json({ error: true, message: 'Correo electrónico y contraseña son requeridos.' });
    }

    try {
        // Consulta a la base de datos
        const [usuarios] = await db.execute(
            `SELECT u.idUsuarios, u.contraseña, u.userRol, p.Nombre, p.Apellido 
             FROM usuarios u 
             JOIN personas p ON u.idPersona = p.idPersona 
             WHERE p.Correo = ?`,
            [correo]
        );

        if (usuarios.length === 0) {
            return res.status(400).json({ error: true, message: 'Correo electrónico o contraseña incorrectos.' });
        }

        const usuario = usuarios[0];

        // Verificación de contraseña
        const esCorrecta = await bcrypt.compare(contraseña, usuario.contraseña);
        if (!esCorrecta) {
            return res.status(400).json({ error: true, message: 'Correo electrónico o contraseña incorrectos.' });
        }

        // Regeneración de sesión
        req.session.regenerate((err) => {
            if (err) {
                console.error('Error al regenerar sesión:', err);
                return res.status(500).json({ error: true, message: 'Error interno del servidor.' });
            }

            // Guardar datos en la sesión
            req.session.userId = usuario.idUsuarios;
            req.session.userName = usuario.Nombre;
            req.session.userRol = usuario.userRol;

            // Redirigir según el rol del usuario
            const redireccion = req.session.userRol === 'admin' ? '/admin' : '/perfil';
            return res.redirect(redireccion);
            console.log('si llega aqui? app.js final login');
            
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ error: true, message: 'Error interno del servidor.' });
    }
});




// Ruta para ver el perfil
app.get('/perfil', isAuthenticated, async (req, res) => {
    try {
        console.log('perfil, llega aqui? que sucedeeee');
        
        // Consulta los datos del usuario desde la base de datos usando el userId de la sesión
        const [usuario] = await db.execute(
            `SELECT u.idUsuarios, p.Nombre, p.Apellido, p.Telefono, p.Correo 
             FROM usuarios u 
             JOIN personas p ON u.idPersona = p.idPersona
             WHERE u.idUsuarios = ?`, [req.session.userId]
        );

        // Verifica si se encontró al usuario
        if (usuario.length > 0) {
            // Si se encontró al usuario, renderiza la vista 'perfil' pasando los datos del usuario y cualquier mensaje flash
            res.render('perfil', { usuario: usuario[0], message: req.flash('message') });
            console.log('if usuario lenght');
            
        } else {
           console.log('error aquí? no se encontro');
           
         
            // Si no se encuentra al usuario, redirige al login
            res.redirect('/login');
        }
    } catch (error) {
        // Manejo de errores de base de datos o cualquier otro error inesperado
        console.error('Error al obtener datos del perfil:', error);
        req.flash('message', 'Hubo un problema al cargar tu perfil. Intenta nuevamente.');
        res.redirect('/perfil'); // Redirige de nuevo a perfil con un mensaje de error
    }
});



// Página de inicio
app.get('/', (req, res) => res.render('index'));



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

const { ensureRole } = require('./middleware/roles');
const { log } = require('console');

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
    console.log('hola será el herror?');
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
