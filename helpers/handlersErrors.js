
const callbackErrorNoControlado = (ex, response) => {    
    //console.log("Excepcion no controlada " + ex);
    response.status(400).json({ mensaje: "Excepcion no controlada" });
}

const callbackError = (mensaje, response) => {
    //console.log(mensaje);
    response.status(400).json({ mensaje: mensaje });
}

module.exports = {
    callbackErrorNoControlado,
    callbackError
}