const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: "carlosSolis",
    password: "supernova",
    database: "representacionesv2"
});

db.connect((err) => {
    if (err) throw err;
    console.log('Conectado a la base de datos');
});

module.exports = db;
