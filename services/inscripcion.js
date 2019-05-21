
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
const getFormatoInscripcion = (request, response) => {
    console.log("@getFormatoInscripcion");
    try {

        var validacion = helperToken.validarToken(request);
        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("paso token getFormatoInscripcion");

        const id_alumno = parseInt(request.params.id_alumno);

        console.log("Consultando asistencia de la suc " + id_sucursal);

        pool.query(
            " SELECT c.*,a.nombre as nombre_alumno,g.nombre as nombre_grupo" +
            " FROM co_formato_inscripcion c inner join co_alumno a on c.co_alumno = a.id" +
            "                                inner join co_grupo g on a.co_grupo = g.id" +
            " WHERE c.co_alumno = $1 and c.eliminado = false",
            [id_alumno],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
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
                ,genero//36
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

// PUT — /inscripcion/:id | updateInscripcion()
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
};


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
    createFormatoInscripcion,
    updateInscripcion,
    deleteFormatoInscripcion    
}