
const mensajeria = require('./mensajesFirebase');
const mailService = require('../utils/NotificacionService');
const { QUERY,getResults } = require('./sqlHelper');

const CRITERIO = {
     VENCEN_HOY :" AND a.fecha_limite_pago_mensualidad = getDate('') and to_char(b.fecha,'mmYYYY') = to_char(getDate(''),'mmYYYY')",     
     VENCEN_MANANA :" AND a.fecha_limite_pago_mensualidad = getDate('') + 1 and to_char(b.fecha,'mmYYYY') = to_char(getDate(''),'mmYYYY')",     
     VENCIDOS :" AND a.fecha_limite_pago_mensualidad < getDate('') "
};

const getQueryBase =  function(criterio){
return `
        SELECT 	   
           a.fecha_limite_pago_mensualidad,
           a.nombre,
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
         WHERE a.co_sucursal = $1
                ${criterio}                 
                and b.pagado = false
                and cargo.id = 1
                and b.recargo = false	
                and b.eliminado = false 
                and a.eliminado = false	                
         ORDER by a.nombre,b.fecha desc`;
}

//FIXME: incluir el id de la empresa
//--Registrar un Cargo a cada alumno que tiene registrada su fecha.
function procesoRecargosMensualidad(id_sucursal){
    console.log("Inicinado ejecución del proceso para calcular recargos sucursal "+id_sucursal);
    try{
        
        /*pool.query(QUERY_RECARGOS(CRITERIO.VENCEN_HOY), [id_sucursal])
            .then(handler || hadlerGenerico)
            .catch((error) => {
                console.log("XXXX EXCEPCION Al CONSULTAR " + error);              
                return;
            });*/

            getResults(getQueryBase(CRITERIO.VENCEN_HOY),
                        [id_sucursal],
                        (results)=>{
                            if(results.rowcount > 0){
                            let filas = results.rows;
                                for(let item in filas){
                                    console.log("REGISTRANDO RECARGO PARA "+item.nombre);  
                                }                        
                            }    
                        });          
               
    }catch(e){
        console.log("Excepcion al ejecutar el proceso de recargos "+e);
        //enviar un correo al equipo de soporte
    }

}

//enviar notificacion a mises por sucursar de los recargos que se van a realizar mañana
//enviar la lista completa a los dueños
function ejecutarProcesoRecargosMensualidad(){
    try{

        getResults(QUERY.SUCURSALES,[],(results)=>{
            if(results.rowcount > 0){
                let filas = results.rows;
                for(let item in filas){
                      console.log("REGISTRANDO RECARGO PARA LA SUCURSAL"+item.nombre);  
                }  
            }
        });

    }catch(e){
        console.log("Fallo la ejecucion del proceso que realiza recargos "+e);
    }   

}



// proceso de recargos en el día enviar correo a cada papa y toda la lista a las mises
//enviar la lista completa a los dueños de todas las sedes


