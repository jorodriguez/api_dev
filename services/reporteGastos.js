
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


const getReporteGastosMensualesPorSucursalTrend = (request, response) => {
    console.log("@getReporteGastosMensualesPorSucursalTrend");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;

        pool.query(
             `
             with meses AS(
                select generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as mes
			) select			
					to_char(m.mes,'Mon-YYYY') as mes_anio,
					to_char(m.mes,'YYYYMM') as anio_mes, 
					coalesce(sum(gasto.gasto),0) as suma
              from meses m left join co_gasto gasto on to_char(m.mes,'YYYYMM') = to_char(gasto.fecha,'YYYYMM') 
							and gasto.co_sucursal = $1							
							and gasto.eliminado = false			                        							
			group by to_char(m.mes,'Mon-YYYY'),to_char(m.mes,'YYYYMM')
			order by to_char(m.mes,'YYYYMM') desc     
             `,
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


const getReporteGastosSucursalesMensual = (request, response) => {
    console.log("@getReporteGastosSucursalesMensual");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const mes_anio = request.params.mes_anio;

        pool.query(
           `
           select
                suc.id as id_sucursal,
                suc.nombre,
                suc.class_color,
               coalesce(sum(gasto.gasto),0) as suma
            from co_sucursal suc left join co_gasto gasto on gasto.co_sucursal = suc.id
                           and to_char(gasto.fecha,'YYYYMM') = $1
                           and gasto.eliminado = false
            group by suc.nombre,suc.id,suc.class_color
            order by  suc.nombre desc
            `,[mes_anio],
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

const getReporteGastosSucursalesMensualActual = (request, response) => {
    console.log("@getReporteGastosSucursalesMensualActual");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }
        pool.query(
           `
           select
                suc.id as id_sucursal,
                suc.nombre,
                suc.class_color,
               coalesce(sum(gasto.gasto),0) as suma
            from co_sucursal suc left join co_gasto gasto on gasto.co_sucursal = suc.id
                           and to_char(gasto.fecha,'YYYYMM') = to_char(getDate(''),'YYYYMM')
                           and gasto.eliminado = false
            group by suc.nombre,suc.id,suc.class_color
            order by  suc.nombre desc
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


const getReporteGastosPorTipoYSucursal = (request, response) => {
    console.log("@getReporteGastosPorTipoYSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;        
        const mes_anio = request.params.mes_anio;        

        pool.query(
            `
            select  
                    tipo.nombre as nombre_tipo_gasto,                     
                    coalesce(sum(g.gasto),0) as suma
                from co_gasto g inner join cat_tipo_gasto tipo on g.cat_tipo_gasto = tipo.id                    		
                where g.co_sucursal = $1
						and to_char(g.fecha,'YYYYMM') = $2
						and g.eliminado = false
				group by tipo.nombre
                order by tipo.nombre asc
            `,[id_sucursal,mes_anio],
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


const getReporteGastosGlobal = (request, response) => {
    console.log("@getReporteGastosGlobal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            `
            with meses AS(
                select to_char(generate_series,'Mon-YYYY') as mes from generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') 
			) select			
					m.mes as mes_anio,	
					tipo.nombre as tipo_gasto,
					suc.nombre as nombre_sucursal,
					coalesce(sum(gasto.gasto),0) as suma
              from meses m left join co_gasto gasto on m.mes = to_char(gasto.fecha,'Mon-YYYY') 							
							and gasto.eliminado = false			                        							
							inner join cat_tipo_gasto tipo on gasto.cat_tipo_gasto = tipo.id
							inner join co_sucursal suc on suc.id = gasto.co_sucursal
			group by m.mes,tipo.nombre,suc.nombre
			order by m.mes,suc.nombre desc     			
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


module.exports = {    
    getReporteGastosMensualesPorSucursalTrend,
    getReporteGastosSucursalesMensualActual,
    getReporteGastosSucursalesMensual,
    getReporteGastosPorTipoYSucursal,
    getReporteGastosGlobal
}