
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
            "   a.fecha_inscripcion::date," +
            "   a.fecha_reinscripcion::date," +
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
            `
            with total_alumnos_count As( 
                select co_sucursal,count(*) AS contador_alumnos
                    from co_alumno 
                    group by co_sucursal
             ),cargos_desglose AS (						
                 with universo_cargos as (
                         select suc.id as id_sucursal,									
                                 count(cargos.id) as cargos_pendientes_pago,
                                 tipo_cargo.nombre as tipo_cargo,
                                 sum(cargos.total) as total_cargos_desglose,
                                 sum(cargos.total_pagado) as total_cargos_pagados_desglose,
                                 (sum(cargos.total) - sum(cargos.total_pagado)) as total_cargos_pendiente_desglose
                         from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                                     inner join co_cargo_balance_alumno cargos on cargos.co_balance_alumno = balance.id			
                                                 and cargos.pagado = false
                                     inner join cat_cargo tipo_cargo on  cargos.cat_cargo = tipo_cargo.id
                                     inner join co_sucursal suc on a.co_sucursal = suc.id
                             group by suc.id,tipo_cargo.nombre
                             order by suc.id
                         ) select c.id_sucursal,
                                 array_to_json(array_agg(row_to_json((c.*))))::text AS json_array
                             from universo_cargos c
                             group by c.id_sucursal						
             ) SELECT suc.id, suc.nombre,
                    sum(balance.total_adeudo) as total_adeuda,
                    sum(balance.total_pagos) as total_pagos,
                    sum(balance.total_cargos) as total_cargos,
                    total_alumnos.contador_alumnos,
                    COALESCE(cargos.json_array,'[]') AS cargos 
              FROM co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                        inner join co_grupo grupo on a.co_grupo = grupo.id
                        inner join co_sucursal suc on a.co_sucursal =suc.id
                        inner join total_alumnos_count total_alumnos on total_alumnos.co_sucursal = suc.id             
                        left join cargos_desglose cargos on cargos.id_sucursal = suc.id																
              WHERE a.eliminado = false 
              GROUP by suc.id,total_alumnos.contador_alumnos,cargos.json_array
              ORDER BY suc.nombre DESC 
            `,
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
           /* "		with alumnos AS (" +
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
            " from co_sucursal s left join alumnos a on a.co_sucursal = s.id" +
            " ORDER BY s.nombre DESC  ",*/
             `
             with universo AS(
                select getDate('') As fecha
            ) select 
                suc.id,
			    suc.nombre,
				to_char(getDate(''),'Mon-YYYY') as mes_anio,								
				to_char(getDate(''),'YYYY') as numero_anio,
				to_char(getDate(''),'MM') as numero_mes,				
				count(alumno.*) as count_alumno,					
			    coalesce(sum(alumno.costo_colegiatura),0) as suma_colegiaturas,
				coalesce(sum(alumno.costo_inscripcion),0) as suma_inscripciones,
				coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) as suma_total							
			 from co_sucursal suc left join co_alumno alumno on alumno.co_sucursal = suc.id								            
								    and to_char(getDate(''),'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')						 
									and alumno.eliminado = false								   
			group by suc.id,to_char(getDate(''),'Mon-YYYY'),
						to_char(getDate(''),'MMYYYY'),
						numero_anio,
						numero_mes
						,suc.nombre	
			order by 
					suc.nombre desc`,
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


const getReporteCrecimientoBalanceAlumnosSucursal = (request, response) => {
    console.log("@getReporteCrecimientoBalanceAlumnosSucursal");
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
            "   a.fecha_inscripcion::date," +
            "   a.fecha_reinscripcion::date," +
            "   suc.nombre as nombre_sucursal, " +
            "   balance.id as id_balance," +
            "   balance.total_adeudo," +
            "   balance.total_pagos," +
            "   balance.total_cargos" +
            " From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "                 inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "                 inner join co_sucursal suc on a.co_sucursal =suc.id" +
            " WHERE a.co_sucursal = $1 and a.eliminado = false " +
            "       AND to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM')" +
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



const getReporteCrecimientoGlobal = (request, response) => {
    console.log("@getReporteCrecimientoGlobal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            "  with universo AS( " +
            "       select generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha" +
            "       ) select " +
            "           to_char(u.fecha,'Mon-YYYY') as mes_anio," +
            "		     to_char(u.fecha,'YYYY') as numero_anio," +
            "           to_char(u.fecha,'MM') as numero_mes," +
            "           count(alumno.*) as count_alumno," +
            "           coalesce(sum(alumno.costo_colegiatura),0) as suma_colegiaturas," +
            "           coalesce(sum(alumno.costo_inscripcion),0) as suma_inscripciones," +
            "           coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) as suma_total" +
            "   from universo u left join co_alumno alumno " +
            "           on to_char(u.fecha,'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')" +
            "           and alumno.eliminado = false" +
            "    group by to_char(u.fecha,'Mon-YYYY')," +
            "   to_char(u.fecha,'MMYYYY')," +
            "           numero_anio," +
            "			numero_mes	" +
            " order by numero_anio desc,numero_mes desc ",
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




const getReporteCrecimientoMensualSucursal = (request, response) => {
    console.log("@getReporteCrecimientoMensualSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;

        pool.query(
         ` with universo AS(
                select generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha
                --select generate_series((to_char(getDate(''),'YYYY') ||'-01-01')::timestamp,(getDate('')+getHora(''))::timestamp,'1 month') as fecha
			) select 
			    suc.nombre,
				to_char(u.fecha,'Mon-YYYY') as mes_anio,								
				to_char(u.fecha,'YYYY') as numero_anio,
				to_char(u.fecha,'MM') as numero_mes,				
				count(alumno.*) as count_alumno,					
			    coalesce(sum(alumno.costo_colegiatura),0) as suma_colegiaturas,
				coalesce(sum(alumno.costo_inscripcion),0) as suma_inscripciones,
				coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) as suma_total							
			 from universo u left join co_alumno alumno 
								on to_char(u.fecha,'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')
								and alumno.eliminado = false																				
                                inner join co_sucursal suc on alumno.co_sucursal = suc.id								
            where suc.id = $1 
			group by to_char(u.fecha,'Mon-YYYY'),
						to_char(u.fecha,'MMYYYY'),
						numero_anio,
						numero_mes
						,suc.nombre	
			order by 
					suc.nombre, 
            numero_anio desc,numero_mes desc `,
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





const getReporteAlumnosMensualCrecimiento = (request, response) => {
    console.log("@getReporteAlumnosMensualCrecimiento");
    try {
        //console.log(" JSON "+JSON.stringify(request.body.json_param));
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        
        }

        console.log(JSON.stringify(request.params));

        const id_sucursal = request.params.id_sucursal;
        const mes_anio = request.params.mes_anio;
       // const { id_sucursal,mes_anio } = request.body.json_param;

        pool.query(         `
         select a.id, 
              a.nombre,
               a.apellidos,
               a.hora_entrada,
               a.hora_salida,
               a.costo_colegiatura,
              a.costo_inscripcion,
               a.minutos_gracia,
               a.fecha_inscripcion::date,
               a.fecha_reinscripcion::date,
               suc.nombre as nombre_sucursal, 
               balance.id as id_balance,
               balance.total_adeudo,
               balance.total_pagos,
               balance.total_cargos
             From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                             inner join co_grupo grupo on a.co_grupo = grupo.id
                             inner join co_sucursal suc on a.co_sucursal =suc.id
             WHERE a.co_sucursal = $1 and a.eliminado = false 			
                   AND to_char(a.fecha_inscripcion,'Mon-YYYY') = $2
             ORDER BY balance.total_adeudo DESC
         `,
            [id_sucursal,mes_anio],
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
    getReporteCrecimientoBalancePorSucursal,
    getReporteCrecimientoBalanceAlumnosSucursal,
    getReporteCrecimientoGlobal,
    getReporteCrecimientoMensualSucursal,
    getReporteAlumnosMensualCrecimiento
}