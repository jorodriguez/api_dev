const genericDao = require('./genericDao');

const obtenerAsistenciaUsuario = (coSucursal, fechaInicio, fechaFin) => {
    console.log("fecha inicio "+fechaInicio);
    console.log("fecha fin "+fechaFin);
    return genericDao.findAll(`
    with rango_dias as (
		select g::date as dia FROM generate_series($2::date,$3::date, '1 day') g
    ), 
    asistencia as (
        select to_char(r.dia,'DD')::int as no_dia,
        (r.dia::date)::text as fecha,				
        r.dia,
        u.nombre,	
        to_char(au.hora_entrada,'HH24:MI AM') as hora_entrada,
        to_char(au.hora_salida,'HH24:MI AM') as hora_salida,
        au.comentario_entrada,
        au.comentario_salida
        u.eliminado,
        u.motivo_baja,
        u.fecha_baja::text
    from rango_dias r inner join co_asistencia_usuario au on au.fecha = r.dia
          inner join usuario u on u.id = au.usuario 
    where u.visible_reporte 	 
	 		and au.fecha between $2::date and $3::date
	 		and u.co_sucursal = $1
	 		and au.eliminado = false		
		order by au.hora_entrada::time asc,u.nombre asc
 ), agrupado as(
            select a.dia,array_to_json(array_agg(to_json(a.*))) as asistencias
            from asistencia a
            group by a.dia
 ) select (rango.dia::date)::text as dia_id,
        to_char(rango.dia,'TMDay') name_day,
        EXTRACT(DOW FROM rango.dia) day_of_week, 
        a.asistencias
        from rango_dias rango left join agrupado a on rango.dia = a.dia
        
`, [coSucursal,new Date(fechaInicio),new Date(fechaFin)]);

};


const obtenerUsuariosAsistencias = (coSucursal) => {
    
    return genericDao.findAll(`    
        select 
            u.id,
            s.nombre as sucursal,
            u.nombre,
            u.correo,
            u.eliminado,
            u.permiso_gerente,
            tipo.nombre as tipo,
            u.hora_entrada,
            u.hora_salida,
            u.motivo_baja,
            u.fecha_baja,
            u.acceso_sistema,
            round(u.sueldo_mensual,2) as sueldo_mensual,
            round(u.sueldo_quincenal,2) as sueldo_quincenal,
            u.visible_reporte
        from usuario u inner join co_sucursal s on s.id = u.co_sucursal
                        inner join cat_tipo_usuario tipo on tipo.id = u.cat_tipo_usuario
        where u.co_sucursal = $1
        order by u.eliminado, u.nombre 			 	
`, [coSucursal]);

};
module.exports = {
    obtenerAsistenciaUsuario,
    obtenerUsuariosAsistencias
};