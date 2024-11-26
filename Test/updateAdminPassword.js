const bcrypt = require('bcrypt');
const mysql = require('mysql2');

// Aquí, configura tu conexión con la base de datos (ajusta los parámetros de conexión)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'supernova', // Ajusta tu contraseña de MySQL
  database: 'representacionesv2',
});

// Hasheamos la contraseña
const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const updatePassword = async () => {
  const password = 'Correa132510#'; // Contraseña del administrador que necesitas hashear
  const hashedPassword = await hashPassword(password);

  // Ahora actualizamos la contraseña hasheada en la base de datos
  db.execute(
    `UPDATE usuarios SET contraseña = ? WHERE nombreUsuario = ?`,
    [hashedPassword, 'admin'],
    (err, results) => {
      if (err) {
        console.error('Error al actualizar la contraseña:', err);
        return;
      }
      console.log('Contraseña actualizada con éxito:', results);
      db.end();
    }
  );
};

// Ejecutamos la actualización
updatePassword();
