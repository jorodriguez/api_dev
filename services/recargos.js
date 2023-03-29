const recargoService = require('../domain/recargosService');
const handle = require('../helpers/handlersErrors');
const correoService = require('../utils/CorreoService');

const corteService = require('./corte');

async function procesoRecargosMensualidad() {
    console.log("Inicinado ejecución del proceso para calcular recargos sucursal " );
    try {
         const retorno =  await recargoService.ejecutarProcesoRecargoMensualidad();         
         //correoService.enviarCorreo('joel@magicintelligence.com,joel.rod.roj@hotmail.com',"","Recargos Generados",`<h6>${JSON.stringify(retorno)}</h6`);
         //corteService.enviarMensaje(`Recargos generados ${JSON.stringify(retorno)}`);
         return retorno;
    } catch (e) {
        console.log("[recargos] Excepcion al ejecutar el proceso de recargos " + e);
        //enviar un correo al equipo de soporte     
        //correoService.enviarCorreo('joel@magicintelligence.com,joel.rod.roj@hotmail.com',"","Recargos Fail",`<h6>${e}</h6`);
        return [];
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



const obtenerPagosVencenSemanaActual = (request,response)=>{
    console.log("=======@obtenerPagosVencenSemanaActual sucursal ");
    try {
        
        let id_sucursal = request.params.id_sucursal;

        if(id_sucursal == undefined || id_sucursal== null || id_sucursal== 0){
            handle.callbackError("id_sucursal es empty", response);
            return;
        }
      
        recargoService
            .obtenerPagosVencenSemanaActual(id_sucursal)
            .then(results =>{
                response.status(200).json(results);
            }).catch(e=>{
                console.log(e);
                handle.callbackError(e, response);
            });
        } catch (e) {
            handle.callbackErrorNoControlado(e, response);
    
        }

};



const obtenerMensualidadesRecargoHoy = async (request,response)=>{
    console.log("@obtenerMensualidadesRecargoHoy");
    try {     
       const results = await recargoService.obtegerMensualidadesRecargo();
       response.status(200).json(results);
    } catch (e) {
        console.log("Fallo la ejecucion del proceso que realiza recargos " + e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const ejecutarRecargosMensualidad = async (request,response)=>{
    console.log("@ejecutarRecargosMensualidad");
    try {     
        //procesoRecargosMensualidad();
        const retorno =  await procesoRecargosMensualidad();
       response.status(200).json(retorno);
    } catch (e) {
        console.log("Fallo la ejecucion del proceso que realiza recargos " + e);
        handle.callbackErrorNoControlado(e, response);
    }
};

module.exports = {procesoRecargosMensualidad,ejecutarEnvioRecordatorioPagoMensualidadPadres,obtenerPagosVencenSemanaActual,
                  obtenerMensualidadesRecargoHoy,
                  ejecutarRecargosMensualidad};

