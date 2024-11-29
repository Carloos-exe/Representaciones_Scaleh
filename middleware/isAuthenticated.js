// middleware/isAuthenticated.js
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        console.log('autenthicado');       
        return next(); // El usuario está autenticado, permite continuar
    }
    console.log('No authenticado');   
    res.redirect('/login'); // Si no está autenticado, redirige al login
}

module.exports = isAuthenticated;
