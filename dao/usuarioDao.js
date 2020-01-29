const genericDao = require('./genericDao');

function obtenerCorreosPorTema(co_sucursal, id_tema) {
    return genericDao.findAll(`
            SELECT 
                (select array_to_json(array_agg(to_json(u.correo)))
                FROM co_usuario_notificacion un inner join usuario u on u.id = un.usuario
                WHERE un.co_sucursal = $1 and un.co_tema_notificacion = $2
                and un.eliminado = false and u.eliminado = false)
                AS correos_usuarios,	
                (SELECT array_to_json(array_agg(to_json(correo)))
                FROM co_correo_copia_notificacion
                WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false) 
                as correos_copia    
`, [co_sucursal, id_tema])
}


module.exports = {obtenerCorreosPorTema}
