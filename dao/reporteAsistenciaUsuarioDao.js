const genericDao = require('./genericDao');

const obtenerAsistenciaUsuario = (coSucursal, fechaInicio, fechaFin) => {
    console.log("fecha inicio "+fechaInicio);
    console.log("fecha fin "+fechaFin);
    return genericDao.findAll(`
    with asistencias as(
        select au.*
        from co_asistencia_usuario au  inner join usuario u on u.id = au.usuario	
        where au.fecha between $2::date and $3::date 
                and u.visible_reporte
                and u.co_sucursal = $1
                and au.eliminado = false
    ) select u.nombre,
                to_char(u.fecha_genero,'yyyy-MM-dd') as fecha_registro,
                to_char(
                    (select min(fecha) from co_asistencia_usuario where usuario = u.id and eliminado = false),
                    'yyyy-MM-dd'
                    )  as primer_asistencia,						
                to_char(     
                    (select max(fecha) from co_asistencia_usuario where usuario = u.id and eliminado = false),
                    'yyyy-MM-dd'
                    ) as ultima_asistencia,						
                count(au.fecha) as asistencias,
                u.activo,
                to_char(u.fecha_baja,'yyyy-MM-dd') as fecha_baja,
                u.motivo_baja,
                u.eliminado as eliminado
    from usuario u left join asistencias au on u.id = au.usuario
    where u.visible_reporte
            and u.co_sucursal = $1
    group by u.id,u.eliminado,u.nombre,u.fecha_genero,u.fecha_baja,u.motivo_baja,u.activo
    order by u.eliminado, u.nombre,u.fecha_genero,u.fecha_baja`, [coSucursal,new Date(fechaInicio),new Date(fechaFin)]);

};

module.exports = {
    obtenerAsistenciaUsuario
};