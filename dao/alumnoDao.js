
const { getQueryInstance } = require('../services/sqlHelper');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');
const genericDao = require('./genericDao');

const QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO =
    `SELECT  	a.id,
                a.nombre as nombre_alumno,		
                a.co_sucursal, 
                string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                array_to_json(array_agg(to_json(fam.token))) as tokens
     FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                            inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                            inner join co_alumno a on a.id = rel.co_alumno
    WHERE co_alumno = ANY($1::int[]) --and envio_recibos
            and co_parentesco in (1,2) -- solo papa y mama
            and fam.eliminado = false 
            and rel.eliminado = false
    group by a.nombre,a.id `;

const getCorreosTokensAlumno = (idAlumno) => {
    console.log("@getCatalogoTipoGasto");
    return genericDao.findOne(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [idAlumno]);
};

const actualizarProximaFechaLimitePagoMensualidadAlumno = (idAlumno,genero) => {
    console.log("@actualizarProximaFechaLimitePagoMensualidadAlumno");

       return genericDao.execute(` UPDATE co_alumno 
                             SET 
                                fecha_limite_pago_mensualidad = (fecha_limite_pago_mensualidad + INTERVAL '1 month')
                                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                modifico = $2
                             WHERE id = $1 RETURNING id;`
        , [idAlumno, genero]);        
};

const modificarFechaLimitePagoMensualidadAlumno = (idAlumno,fecha,genero) => {
    console.log("@modificarFechaLimitePagoMensualidadAlumno");

       return genericDao.execute(` 
                            UPDATE co_alumno 
                             SET 
                                fecha_limite_pago_mensualidad = $2::date                                
                                numero_dia_limite_pago = to_char($2::date,'dd')::integer,
                                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                modifico = $3
                             WHERE id = $1 RETURNING id;`
        , [idAlumno,new Date(fecha), genero]);        
};


module.exports = {
    getCorreosTokensAlumno,actualizarProximaFechaLimitePagoMensualidadAlumno,
    modificarFechaLimitePagoMensualidadAlumno

}