
const config = require('../config/config');
const jwt = require('jsonwebtoken');

const noTokenProvider={ auth: false, message: 'No token provided.' };

const failedAuthenticateToken = { auth: false, message: 'Failed to authenticate token.' };

const validarToken = (request) => {
    console.log("validar token movil");
    try {
        const respuestaNoToken = { tokenValido: false, status: 401, mensajeRetorno: noTokenProvider };
        const respuestaFail = { tokenValido: false, status: 401,tokenExpired : false, mensajeRetorno: failedAuthenticateToken };
        const respuestaOk = { tokenValido: true, status: 200, mensajeRetorno: {} };      
        var token = request.headers['x-access-token'];                
        
        token = token.replace("Token ",'');
        
        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        };

        var respuesta = respuestaOk;
               
        jwt.verify(token, config.secret, function (err, decoded) {
            console.log("Validando token con store "+token);
            if (err) {
                console.log("ERROR "+JSON.stringify(err));
                
                respuestaFail.failedAuthenticateToken.message = err;
                
                respuestaFail.failedAuthenticateToken.tokenExpired = (err.name == 'TokenExpiredError');
                
                console.log("x x x x x respuestaFail "+respuestaFail.mensajeRetorno.message+" x x x x x x ");                

                console.log("token expirado = "+respuestaFail.failedAuthenticateToken.tokenExpired);
                
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