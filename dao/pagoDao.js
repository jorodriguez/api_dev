

const genericDao = require('./genericDao');

//agregar_pago_alumno(IN id_alumno integer,pago_param numeric ,nota text ,id_genero integer,OUT retorno boolean) 
//registrar pagos
const registrarPago = (pagoData) => {
    console.log("@registrarPago");
    console.log("=====>> " + JSON.stringify(pagoData));

    return new Promise((resolve, reject) => {
        const { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = pagoData;

        genericDao
            .executeProcedure(
                `SELECT agregar_pago_alumno('${ids_cargos}','${cargos_desglosados}',${id_alumno},${pago},'${nota}',${cat_forma_pago},'${identificador_factura}',${genero});`)
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
                reject(error);
            });
        /*
              response,
              (results) => {
                  if (results.rowCount > 0) {
                      let retorno = results.rows[0];
                      console.log("Retorno el ID " + JSON.stringify(results.rows));
                      notificacionService.notificarReciboPago(id_alumno, retorno.agregar_pago_alumno);
                      //enviar datos de facturacion al canal de notificaciones
                      //enviarDatosParaFactura(id_alumno,retorno.agregar_pago_alumno);
                  }
                  response.status(200).json(results.rowCount);
              });*/
    });

};


const getPagosByCargoId = (idCargoBalanceAlumno) => {
    console.log("@getPagosByCargoId");

    console.log("request.params.id_cargo_balance_alumno " + idCargoBalanceAlumno);
    return genericDao.findAll(
        `
              SELECT forma_pago.id as id_forma_pago,
                    forma_pago.nombre as nombre_forma_pago,
                    pago.identificador_factura ,r.*
               FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                   inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
               WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
               ORDER BY pago.fecha DESC`,
        [idCargoBalanceAlumno]);
};





module.exports = {
    registrarPago,
    getPagosByCargoId

}