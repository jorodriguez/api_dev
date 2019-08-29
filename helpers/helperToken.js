
const config = require('../config/config');
const jwt = require('jsonwebtoken');

const noTokenProvider={ auth: false, message: 'No token provided.' };

const failedAuthenticateToken = { auth: false, message: {}};

const validarToken = (request) => {
    console.log("validar token");
    try {
        const respuestaNoToken = { tokenValido: false, status: 401, mensajeRetorno: noTokenProvider };
        const respuestaFail = { tokenValido: false, status: 401,tokenExpired : false, mensajeRetorno: failedAuthenticateToken };
        const respuestaOk = { tokenValido: true, status: 200, mensajeRetorno: {} };      
        var token = request.headers['x-access-token'];        
        
        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        };

        var respuesta = respuestaOk;
        //{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2019-08-29T13:55:47.000Z"}
               
        jwt.verify(token, config.secret, function (err, decoded) {
            console.log("Validando token con store "+token);            
            if (err) {
                console.log("ERROR "+JSON.stringify(err));
                
                respuestaFail.failedAuthenticateToken.message = err;
                
                respuestaFail.failedAuthenticateToken.tokenExpired = (err.name == 'TokenExpiredError');
                
                console.log("x x x x x respuestaFail "+respuestaFail.mensajeRetorno.message+" x x x x x x ");                
                
                console.log("token expirado = "+respuestaFail.failedAuthenticateToken.tokenExpired);
                
                respuesta = respuestaFail;                
            }            
            console.log("Token OK");
        });
        //console.log("TERMINO VALIDACION TOKEN");
        return respuesta;        
    } catch (e) {
        console.log("Algun error al validar el token");
        return { tokenValido: false, status: 200, mensajeRetorno: {name:"Error inesperado"} };
    }
};



module.exports = {
    validarToken
}