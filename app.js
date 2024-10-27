const express = require('express');
const path = require('path');
const app = express();
const productosRoutes = require('./routes/productos/productos');
const registroRoutes = require('./routes/registrate/registrate');
// const db = require('./config/dbConnection'); // Si necesitas usar tu conexión a la base de datos

// settings
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.set('views', [path.join(__dirname, 'views/principal'), path.join(__dirname, 'views/forms')]);

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 
app.use(express.static(path.join(__dirname, 'public'))); // middleware para archivos estáticos

// routes
app.use(productosRoutes); // Rutas de productos
app.use(registroRoutes);  // Rutas de registro

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/descuentos', (req, res) => {
    res.render('descuentos');
});

app.get('/productos', (req, res) => {
    res.render('productos');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/registrate', (req, res) => {
    res.render('registrate');
});

// middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// start server
app.listen(app.get('port'), () => {
    console.log(`Server on port ${app.get('port')}`);
});
