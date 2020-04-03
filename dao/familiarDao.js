const genericDao = require('./genericDao');

const QUERY_ALUMNO_FAMILIAR =
    `    
    select rel.id,
        f.nombre as nombre_familiar,
        f.correo as correo_familiar,
        al.nombre as nombre_alumno,
        al.apellidos as apellidos_alumno,
        g.id as id_grupo,
        g.nombre as nombre_grupo,
        (select count(rec.*) 
            from co_recurso_actividad_grupo rec where al.co_grupo = rec.co_grupo and  rec.eliminado = false	
        ) as contador_recursos
    from co_alumno_familiar rel inner join co_alumno al on al.id = rel.co_alumno
                    inner join co_familiar f on f.id = rel.co_familiar
                    inner join co_grupo g on g.id = al.co_grupo
    where rel.co_familiar = $1 and rel.eliminado = false and f.eliminado = false `;

const getAlumnosPorFamiliar = (idFamiliar) => {
    console.log("@getAlumnosPorFamiliar ID familiar "+idFamiliar);
    return genericDao.findAll(QUERY_ALUMNO_FAMILIAR, [idFamiliar]);
};

module.exports = {
    getAlumnosPorFamiliar
}