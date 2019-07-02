
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


const getReporteBalanceAlumnosSucursal = (request, response) => {
    console.log("@getReportePrincipal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            "  select a.id," +
            "   a.nombre," +
            "   a.apellidos," +
            "   a.hora_entrada," +
            "   a.hora_salida," +
            "   a.costo_colegiatura," +
            "   a.costo_inscripcion," +
            "   a.minutos_gracia," +
            "   a.fecha_inscripcion," +
            "   a.fecha_reinscripcion," +
            "   suc.nombre as nombre_sucursal, " +
            "   balance.id as id_balance," +
            "   balance.total_adeudo," +
            "   balance.total_pagos," +
            "   balance.total_cargos," +
            "   to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM') AS nuevo_ingreso " +
            " From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "                 inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "                 inner join co_sucursal suc on a.co_sucursal =suc.id" +
            " WHERE a.co_sucursal = $1 and a.eliminado = false " +
            " ORDER BY balance.total_adeudo DESC ",
            [id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getReporteBalancePorSucursal = (request, response) => {
    console.log("@getReporteBalancePorSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            " with total_alumnos_count As( " +
            "       select co_sucursal,count(*) AS contador_alumnos" +
            "       from co_alumno " +
            "       group by co_sucursal" +
            "),total_ingreso_mes_actual AS(" +
            "   select co_sucursal,count(*) AS contador_alumnos_ingresado_mes" +
            "   from co_alumno " +
            "   where to_char(fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM')" +
            "               and eliminado = false" +
            "     group by co_sucursal" +
            ") SELECT suc.id, suc.nombre," +
            "       sum(balance.total_adeudo) as total_adeuda," +
            "       sum(balance.total_pagos) as total_pagos," +
            "       sum(balance.total_cargos) as total_cargos," +
            "       total_alumnos.contador_alumnos," +
            "       total_ingreso.contador_alumnos_ingresado_mes" +
            " FROM co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "           inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "           inner join co_sucursal suc on a.co_sucursal =suc.id" +
            "           inner join total_alumnos_count total_alumnos on total_alumnos.co_sucursal = suc.id" +
            "           LEFT join total_ingreso_mes_actual total_ingreso on total_ingreso.co_sucursal = suc.id " +
            "   WHERE a.eliminado = false " +
            "   GROUP by suc.id,total_alumnos.contador_alumnos,total_ingreso.contador_alumnos_ingresado_mes"
            ,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getReporteCrecimientoBalancePorSucursal = (request, response) => {
    console.log("@getReporteCrecimientoBalancePorSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            "		with alumnos AS (" +
            "				select a.co_sucursal," +
            "               count(a.*) as contador_alumnos_ingresado_mes," +
            "               sum(balance.total_cargos) as total_cargos_crecimiento," +
            "               sum(balance.total_adeudo) as total_adeuda_crecimiento," +
            "               sum(balance.total_pagos) as total_pagos_crecimiento" +
            "   from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "               and to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM')" +
            //"               and to_char(a.fecha_inscripcion,'YYYYMM') = to_char(current_date-2,'YYYYMM')" +
            "                   and a.eliminado = false " +
            "   group by a.co_sucursal" +
            "   )select s.id, " +
            "       s.nombre, " +
            "       coalesce(a.contador_alumnos_ingresado_mes,0) as contador_alumnos_ingresado_mes," +
            "       coalesce(a.total_cargos_crecimiento,0) as total_cargos_crecimiento," +
            "       coalesce(a.total_adeuda_crecimiento,0) as total_adeuda_crecimiento," +
            "		coalesce(a.total_pagos_crecimiento,0) as total_pagos_crecimiento" +
            " from co_sucursal s left join alumnos a on a.co_sucursal = s.id" ,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

/*
 " 	with total_ingreso_mes_actual AS( " +
            "            select suc.id,count(c.*) AS contador_alumnos_ingresado_mes"+
            " from co_sucursal suc left join co_alumno c on c.co_sucursal = suc.id"+
            "                        and to_char(c.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM')"+
            "                        and c.eliminado = false and suc.eliminado = false"+
            " group by suc.id" +
            " ) SELECT suc.id, suc.nombre," +
            "       sum(balance.total_adeudo) as total_adeuda_crecimiento," +
            "       sum(balance.total_pagos) as total_pagos_crecimiento," +
            "       sum(balance.total_cargos) as total_cargos_crecimiento," +
            "       total_ingreso.contador_alumnos_ingresado_mes" +
            "   FROM co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "               inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "               inner join co_sucursal suc on a.co_sucursal =suc.id " +
            "               inner join total_ingreso_mes_actual total_ingreso on total_ingreso.co_sucursal = suc.id " +
            " WHERE a.eliminado = false AND to_char(fecha_inscripcion,'YYYYMM') = to_char(getdate(''),'YYYYMM')" +
            " GROUP by suc.id,total_ingreso.contador_alumnos_ingresado_mes"
*/

module.exports = {
    getReporteBalanceAlumnosSucursal,
    getReporteBalancePorSucursal,
    getReporteCrecimientoBalancePorSucursal
}