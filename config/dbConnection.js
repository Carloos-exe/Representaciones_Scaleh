const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: "localhost",
    user: "carlosSolis",
    password: "supernova",
    database: "representacionesv2",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;
