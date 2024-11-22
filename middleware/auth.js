// middleware/auth.js

// Middleware para verificar si el usuario está autenticado
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();  // El usuario está autenticado, puede continuar
    }
    res.redirect('/login');  // Si no está autenticado, redirige al login
}

module.exports = { isAuthenticated };
