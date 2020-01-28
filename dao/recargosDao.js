
const genericDao = require('./genericDao');
const {Exception,ExceptionBD} = require('../exception/exeption');
const { existeValorArray,isEmptyOrNull } = require('../utils/Utils');


const CRITERIO = {
    AGREGAR_RECARGO: " (a.fecha_limite_pago_mensualidad + 1) <= getDate('') and to_char(b.fecha,'mmYYYY') = to_char(getDate(''),'mmYYYY')",
    VENCEN_HOY: " a.fecha_limite_pago_mensualidad = getDate('') and to_char(b.fecha,'mmYYYY') = to_char(getDate(''),'mmYYYY')",
    VENCEN_MANANA: "  (a.fecha_limite_pago_mensualidad + 1) = getDate('') + 1 and to_char(b.fecha,'mmYYYY') = to_char(getDate(''),'mmYYYY')",
    VENCIDOS: " a.fecha_limite_pago_mensualidad < getDate('') "    
};
const SELECCIONAR_TODAS_SUCURSALES = null;

const getQueryBase = function (criterio,idSucursal) {
    return `
    WITH cargos_universo AS(
        SELECT 	
           a.co_sucursal,   
               a.fecha_limite_pago_mensualidad,
               a.nombre as nombre_alumno,
               a.id as id_alumno,
               a.co_balance_alumno,
               b.id as id_cargo_balance_alumno,
               b.fecha,
               b.cantidad,
               cargo.nombre as nombre_cargo,
               b.texto_ayuda,
               cat_cargo as id_cargo,
               cargo.es_facturable,
               b.total as total,
               b.cargo,
               b.total_pagado,
               b.nota,
               b.pagado
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
             WHERE  ${criterio}
                    and b.pagado = false
                    and cargo.id = 1
                    and b.recargo = false	
                    and b.eliminado = false 
                    and a.eliminado = false	                
             ORDER by a.nombre,b.fecha desc
    ) select suc.id as id_sucursal,
        suc.nombre as nombre_sucursal,
        suc.direccion as direccion_sucursal,
        array_to_json(array_agg(to_json(u.*))) AS mensualidades_vencidas
    from cargos_universo u right join co_sucursal suc on suc.id = u.co_sucursal 
    where  ${(idSucursal != null) ? ` suc.id = ${idSucursal} AND ` :''} 
            suc.eliminado = false
    group by suc.id
    
    `;
}

function validarCriterio(criterio){
    if(isEmptyOrNull(criterio)){
        console.log("XX NO SE EJECUTO EL PROCES EL CRITERIO ES NULL XXX");
        throw (new Exception("Error ","El criterio es null o empty"));
    }
}

//FIXME: incluir el id de la empresa
//--Registrar un Cargo a cada alumno que tiene registrada su fecha.
//Calcular recargos de mensualidades que vence hoy
function getMensualidadesParaRecargoTodasSucursales(criterio) {
    console.log("@getMensualidadesParaRecargoTodasSucursales" );
    console.log("CRITERIO "+criterio);
    //CRITERIO.AGREGAR_RECARGO
    validarCriterio(criterio);
    let query = getQueryBase(criterio,SELECCIONAR_TODAS_SUCURSALES);
    console.log(query);
    return genericDao.findAll(query, []);       
}

function getMensualidadesParaRecargoPorSucursal(criterio,idSucursal) {
    console.log("@GetMensualidadesParaRecargo" );
    validarCriterio(criterio);
    return genericDao.findAll(getQueryBase(criterio,idSucursal), []);       

}



module.exports = {
    getMensualidadesParaRecargoTodasSucursales,
    getMensualidadesParaRecargoPorSucursal,
    CRITERIO
}