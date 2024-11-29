// middleware/auth.js

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        console.log('auth.js next');
        
        return next();  // El usuario está autenticado, puede continuar
    }
    console.log('auth no log');
    
    res.redirect('/login');  // Si no está autenticado, redirige al login
}

module.exports = { isAuthenticated };
