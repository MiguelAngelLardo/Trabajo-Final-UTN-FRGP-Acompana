//una vez autenticado con el tokken validamos si tiene permiso o no para la accion concreta
function requireRole(...rolesPermitidos) {
  return function (req, res, next) {
    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        message: 'No se proporcionó un token de acceso'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ //403 sabe quien es pero no tiene permisos
        ok: false,
        message: 'No tenés permisos para realizar esta acción'
      });
    }
    next();
  };
}

module.exports = requireRole;