
const handle = require('../helpers/handlersErrors');
const corteService = require('../domain/corteService');
const request = require('request');//para invocar el api
const configEnv = require('../config/configEnv');

const API_WHATSAPP = 'http://66.172.27.131:5001/whatsapp/send';

const getCorteDiario =async () => {
    console.log("@getCorteDiario");
    try {
        

        const corte = await corteService.getCorteSucursales();

        console.log(JSON.stringify(corte));

        if(corte){

            let mensaje = 'SIN PAGOS REGISTRADOS HOY';

            for(let i = 0; i< corte.length; i++){
                 const suc = corte[i];
                mensaje+= ` ${suc.count} pagos de ${suc.sucursal} total $${suc.pago_total_sucursal} \n `;
            }

            const params = {
                phoneNumber: configEnv.WHATSAPP || "8110208406",
                message:mensaje,
                apiKey:"523bb545-0bc3-9d34-0a97-3588baefba11"
            };
            
            console.log("Enviar mensaje "+mensaje);

            request.post(`${API_WHATSAPP}`, {                
                json: params
            }, (error, res, body) => {
                if (error) {
                    console.log(" x x x x x x ERROR AL ENVIAR EL MENSAJE DE WHATSAPP x x x xx x x ");
                    console.error(error);                
                    reject(error)
                    return;
                }            
                console.log(" === MENSAjE ENVIAFO ===");
                console.log(body);                          
            })
        }


    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};

module.exports = {
    getCorteDiario,  
  
};
