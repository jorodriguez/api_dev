
const config = require('../config/configJwt');
const jwt = require('jsonwebtoken');

const noTokenProvider = { auth: false, message: 'No token provided.' };

const failedAuthenticateToken = { auth: false, message: {} };

const validarToken = (request, response) => {
    console.log("validar token");
    try {
        const respuestaNoToken = { tokenValido: false, status: 401, mensajeRetorno: noTokenProvider };
        const respuestaFail = { tokenValido: false, status: 401, tokenExpired: false, mensajeRetorno: failedAuthenticateToken };
        const respuestaOk = { tokenValido: true, status: 200, mensajeRetorno: {} };
        var token = request.headers['x-access-token'];

        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        }
        var respuesta = respuestaOk;
        //{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2019-08-29T13:55:47.000Z"}

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                console.log("ERROR " + JSON.stringify(err));

                respuestaFail.mensajeRetorno.message = err;

                respuestaFail.tokenExpired = (err.name == 'TokenExpiredError');

                console.log("x x x x x respuestaFail " + respuestaFail.mensajeRetorno.message + " x x x x x x ");

                console.log("token expirado = " + respuestaFail.tokenExpired);

                respuesta = respuestaFail;
            }
            console.log("Token OK");
            console.log("DECODED TOKEN" + JSON.stringify(decoded == undefined ? "FAIL " : decoded));
        });

        console.log(" " + JSON.stringify(respuesta));

        if (!respuesta.tokenValido) {
            console.log("%%%%%%%%%%%token invalido%%%%%%%%%%%");
            //response.status(respuesta.status).send(respuesta);
            response.status(respuesta.status).json(respuesta);
            return;
        } else {
            console.log("%%%%%%%%%%% PASO token invalido%%%%%%%%%%%");
            return respuesta;
        }
    } catch (e) {
        console.log("Algun error al validar el token " + e);
        response.status(401).send({ tokenValido: false, status: 200, mensajeRetorno: { name: "Error inesperado" } });
        return;
        //return { tokenValido: false, status: 200, mensajeRetorno: {name:"Error inesperado"} };
    }
};



const validarTokenCompleto = (request, response) => {
    console.log("validar token");
    try {
        const respuestaNoToken = { tokenValido: false, status: 401, mensajeRetorno: noTokenProvider };
        const respuestaFail = { tokenValido: false, status: 401, tokenExpired: false, mensajeRetorno: failedAuthenticateToken };
        const respuestaOk = { tokenValido: true, status: 200, mensajeRetorno: {} };
        var token = request.headers['x-access-token'];

        if (!token) {
            console.log(" x x x x x respuestaNoToken x x x x x");
            return respuestaNoToken;
        }

        var respuesta = respuestaOk;
        //{"name":"TokenExpiredError","message":"jwt expired","expiredAt":"2019-08-29T13:55:47.000Z"}

        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                console.log("ERROR " + JSON.stringify(err));

                respuestaFail.mensajeRetorno.message = err;

                respuestaFail.tokenExpired = (err.name == 'TokenExpiredError');

                console.log("x x x x x respuestaFail " + respuestaFail.mensajeRetorno.message + " x x x x x x ");

                console.log("token expirado = " + respuestaFail.tokenExpired);

                respuesta = respuestaFail;
            }
            console.log("Token OK");
            console.log("DECODED TOKEN" + JSON.stringify(decoded == undefined ? "FAIL " : decoded));
        });

        console.log(" " + JSON.stringify(respuesta));

  /*      if (!respuesta.tokenValido) {
            console.log("%%%%%%%%%%%token invalido%%%%%%%%%%%");
            //response.status(respuesta.status).send(respuesta);
            response.status(respuesta.status).json(respuesta);
            return;
        } else {
            console.log("%%%%%%%%%%% PASO token invalido%%%%%%%%%%%");
            return respuesta;
        }
*/
        return respuesta;
    } catch (e) {
        console.log("Algun error al validar el token " + e);
        //response.status(401).send({ tokenValido: false, status: 200, mensajeRetorno: { name: "Error inesperado" } });
        //return;
        return { tokenValido: false, status: 200, mensajeRetorno: {name:"Error inesperado"} };
    }
};



module.exports = {
    validarToken,validarTokenCompleto

};