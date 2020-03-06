
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { CARGOS } = require('../utils/Constantes');

const getReporteMensualidadesPorSucursalMes = (request, response) => {
    console.log("@getReporteMensualidadesPorSucursalMes");
    try {

        // validarToken(request,response);

        const { id_sucursal, mes } = request.params;
        console.log("id_sucursal " + id_sucursal + " mes " + mes);

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
                and to_char(cargo.fecha,'YYYYMM') = '`+ mes + "'"
            + ` and cargo.eliminado = false 
            order by cargo.pagado desc,al.nombre, pago.fecha`
            , [id_sucursal, CARGOS.ID_CARGO_MENSUALIDAD, id_sucursal], (error, results) => {
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


const getReporteContadoresSucursalesMesActual = (request, response) => {
    console.log("@getReporteContadoresSucursalesMesActual");

    try {
        //  validarToken(request,response);
        console.log("CARGOS.ID_CARGO_MENSUALIDAD " + CARGOS.ID_CARGO_MENSUALIDAD);
        const {id_usuario} = request.params;

        let id_mensualidad = CARGOS.ID_CARGO_MENSUALIDAD;
        let query = getQueryPrincipal(null, true);
        console.log("QUER " + id_mensualidad + "     " + query);
        pool.query(query, [id_usuario,id_mensualidad],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log("reporte mensualidad sur mes actual" + JSON.stringify(results.rows));
                response.status(200).json(results.rows);
            });

    } catch (e) {
        console.log("Errro " + e);
        handle.callbackErrorNoControlado(e, response);
    }


};

//obtiene las sucursales
const getReporteContadoresMesesPorSucursal = (request, response) => {
    console.log("@getReporteContadoresMesesPorSucursal");
    try {

        //validarToken(request,response);

        let { id_usuario,id_sucursal } = request.params;

        console.log("PARAMETRO id sucursal " + id_sucursal);

        pool.query(
            getQueryPrincipal(id_sucursal, false)
            , [id_usuario,CARGOS.ID_CARGO_MENSUALIDAD],
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


function getQueryPrincipal(id_sucursal, isQueryInicial) {
    let complementoSucursal = "";
    let complementoMes = "";

    if (isQueryInicial) {
        //obtener el valor de todas las sucursales en el mes actual
        complementoMes = " and to_char(cargo.fecha,'YYYYMM') = to_char(getDate(''),'YYYYMM') ";
    } else {
        complementoSucursal = (id_sucursal != null ? " and  suc.id  = " + id_sucursal : "");
    }

    const query = `
    with sucursal_usuario AS(
        select suc.*		   
            from si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
            where usr.usuario = $1
                and usr.eliminado = false
                and suc.eliminado = false	
    ), meses AS (
        select to_char(generate_series,'YYYYMM')  as anio_mes,
                to_char(generate_series,'MM')  as numero_mes
        from generate_series((select date_trunc('year', now())),(getDate('')+getHora(''))::timestamp,'1 month') 
    )
    SELECT 
            suc.id as id_sucursal,
            suc.nombre as sucursal,	
            anio_mes,
            m.numero_mes::integer,
            suc.class_color,		  
            count(cargo.*) filter (where cargo.pagado) as cargos_pagados,			   
            count(cargo.*) filter (where cargo.pagado = false) as cargos_no_pagados,			   			   
            count(cargo.*) as total_cargos                
        from meses m left join co_cargo_balance_alumno cargo on to_char(cargo.fecha,'YYYYMM') = m.anio_mes
             left join co_pago_cargo_balance_alumno rel on rel.co_cargo_balance_alumno = cargo.id
             left join co_pago_balance_alumno pago on rel.co_pago_balance_alumno = pago.id and pago.eliminado = false                 
             left join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
             left join sucursal_usuario suc on suc.id = al.co_sucursal
        where cargo.cat_cargo = $2 `
        + complementoSucursal
        + complementoMes
        + ` and cargo.eliminado = false 
         GROUP BY m.anio_mes,suc.id,m.numero_mes
         ORDER BY m.numero_mes DESC`;
    //console.log(query);
    return query;
}



module.exports = {
    getReporteMensualidadesPorSucursalMes,
    getReporteContadoresSucursalesMesActual,
    getReporteContadoresMesesPorSucursal,
};
