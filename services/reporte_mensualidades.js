
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');
const { CARGOS } = require('../utils/Constantes');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


const getReporteMensualidades = (request, response) => {
    console.log("@getReporteMensualidades");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { id_sucursal } = request.params;

        //const mes = request.params.mes;

        pool.query(`   
           
      with info_correos_alumnos AS (
        SELECT 
        a.id as id_alumno,
        
        string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
        array_to_json(array_agg(to_json(fam.correo))) AS correos, 
        array_to_json(array_agg(to_json(fam.token))) as tokens
     FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                    inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                    inner join co_alumno a on a.id = rel.co_alumno								
    WHERE  a.co_sucursal = $1 --and envio_recibos
        and co_parentesco in (1,2) -- solo papa y mama
        and fam.eliminado = false 
        and rel.eliminado = false
     group by a.nombre,a.id
    )SELECT    
            rel.id,
            al.id as id_alumno,
                al.nombre as nombre_alumno,
                rel.pago,	
                cargo.fecha as fecha_cargo,
                cargo.cargo,
                cargo.total as adeuda_de_cargo,
                cargo.nota,
                pago.fecha as fecha_pago,
                pago.pago,
                pago.identificador_factura,
                forma_pago.nombre as forma_pago,	
                c.nombre as nombre_cargo,
                cargo.pagado,
                i.*   
            from co_cargo_balance_alumno cargo  left join co_pago_cargo_balance_alumno rel on rel.co_cargo_balance_alumno = cargo.id
                left join co_pago_balance_alumno pago on rel.co_pago_balance_alumno = pago.id and pago.eliminado = false 
                left join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id						
                inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
                inner join cat_cargo c on c.id = cargo.cat_cargo
                left join info_correos_alumnos i on i.id_alumno = al.id
            where cargo.cat_cargo = $2 
                and al.co_sucursal = $3
                and to_char(cargo.fecha,'Mon-YYYY') = to_char(getDate(''),'Mon-YYYY') 
                and cargo.eliminado = false 
            order by cargo.pagado desc,al.nombre, pago.fecha

         `, [id_sucursal, CARGOS.ID_CARGO_MENSUALIDAD, id_sucursal], (error, results) => {
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


const getReporteMensualidadesSucursalMesActual = (request, response) => {
    console.log("@getReporteMensualidadesSucursalMesActual");

    request.params.mes = null;

    getReporteMensualidadesSucursal(request, response);


};



const getReporteMensualidadesSucursal = (request, response) => {
    console.log("@getReporteMensualidadesSucursal");
    try {

        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        let mes = request.params.mes;

        console.log("PARAMETRO MES " + mes);

        pool.query(
            `              
            SELECT 
                suc.id as id_sucursal,
                suc.nombre as sucursal,	
                suc.class_color,		  
                count(cargo.*) filter (where cargo.pagado) as cargos_pagados,			   
                count(cargo.*) filter (where cargo.pagado = false) as cargos_no_pagados,			   			   
                count(pago.identificador_factura) as pagos_facturados
            from co_cargo_balance_alumno cargo  left join co_pago_cargo_balance_alumno rel on rel.co_cargo_balance_alumno = cargo.id
                 left join co_pago_balance_alumno pago on rel.co_pago_balance_alumno = pago.id and pago.eliminado = false                 
                inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
                left join co_sucursal suc on suc.id = al.co_sucursal
            where cargo.cat_cargo = $1
                and to_char(cargo.fecha,'YYYYMM') = `+ (mes != null ? "'" + mes + "'" : "to_char(getDate(''),'YYYYMM')")
            + ` and cargo.eliminado = false 
            group by suc.id
         `, [CARGOS.ID_CARGO_MENSUALIDAD],
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


const getReporteMesesConDeudasMensualidad = (request, response) => {
    console.log("@getReporteMesesConDeudasMensualidad");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            ` 
            with universo AS(
                select generate_series((select date_trunc('year', now())),(getDate('')+getHora(''))::timestamp,'1 month') as fecha                                
			    )
		        SELECT  
				    to_char(u.fecha,'YYYYMM')   AS anio_mes,							
				    to_char(u.fecha,'YYYY')     AS numero_anio,
				    to_char(u.fecha,'MM')       AS numero_mes,
				    suc.id                      AS id_sucursal,
				    suc.nombre                  AS sucursal,				
           		    sum(cargo.total)            AS adeudo_mes,                                
                    sum(pago.pago)              AS pagado_mes,                                                				
                    count(case when cargo.pagado then 1 else null end)          AS pagados,           
				    count(case when cargo.pagado = false then 1 else null end)  AS no_pagados ,          
				    count(cargo.*)               AS total_cargos
                from universo u left join co_cargo_balance_alumno cargo on to_char(cargo.fecha,'YYYYMM') = to_char(u.fecha,'YYYYMM')
    			    left join co_pago_cargo_balance_alumno rel on rel.co_cargo_balance_alumno = cargo.id
                    left join co_pago_balance_alumno pago on rel.co_pago_balance_alumno = pago.id and pago.eliminado = false                 
                    inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
				    left join co_sucursal suc on al.co_sucursal = suc.id
                    inner join cat_cargo c on c.id = cargo.cat_cargo                
                where cargo.cat_cargo = $1
                    and suc.id = $2                    
                    and cargo.eliminado = false 
                group by  al.co_sucursal,suc.id,
				    	to_char(u.fecha,'YYYYMM'),
					    to_char(u.fecha,'YYYY'),
			    to_char(u.fecha,'MM')
            `,
            [CARGOS.ID_CARGO_MENSUALIDAD, id_sucursal],
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
    getReporteMensualidades,
    getReporteMensualidadesSucursalMesActual,
    getReporteMensualidadesSucursal,
    getReporteMesesConDeudasMensualidad
}
