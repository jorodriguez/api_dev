const genericDao = require('./genericDao');

const QUERY_RECURSOS_POR_GRUPO =
    `    
    select r.id,
	        g.id as id_grupo,
	        g.nombre as nombre_grupo,
	        r.url,
	        r.titulo,
	        r.descripcion,
            r.fecha_genero,            
            r.activo,
            r.numero_orden,
            to_char(r.fecha,'dd-MM-YYY') as fecha
        from co_recurso_actividad_grupo r inner join co_grupo g on g.id = r.co_grupo
        where g.id = $1 and r.co_sucursal = $2 and r.eliminado = false and r.activo = true and g.eliminado = false
        order by numero_orden;
    `;

const getRecursosPorGrupo = (idGrupo,idSucursal) => {
    console.log("@getRecursosPorGrupo ID grupo "+idGrupo+" sucursal "+idSucursal);
    return genericDao.findAll(QUERY_RECURSOS_POR_GRUPO, [idGrupo,idSucursal]);
};

module.exports = {
    getRecursosPorGrupo
}