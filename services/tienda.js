
//const { pool } = require('../db/conexion');
//const handle = require('../helpers/handlersErrors');

/*
const obtenerProductos = (request, response) => {
    console.log("@obtenerProductos");
    try {
       // validarToken(request,response);        

        const { id_sucursal } = request.body;
  
        pool.query("s",
            [id_alumno, limit, offset],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log("Se llamo a la function de cargo ");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                //buscar el padre y enviarle la notificacion y el correo del registro del pago
                if(results.rowCount > 0){
                    let id_cargo_generado = results.rows[0].id;
                    response.status(200).json(results.rowCount)
                }                
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};*/


module.exports = {

};