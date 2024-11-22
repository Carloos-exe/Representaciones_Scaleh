// middleware/isAuthenticated.js
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // El usuario está autenticado, permite continuar
    }
    res.redirect('/login'); // Si no está autenticado, redirige al login
}

module.exports = isAuthenticated;
