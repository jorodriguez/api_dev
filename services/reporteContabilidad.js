
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { CARGOS } = require('../utils/Constantes');


const getReporteCobranzaPorFechas = (request, response) => {
    console.log("@getReporteCobranzaPorFechas");
    try {
        // validarToken(request,response);        

        //const params = { id_usuario, fecha_inicio, fecha_fin } = request.params;
        const params = { id_usuario, fecha_inicio, fecha_fin } = request.body;
        console.log("fecha inicio " + JSON.stringify(params));

        if (!id_usuario || !fecha_inicio || !fecha_fin) {
            handle.callbackError("parametros incompletos", response);
            return;
        }

        pool.query(
            `

select suc.nombre as sucursal,
    al.nombre||' '||al.apellidos as alumno,
    to_char(cargo.fecha,'dd-MM-YYYY') as fecha_cargo,	
    c.nombre || ' ' || cargo.texto_ayuda as concepto,		
    cargo.cargo,	
    cargo.total_pagado as pago_abono,	
    cargo.total as saldo_por_concepto,
    (
        select sum(total)
        from co_cargo_balance_alumno 		        
        where fecha::date between $1 and $2 
            and co_balance_alumno = al.co_balance_alumno 
            and eliminado = false
    ) as saldo_por_alumno,
    (
        select sum(total)
        from co_cargo_balance_alumno cargo inner join co_alumno a on a.co_balance_alumno = cargo.co_balance_alumno		        		
        where fecha::date between $1 and $2
            and a.co_sucursal = al.co_sucursal			
            and cargo.eliminado = false
    ) as saldo_por_sucursal	
    from co_cargo_balance_alumno  cargo  inner join cat_cargo c on c.id = cargo.cat_cargo
                      inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno					
                      inner join co_sucursal suc on suc.id = al.co_sucursal								      				     
    where  cargo.fecha::date between $1 and $2
    and suc.id in
    (
        select DISTINCT suc.id
                from si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
                where usr.usuario = $3
                    and usr.eliminado = false
                    and suc.eliminado = false
         )
    and cargo.eliminado = false 
    and cargo.pagado=false	
    order by suc.id,al.nombre,cargo.fecha
            
            `,
            [new Date (fecha_inicio), new Date(fecha_fin),id_usuario],
            (error, results) => {
                if (error) {
                    console.log(error);
                    handle.callbackError(error, response);
                    return;
                }
                console.log(" ==> " + results.rows);
                response.status(200).json(results.rows);
            });
    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getReporteCobranzaPorFechas
};
