const mysql = require('mysql2');

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
  host: 'autorack.proxy.rlwy.net',  // Host público
  user: 'root',
  password: 'dVUqPIrgSAnrfbVizKFShwlUAvIFuAWm',
  database: 'representacionesv2',
  port: 15694  // Puerto de la URL pública
});

// Conectar a la base de datos
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
  
  // Ejecutar la consulta para obtener las tablas
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error retrieving tables:', err);
      return;
    }
    
    // Mostrar las tablas en la consola
    console.log('Tables in database:', results);
    
    // Cerrar la conexión después de la consulta
    connection.end();
  });
});
