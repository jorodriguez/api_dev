
const config = require('../config/config');
const jwt = require('jsonwebtoken');

const noTokenProvider={ auth: false, message: 'No token provided.' };

const failedAuthenticateToken = { auth: false, message: 'Failed to authenticate token.' };

const validarToken = (request,response) => {
    console.log("validar token movil");
    try {
        const respuestaNoToken = { tokenValido: false, estatus:false, statusNumber: 401, mensajeRetorno: noTokenProvider ,respuesta:null};
        const respuestaFail = { tokenValido: false,estatus:false, statusNumber: 401,tokenExpirado : false, mensajeRetorno: failedAuthenticateToken ,respuesta:null};
        const respuestaOk = { tokenValido: true,estatus:true,tokenExpirado:false, statusNumber: 200, mensajeRetorno: {} , respuesta:null};      
        var token = request.headers['x-access-token'];                
        
        token = token.replace("Token ",'');
        
        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        };

        var respuesta = respuestaOk;
               
        jwt.verify(token, config.secret, function (err, decoded) {
         //   console.log("Validando token con store "+token);
            if (err) {
                console.log("ERROR "+JSON.stringify(err));
                
                respuestaFail.mensajeRetorno.message = err;
                
                respuestaFail.tokenExpirado = (err.name == 'TokenExpiredError');
                
                console.log("x x x x x respuestaFail "+respuestaFail.mensajeRetorno.message+" x x x x x x ");                

                console.log("token expirado = "+respuestaFail.tokenExpirado);
                
                console.log(""+err);                
                respuesta = respuestaFail;                
            }else{
                console.log("Token OK");
            }
        });
               
        //console.log("TERMINO VALIDACION TOKEN");
        return respuesta;        
    } catch (e) {
        console.log("Algun error al validar el token "+e);
        return { tokenValido: false, status: 200, mensajeRetorno: {name:"Error inesperado"} };
    }
};

module.exports = {
    validarToken
}