
const config = require('../config/config');
const jwt = require('jsonwebtoken');

const noTokenProvider={ auth: false, message: 'No token provided.' };

const failedAuthenticateToken = { auth: false, message: 'Failed to authenticate token.' };

const validarToken = (request) => {
    console.log("validar token");
    try {
        const respuestaNoToken = { tokenValido: false, status: 401, mensajeRetorno: noTokenProvider };
        const respuestaFail = { tokenValido: false, status: 401, mensajeRetorno: failedAuthenticateToken };
        const respuestaOk = { tokenValido: true, status: 200, mensajeRetorno: {} };      
        var token = request.headers['x-access-token'];        
        console.log("Antes : "+token);
        token = token.replace("Token ",token);
        console.log("Despues : "+token);
        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        };

        var respuesta = respuestaOk;
               
        jwt.verify(token, config.secret, function (err, decoded) {
            console.log("Validando token con store "+token);
            if (err) {
                console.log("x x x x x respuestaFail "+respuestaFail.mensajeRetorno.message+" x x x x x x ");                
                respuesta = respuestaFail;                
            }            
            console.log("Token OK");
        });
        //console.log("TERMINO VALIDACION TOKEN");
        return respuesta;        
    } catch (e) {
        console.log("Algun error al validar el token");
        return { tokenValido: false, status: 200, mensajeRetorno: {} }
    }
};



module.exports = {
    validarToken
}