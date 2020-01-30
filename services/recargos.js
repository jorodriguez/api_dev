const recargoService = require('../domain/recargosService');


function procesoRecargosMensualidad() {
    console.log("Inicinado ejecución del proceso para calcular recargos sucursal " );
    try {
        recargoService.ejecutarProcesoRecargoMensualidad();
    } catch (e) {
        console.log("[recargos] Excepcion al ejecutar el proceso de recargos " + e);
        //enviar un correo al equipo de soporte     
   }

}

function ejecutarEnvioRecordatorioPagoMensualidadPadres() {
    console.log("@ejecutarEnvioRecordatorioPagoMensualidadPadres");
    try {

      //enviar correo con la lista de recargos para aplicar mañana 
      recargoService.enviarRecordatorioPagoPadresAlumno();

    } catch (e) {
        console.log("Fallo la ejecucion del proceso que realiza recargos " + e);
    }

}

module.exports = {procesoRecargosMensualidad,ejecutarEnvioRecordatorioPagoMensualidadPadres};

