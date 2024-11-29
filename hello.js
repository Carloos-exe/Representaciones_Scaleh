const bcrypt = require('bcrypt');

const contraseñaIngresada = 'Correa132510#'; // Contraseña ingresada por el usuario
const hashAlmacenado = '$2b$10$WHIqiRaDwrsqm4LQ/BbEu.lZkFlPxUwzab7EROenrgthBM52Mfcg6'; // El hash almacenado en la base de datos

bcrypt.compare(contraseñaIngresada, hashAlmacenado, (err, esCorrecta) => {
    if (err) {
        console.error('Error al comparar la contraseña:', err);
    } else {
        if (esCorrecta) {
            console.log('Contraseña correcta');
        } else {
            console.log('Contraseña incorrecta');
        }
    }
});
