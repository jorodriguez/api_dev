

const genericDao = require('./genericDao');

//agregar_pago_alumno(IN id_alumno integer,pago_param numeric ,nota text ,id_genero integer,OUT retorno boolean) 
//registrar pagos
const registrarPago = (pagoData) => {
    console.log("@registrarPago");
    console.log("=====>> " + JSON.stringify(pagoData));
    return new Promise((resolve, reject) => {
        const { id_alumno, pago, nota, ids_cargos, cargos_desglosados,ids_cargos_descuento,id_descuentos_desglose, cat_forma_pago, identificador_factura,identificador_pago, genero } = pagoData;
        console.log("identificador_pagoidentificador_pagoidentificador_pago "+identificador_pago);
        genericDao
            .executeProcedure(
                `SELECT agregar_pago_alumno(
                        '${ids_cargos}',
                        '${cargos_desglosados}',
                        '${ids_cargos_descuento}',
                        '${id_descuentos_desglose}',                        
                        ${id_alumno},
                        ${pago},
                        '${nota}',
                        ${cat_forma_pago},
                        '${identificador_factura}',
                        '${identificador_pago}',
                        ${genero});`)
            .then(results => {
                if (results.rowCount > 0) {
                    var retorno = results.rows[0];
                    console.log("Retorno el ID " + JSON.stringify(results.rows));

                      //notificacionService.notificarReciboPago(id_alumno, retorno.agregar_pago_alumno);
                    resolve(retorno);
                } else {
                    reject(null);
                }
            }).catch(error => {
                console.error("No se guardo el pago "+error);
                reject(error);
            });      
    });

};


const getPagosByCargoId = (idCargoBalanceAlumno) => {
    console.log("@getPagosByCargoId");

    console.log("request.params.id_cargo_balance_alumno " + idCargoBalanceAlumno);
    return genericDao.findAll(
        `
              SELECT forma_pago.id as id_forma_pago,
                    forma_pago.nombre as nombre_forma_pago,
                    pago.identificador_factura ,
                    pago.identificador_pago,
                    r.id,                    
                    r.fecha,
                    to_char(pago.fecha,'dd-mm-yyyy HH24:MI') as fecha_format,
                    r.co_pago_balance_alumno,
                    r.co_cargo_balance_alumno,
                    r.pago,
                    pago.id as id_pago,
                    pago.nota,
                    pago.co_forma_pago,
                    r.folio_factura                    
               FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                   inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
               WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
               ORDER BY pago.fecha DESC`,
        [idCargoBalanceAlumno]);
};

/*
const getAlumnoByPagoId = (idPago) => {
    console.log("@getPagosByCargoId");

    console.log("request.params.id_cargo_balance_alumno " + idCargoBalanceAlumno);
    return genericDao.findAll(
        `
              SELECT forma_pago.id as id_forma_pago,
                    forma_pago.nombre as nombre_forma_pago,
                    pago.identificador_factura ,
                    pago.identificador_pago,
                    r.id,                    
                    r.fecha,
                    to_char(pago.fecha,'dd-mm-yyyy HH24:mm') as fecha_format,
                    r.co_pago_balance_alumno,
                    r.co_cargo_balance_alumno,
                    r.pago,
                    pago.nota,
                    pago.co_forma_pago,
                    r.folio_factura                    
               FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                   inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
               WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
               ORDER BY pago.fecha DESC`,
        [idCargoBalanceAlumno]);
};*/




module.exports = {
    registrarPago,
    getPagosByCargoId

}