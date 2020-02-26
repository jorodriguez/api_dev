
const callbackErrorNoControlado = (ex, response) => {    
    console.log("Excepcion no controlada " + ex);
    response.status(400).json({status:false,respuesta:false, mensajeRetorno: "Excepcion no controlada" });
};

const callbackError = (mensaje, response) => {
    console.log(mensaje);
    response.status(400).json({ status:false,respuesta:false, mensajeRetorno: mensaje });
};

module.exports = {
    callbackErrorNoControlado,
    callbackError
};