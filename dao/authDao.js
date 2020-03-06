const genericDao = require('./genericDao');

const  CONDICION_LOGIN =  'TRIM(u.correo) = TRIM($1)';
const  CONDICION_ID =  'u.id = $1';
const getQueryBase = (condicion) => {
    return `
    SELECT u.id,
            u.nombre,
            u.correo,
            u.password,
            u.co_sucursal,
            u.permiso_gerente,
            su.nombre AS nombre_sucursal,
            em.id AS id_empresa,
            em.nombre as nombre_empresa,
            (select count(r.*)
                from si_usuario_sucursal_rol r							
                where r.usuario = u.id and r.eliminado = false)	
            AS contador_sucursales,
            (
				select  array_to_json(array_agg(distinct r.co_sucursal))
                from si_usuario_sucursal_rol r
                where r.usuario = u.id and r.eliminado = false
				
			)	
            AS sucursales
    FROM usuario u inner join co_sucursal su on u.co_sucursal = su.id
      inner join co_empresa em on em.id = u.co_empresa    
    WHERE ${condicion}
        AND u.acceso_sistema = true 
        AND u.activo = true
        AND u.eliminado = false 
`;

};

const login = (correo) => {
    return genericDao
        .findOne(getQueryBase(CONDICION_LOGIN), [correo]);
};

const refreshLogin = (id) => {
    return genericDao
        .findOne(getQueryBase(CONDICION_ID), [id]);
};


const obtenerSucursalesUsuario = (id) => {
    return genericDao
        .findAll(`        
        SELECT
            u.id as id_usuario,
            u.nombre as nombre_usuario,
            suc.id as id_sucursal,	
            suc.nombre as nombre_sucursal,
            coalesce(suc.foto,'#') as foto,
            coalesce(suc.class_color,'') as class_color,
            (
                SELECT count(*)
			        from co_alumno a 
			        where a.co_sucursal = suc.id
	  		        and a.eliminado = false
		    ) AS contador_alumnos,
		    (
                SELECT count(a.*) 
			    from co_asistencia a inner join co_alumno alum on alum.id = a.co_alumno
			    where a.fecha = getDate('')
					and alum.co_sucursal = 1
					and a.eliminado = false
				and alum.eliminado = false
		    ) AS contador_asistencia_alumnos, 
            array_to_json(
                array_agg(row_to_json(rol.*))
        ) as roles
        FROM si_usuario_sucursal_rol r inner join usuario u on u.id = r.usuario
                                inner join co_sucursal  suc on suc.id = r.co_sucursal
                                inner join si_rol rol on rol.id = r.si_rol
        WHERE r.usuario = $1
            AND r.co_sucursal <> u.co_sucursal 
            AND u.acceso_sistema = true 
            AND u.activo = true
            AND u.eliminado = false
            and rol.eliminado = false
            group by suc.id,u.id`, [id]);
};


const cambiarSucursalUsuario = (idUsuario, idSucursal) => {
    return genericDao
        .execute(`
            UPDATE usuario
            SET CO_SUCURSAL = $2,
                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                modifico = $1
            WHERE id = $1 RETURNING id;`,
            [idUsuario, idSucursal]);
};



module.exports = {
    login,
    obtenerSucursalesUsuario,
    cambiarSucursalUsuario,
    refreshLogin
};

