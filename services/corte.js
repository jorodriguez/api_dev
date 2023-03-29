
const handle = require('../helpers/handlersErrors');
const corteService = require('../domain/corteService');
const request = require('request');//para invocar el api
const configEnv = require('../config/configEnv');

const API_WHATSAPP = 'http://66.172.27.131:5001/whatsapp/send';

const formatPrice = (value)=>{

    let val = (value / 1).toFixed(2).replace(',', '.')

    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")

}

const getCorteDiario =async () => {
    console.log("@getCorteDiario");
    try {
        

        const fechaCorte = await corteService.getFechaCorte();
        const corte = await corteService.getCorteSucursales();
        
        console.log(JSON.stringify(fechaCorte));
        
        let mensaje = '';

        if(corte){           
            
            mensaje = 'PAGOS REALIZADOS '+fechaCorte.fecha;
            
            if(corte.length > 0){            
               for(let i = 0; i< corte.length; i++){
                    const suc = corte[i];
                    mensaje+= ` ${suc.count} pagos de ${suc.sucursal} : *$${formatPrice(suc.pago_total_sucursal)}* \n `;
                }
            }else{
                mensaje = 'NUNGÚN PAGO REGISTRADO HOY '+fechaCorte.fecha;
            }
                     
            console.log("Enviar mensaje "+mensaje);
            
            enviarMensaje(mensaje);

        }

         mensaje = ' TOTAL DE ADEUDOS PENDIENTES \n ';

        const corteAdeudos = await corteService.getCorteAdeudoSucursales();
        
        if(corteAdeudos){
            
            for(let i = 0; i< corteAdeudos.length; i++){
                const suc = corteAdeudos[i];
                mensaje+= `*$${formatPrice(suc.total_adeudo)}* pendiente por cobrar en ${suc.sucursal} \n `;
            }

            enviarMensaje(mensaje);

        }


    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const enviarMensaje = (_mensaje)=>{

    const params = {
        phoneNumber: configEnv.WHATSAPP || "8110208406",
        message:_mensaje,
        apiKey:"523bb545-0bc3-9d34-0a97-3588baefba11"
    };

    request.post(`${API_WHATSAPP}`, {                
        json: params
    }, (error, res, body) => {
        if (error) {
            console.log(" x x x x x x ERROR AL ENVIAR EL MENSAJE DE WHATSAPP x x x xx x x ");
            console.error(error);                                    
            return;
        }            
        console.log(" === MENSAjE ENVIAFO ===");
        console.log(body);                          
    });
}

module.exports = {
    getCorteDiario,  
    enviarMensaje
  
};
