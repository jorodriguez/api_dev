
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const Joi = require('@hapi/joi');

const config = require('../config/config');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

//GET — /inscripcion/:id_alumno | getFormatoInscripcion()
const getFormatoInscripcion = (id) => {
    console.log("@getFormatoInscripcion");
    try {

        console.log("Consultando asistencia de la suc " + id_sucursal);

        pool.query(
            " SELECT c.*,a.nombre as nombre_alumno,g.nombre as nombre_grupo" +
            " FROM co_formato_inscripcion c inner join co_alumno a on c.co_alumno = a.id" +
            "                                inner join co_grupo g on a.co_grupo = g.id" +
            " WHERE c.id = $1 AND c.eliminado = false",
            [id],
            (error, results) => {
                if (error) {
                    console.log(" error " + error);
                    return null;
                }
                if (results.rowCount > 0) {
                    console.log("results.rows[0] " + results.rows[0]);
                    return results.rows[0];

                } else {
                    console.log("No se encuentra el formato de inscripcion");
                    return null;
                }

            })
    } catch (e) {
        console.log("Error al buscar el formato de inscripcion");
        return null;
    }
};

const createFormatoInscripcion = (request, response) => {
    console.log("@create Formato inscripcion");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const p = getParams(request.body);

        pool.query(
            "  INSERT INTO CO_FORMATO_INSCRIPCION(" +
            "    co_alumno,fecha_inscripcion,hermanos, --3" +
            "    estado_convivencia_padres,servicio_contratar,horario_servicio,--6" +
            "    direccion,resp_escuela_guarderia,resp_esperan_como_institucion,--9" +
            "    resp_circunstancia_especial_familia,resp_participacion_padres,estado_embarazo,--12" +
            "    resp_embarazo_planeado,gateo,edad_comienzo_caminar,edad_comienzo_esfinteres,--15" +
            "    edad_balbuceo,primer_palabra_con_significado,primeras_senas,--18" +
            "    enfermedades,accidentes_graves,dificultad_fisica,--21" +
            "    uso_aparato,tipo_terapia_especial,comportamiento_generales, --24" +
            "    duerme_con,resp_sieta,resp_horario_sieta,--27" +
            "    resp_promedio_horas_dueme,resp_numero_comidas_dia,resp_horas_tv,--30" +
            "    resp_programas_favoritos,resp_actividades_fin_semana,resp_habilidades, --33" +
            "    informacion_adicional,nota_celebracion_dia,--35" +
            "    fecha_genero,genero --37" +
            "  )" +
            "  VALUES($1,$2,$3," +
            "       $4,$5,$6," +
            "       $7,$8,$9," +
            "       $10,$11,$12," +
            "       $13,$14,$15," +
            "       $16,$17,$18," +
            "       $19,$20,$21," +
            "       $22,$23,$24," +
            "       $25,$26,$27," +
            "       $28,$29,$30," +
            "       $31,$32,$33," +
            "       $34,$35," +
            "       current_date,$36 " +
            "   )",
            [
                co_alumno, fecha_inscripcion, hermanos, //-3
                estado_convivencia_padres, servicio_contratar, horario_servicio, //6
                direccion, resp_escuela_guarderia, resp_esperan_como_institucion, //9
                resp_circunstancia_especial_familia, resp_participacion_padres, estado_embarazo,//13
                resp_embarazo_planeado, gateo, edad_comienzo_caminar, edad_comienzo_esfinteres,//15
                edad_balbuceo, primer_palabra_con_significado, primeras_senas,//18
                enfermedades, accidentes_graves, dificultad_fisica,//21
                uso_aparato, tipo_terapia_especial, comportamiento_generales,//24
                duerme_con, resp_sieta, resp_horario_sieta,//27
                resp_promedio_horas_dueme, resp_numero_comidas_dia, resp_horas_tv,//30
                resp_programas_favoritos, resp_actividades_fin_semana, resp_habilidades,//33
                informacion_adicional, nota_celebracion_dia,//35
                , genero//36
            ],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rowCount)
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const createFormatoInscripcionInicial = (id_alumno, genero) => {
    console.log("@create Formato inscripcion inicial");
    try {
        console.log(" ID ALUMNO = " + id_alumno);

        pool.query(
            "  INSERT INTO CO_FORMATO_INSCRIPCION(" +
            "    co_alumno,fecha_genero,genero" +
            "  )  " +
            "  VALUES($1,current_date,$2) RETURNING id;",
            [
                id_alumno,
                genero
            ],
            (error, results) => {
                if (error) {
                    /*    pool.rollback(function() {
                            console.log("ROLLBACK fallo algo al insertar el alumno");
                        });*/
                    console.log("Error al guardar el formato inicial " + error);
                    return false;
                }

                console.log(" returning de formtato  " + JSON.stringify(results));

                if (results.rowCount > 0) {

                    var id_formato_inscripcion = results.rows[0].id;

                    pool.query(
                        "UPDATE CO_ALUMNO  " +
                        " SET co_formato_inscripcion = $2 " +
                        " WHERE id = $1",
                        [
                            id_alumno, id_formato_inscripcion
                        ],
                        (error, results) => {
                            if (error) {
                                /*pool.rollback(function() {
                                    console.log("ROLLBACK  fallo algo al insertar el alumno");
                                });*/
                                console.log("error al actualizar el formato en el alumno " + error);
                                return;
                            }
                            console.log("Se modifico el alumno en la tabla co_formato_inscripcion");
                        });
                }

                return true;
            })

    } catch (e) {
        console.log("error al actualizar el formato en el alumno " + e);
    }
};


// PUT — /inscripcion/:id | updateInscripcion()
const updateInscripcion = (formato) => {
    console.log("@updateInscripcion");
    try {
       return new Promise((resolve, reject) => {
        pool.query(
            "UPDATE CO_FORMATO_INSCRIPCION  SET " +
          //  " fecha_inscripcion                 = $2," +
            " hermanos                          = $2, " +
            " estado_convivencia_padres         = $3," +
            " servicio_contratar                = $4," +
            " horario_servicio                  = $5, " +
            " direccion                         = $6," +
            " resp_escuela_guarderia            = $7," +
            " resp_esperan_como_institucion     = $8," +
            " resp_circunstancia_especial_familia = $9," +
            " resp_participacion_padres         = $10," +
            " estado_embarazo                   = $11," +
            " resp_embarazo_planeado            = $12," +
            " gateo                             = $13," +
            " edad_comienzo_caminar             = $14," +
            " edad_comienzo_esfinteres          = $15," +
            " edad_balbuceo                     = $16," +
            " primer_palabra_con_significado    = $17," +
            " primeras_senas                    = $18," +
            " enfermedades                      = $19," +
            " accidentes_graves                 = $20," +
            " dificultad_fisica                 = $21," +
            " uso_aparato                       = $22," +
            " tipo_terapia_especial             = $23," +
            " comportamiento_generales          = $24," +
            " duerme_con                        = $25," +
            " resp_sieta                        = $26," +
            " resp_horario_sieta                = $27," +
            " resp_promedio_horas_dueme         = $28," +
            " resp_numero_comidas_dia           = $29," +
            " resp_horas_tv                     = $30," +
            " resp_programas_favoritos          = $31," +
            " resp_actividades_fin_semana       = $32," +
            " resp_habilidades                  = $33," +
            " informacion_adicional             = $34," +
            " nota_celebracion_dia              = $35," +
            " resp_motivo_inscripcion           = $36" +            
            " WHERE id = $1",
            [
                formato.id,
                formato.hermanos, //-3
                formato.estado_convivencia_padres, formato.servicio_contratar, formato.horario_servicio, //6
                formato.direccion, formato.resp_escuela_guarderia, formato.resp_esperan_como_institucion, //9
                formato.resp_circunstancia_especial_familia, formato.resp_participacion_padres,
                formato.estado_embarazo,//12
                formato.resp_embarazo_planeado, formato.gateo, formato.edad_comienzo_caminar,
                formato.edad_comienzo_esfinteres,//16
                formato.edad_balbuceo, formato.primer_palabra_con_significado,
                formato.primeras_senas,//19
                formato.enfermedades, formato.accidentes_graves, formato.dificultad_fisica,//22
                formato.uso_aparato, formato.tipo_terapia_especial, formato.comportamiento_generales,//25
                formato.duerme_con, formato.resp_sieta, formato.resp_horario_sieta,//28
                formato.resp_promedio_horas_dueme, formato.resp_numero_comidas_dia, formato.resp_horas_tv,//31
                formato.resp_programas_favoritos, formato.resp_actividades_fin_semana,
                formato.resp_habilidades,//34
                formato.informacion_adicional, formato.nota_celebracion_dia//37
                ,formato.resp_motivo_inscripcion
            ],
            (error, results) => {
                if (error) {
                    console.log("Error al actualizar el formato de inscripcion " + error);
                    reject(error);
                }
                resolve(true);
                //return true;
            });

        });
    } catch (e) {
        console.log("ERROR " + e);        
        console.log("Error al actualizar el formato de inscripcion " + e);
        return false;
    }
};
/*
const updateInscripcion = (request, response) => {
    console.log("@updateInscripcion");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = parseInt(request.params.id)

        const p = getParams(request.body);

        pool.query(
            "UPDATE CO_ALUMNO  " +
            " fecha_inscripcion                 = $2," +
            " hermanos                          = $3, "+
            " estado_convivencia_padres         = $4,"+
             "servicio_contratar                = $5,"+
            " horario_servicio                  = $6, "+
            " direccion                         = $7,"+
            " resp_escuela_guarderia            = $8,"+
            " resp_esperan_como_institucion     = $9,"+
            " resp_circunstancia_especial_familia = $10,"+
            " resp_participacion_padres         = $11,"+
            " estado_embarazo                   = $12,"+
            " resp_embarazo_planeado            = $13,"+
            " gateo                             = $14,"+
            " edad_comienzo_caminar             = $15,"+
            " edad_comienzo_esfinteres          = $16,"+
            " edad_balbuceo                     = $17,"+
            " primer_palabra_con_significado    = $18,"+
            " primeras_senas                    = $19,"+
            " enfermedades                      = $20,"+
            " accidentes_graves                 = $21,"+
            " dificultad_fisica                 = $22,"+
            " uso_aparato                       = $23,"+
            " tipo_terapia_especial             = $24,"+
            " comportamiento_generales          = $25,"+
            " duerme_con                        = $26,"+
            " resp_sieta                        = $27,"+ 
            " resp_horario_sieta                = $28,"+
            " resp_promedio_horas_dueme         = $29,"+
            " resp_numero_comidas_dia           = $30,"+
            " resp_horas_tv                     = $31,"+
            " resp_programas_favoritos          = $32,"+
            " resp_actividades_fin_semana       = $33,"+
            " resp_habilidades                  = $34"+
            " informacion_adicional             = $35,"+
            " nota_celebracion_dia              = $36"+             
            " WHERE id = $1",
            [
                id, 
                fecha_inscripcion, hermanos, //-3
                estado_convivencia_padres, servicio_contratar, horario_servicio, //6
                direccion, resp_escuela_guarderia, resp_esperan_como_institucion, //9
                resp_circunstancia_especial_familia, resp_participacion_padres, estado_embarazo,//12
                resp_embarazo_planeado, gateo, edad_comienzo_caminar, edad_comienzo_esfinteres,//16
                edad_balbuceo, primer_palabra_con_significado, primeras_senas,//19
                enfermedades, accidentes_graves, dificultad_fisica,//22
                uso_aparato, tipo_terapia_especial, comportamiento_generales,//25
                duerme_con, resp_sieta, resp_horario_sieta,//28
                resp_promedio_horas_dueme, resp_numero_comidas_dia, resp_horas_tv,//31
                resp_programas_favoritos, resp_actividades_fin_semana, resp_habilidades,//34
                informacion_adicional, nota_celebracion_dia//37
            ],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).send(`User modified with ID: ${id}`)
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};*/


// DELETE — /inscripcion/:id | deleteFormatoInscripcion()
const deleteFormatoInscripcion = (request, response) => {
    console.log("@deleteFormatoInscripcion");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = parseInt(request.params.id)
        pool.query('UPDATE CO_FORMATO_INSCRIPCION SET eliminado = true WHERE id = $1', [id], (error, results) => {
            if (error) {

                handle.callbackError(error, response);
                return;
            }
            response.status(200).send(`User deleted with ID: ${id}`)
        });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


const getParams = (body) => {
    const parametros = {
        co_alumno, fecha_inscripcion, hermanos,
        estado_convivencia_padres, servicio_contratar, horario_servicio,
        direccion, resp_escuela_guarderia, resp_esperan_como_institucion,
        resp_circunstancia_especial_familia, resp_participacion_padres, estado_embarazo,
        resp_embarazo_planeado, gateo, edad_comienzo_caminar, edad_comienzo_esfinteres,
        edad_balbuceo, primer_palabra_con_significado, primeras_senas,
        enfermedades, accidentes_graves, dificultad_fisica,
        uso_aparato, tipo_terapia_especial, comportamiento_generales,
        duerme_con, resp_sieta, resp_horario_sieta,
        resp_promedio_horas_dueme, resp_numero_comidas_dia, resp_horas_tv,
        resp_programas_favoritos, resp_actividades_fin_semana, resp_habilidades,
        informacion_adicional, nota_celebracion_dia,
        fecha_genero, genero
    } = body;

    return parametros;
};


module.exports = {
    getFormatoInscripcion,
    createFormatoInscripcionInicial,
    createFormatoInscripcion,
    updateInscripcion,
    deleteFormatoInscripcion
}