module.exports = {
    ensureRole: (rolesPermitidos) => (req, res, next) => {
        if (!req.session.userRol || !rolesPermitidos.includes(req.session.userRol)) {
            return res.status(403).render('error', { message: 'Acceso denegado. No tienes los permisos necesarios.' });
        }
        next();
    },
};
