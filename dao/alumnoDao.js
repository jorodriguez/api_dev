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

const ID_CAT_TIPO_COBRO_MENSUAL = 1;
const ID_CAT_TIPO_COBRO_HORAS = 2;

const createAlumno = async(alumnoData = {
    co_sucursal,
    co_grupo,
    nombre,
    apellidos,
    fecha_nacimiento,
    alergias,
    nota,
    hora_entrada,
    hora_salida,
    costo_inscripcion,
    costo_colegiatura,
    minutos_gracia,
    foto,
    fecha_inscripcion,
    cat_genero,
    genero,
    fecha_limite_pago_mensualidad,
    cat_tipo_cobranza,
    tiempo_hora
}) => {
    console.log("@create alumno");


    if (alumnoData.cat_tipo_cobranza == ID_CAT_TIPO_COBRO_HORAS) {
        alumnoData.hora_entrada = '00:00:00';
        alumnoData.hora_salida = '00:00:00';
    }

    const alumnoId = await genericDao.execute(`
      INSERT INTO CO_ALUMNO(
        co_sucursal,
        co_grupo,nombre,
        apellidos,
        fecha_nacimiento,
        alergias,
        nota,
        hora_entrada,
        hora_salida,
        costo_inscripcion,
        costo_colegiatura,
        minutos_gracia,
        foto,
        fecha_inscripcion,
        fecha_reinscripcion,                                      
        cat_genero,
        genero,
        fecha_limite_pago_mensualidad,
        numero_dia_limite_pago,
        cat_tipo_cobranza,
        tiempo_hora) 
     VALUES(
        $1,$2,$3,
        $4,$5,$6,
        $7,$8,$9,
        $10,$11,$12,
        $13,$14,($14::date + interval '1 year')
        ,$15,$16
        ,$17
        ,to_char($17::date,'dd')::integer
        ,$18
        ,$19
    ) RETURNING *;`, [
        alumnoData.co_sucursal, alumnoData.co_grupo, alumnoData.nombre, //3
        alumnoData.apellidos, alumnoData.fecha_nacimiento, alumnoData.alergias, //6 
        alumnoData.nota, alumnoData.hora_entrada, alumnoData.hora_salida, //9
        alumnoData.costo_inscripcion, alumnoData.costo_colegiatura, alumnoData.minutos_gracia, //12
        alumnoData.foto, alumnoData.fecha_inscripcion, //14
        alumnoData.cat_genero, alumnoData.genero, //16
        alumnoData.fecha_limite_pago_mensualidad, //17
        alumnoData.cat_tipo_cobranza, //18
        alumnoData.tiempo_hora //19
    ]);

    console.log("Alumno insetado " + JSON.stringify(alumnoId));

    //--- crear el formato de inscripcion
    console.log("Creando el formato de inscripcion--");
    const formatoInscripcion = await genericDao.execute(`INSERT INTO CO_FORMATO_INSCRIPCION(co_alumno,fecha_genero,genero) VALUES($1,getDate(''),$2) RETURNING *;`, [alumnoId, alumnoData.genero]);

    console.log("Actualizando al alumno con el formato de inscripcion--");
    //actualizar el registro de formato de inscripcion
    await genericDao.execute(`UPDATE CO_ALUMNO  SET co_formato_inscripcion = $2 WHERE id = $1 RETURNING id `, [alumnoId, formatoInscripcion.id]);

    console.log("Creando el balance--");
    //crear el registro de balance
    await genericDao.execute("select insertar_balance_alumno($1::integer,$2::integer)", [alumnoId, alumnoData.genero]);

    return alumnoId;
}




const getCorreosTokensAlumno = (idAlumno) => {
    console.log("@getCorreosTokensAlumno");
    return genericDao.findOne(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [
        [idAlumno]
    ]);
};

const actualizarProximaFechaLimitePagoMensualidadAlumno = (idAlumno, genero) => {
    console.log("@actualizarProximaFechaLimitePagoMensualidadAlumno");

    return genericDao.execute(` UPDATE co_alumno 
                             SET 
                                fecha_limite_pago_mensualidad = (fecha_limite_pago_mensualidad + INTERVAL '1 month'),
                                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                modifico = $2
                             WHERE id = $1 RETURNING id;`, [idAlumno, genero]);
};

const modificarFechaLimitePagoMensualidadAlumno = (idAlumno, fecha, genero) => {
    console.log("@modificarFechaLimitePagoMensualidadAlumno");

    return genericDao.execute(` 
                            UPDATE co_alumno 
                             SET 
                                fecha_limite_pago_mensualidad = $2::date,                                
                                numero_dia_limite_pago = to_char($2::date,'dd')::integer,
                                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                modifico = $3
                             WHERE id = $1 RETURNING id;`, [idAlumno, new Date(fecha), genero]);
};


const modificarFotoPerfil = async(idAlumno, metadaFoto, genero) => {
    console.log("@modificarFotoPerfil");

    console.log("idAlumno " + idAlumno);
    console.log("url " + metadaFoto.secure_url);
    console.log("public_id " + metadaFoto.public_id);
    console.log("genero " + genero);

    let foto = "";
    let public_id_foto = null;
    if (!metadaFoto) {
        foto = await genericDao.execute(`select foto from cat_genero where id = (select cat_genero from co_alumno where id = $1))`), [idAlumno];
    } else {
        foto = metadaFoto.secure_url;
        public_id_foto = metadaFoto.public_id;
    }

    return await genericDao.execute(` 
                            UPDATE co_alumno 
                             SET 
                                foto = $2,                                       
                                public_id_foto = $3,
                                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                modifico = $4
                             WHERE id = $1 RETURNING id;`, [idAlumno, foto, public_id_foto, genero]);
};

const getAlumnoPorId = (idAlumno) => {
    console.log("@destroyFoto");
    return genericDao.findOne(`select * from co_alumno where id = $1;`, [idAlumno]);
};


const activarAlumnoEliminado = (idAlumno, genero) => {
    console.log("@activarAlumnoEliminado");

    return genericDao.execute(` 
                            UPDATE co_alumno 
                             SET                                                     
                                fecha_modifico = current_timestamp,
                                fecha_reactivacion = current_timestamp,
                                eliminado = false,
                                modifico = $2
                             WHERE id = $1 RETURNING id;`, [idAlumno, genero]);
};


const bajaAlumno = (idAlumno, fechaBaja, observaciones, genero) => {

    return genericDao.execute(` 
                            UPDATE co_alumno 
                             SET 
                                fecha_baja =$2::date,                                                                
                                observaciones_baja=$3,
                                fecha_modifico = current_timestamp,                                
                                modifico = $4,
                                eliminado = true
                             WHERE id = $1 RETURNING id;`, [idAlumno, new Date(fechaBaja), observaciones, genero]);
}


module.exports = {
    createAlumno,
    getCorreosTokensAlumno,
    actualizarProximaFechaLimitePagoMensualidadAlumno,
    modificarFechaLimitePagoMensualidadAlumno,
    modificarFotoPerfil,
    getAlumnoPorId,
    bajaAlumno,
    activarAlumnoEliminado

}