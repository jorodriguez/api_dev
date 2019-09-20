
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mailService = require('../utils/NotificacionService');

const cambiarSucursalAlumno = (request, response) => {
    console.log("@cambiarSucursalAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id_alumno = request.params.id_alumno;
        const { id_sucursal_origen,id_sucursal_destino, genero } = request.body;

        console.log(" id alumn "+id_alumno);
        console.log(" orig "+id_sucursal_origen);
        console.log(" dest "+id_sucursal_destino);
        console.log(" genero "+genero);

        if (id_alumno == undefined && id_sucursal == undefined && genero == null) {
            response.status(500).json({ mensaje: "Todos los parametros son requeridos" });
            return;
        } else {

            console.log("Cambiando de sucursal el alumno");
            //1 id alumno  //2 sucursal destino  //3 modifico  //4 sucursal origen 
            new Promise((resolve, reject) => {
                pool.query(
                    `   
                    WITH updated AS (
                        UPDATE co_alumno 
                        SET co_sucursal = $2::integer,
                            modifico = $3::integer,
                            fecha_modifico = (getDate('')+getHora(''))::timestamp	
                        WHERE ID = $1
                        RETURNING id, $4::integer as id_sucursal_origen
                    ) SELECT 
                            a.id,
                            a.nombre ||' '|| a.apellidos as nombre_alumno,  
                            s.nombre AS nombre_sucursal_destino,
                            (select nombre from co_sucursal suc where id = u.id_sucursal_origen ) as nombre_sucursal_origen
                      FROM co_alumno a inner join updated u ON a.id = u.id 
                                         inner join co_sucursal s ON s.id = a.co_sucursal
                      WHERE a.ID = u.id;
                    `
                    , [id_alumno, id_sucursal_destino, genero,id_sucursal_origen],
                    (error, results) => {
                        if (error) {
                            reject(error);
                        }
                        if (results && results.rowCount > 0) {

                            resolve(results.rows[0]);

                        } else {
                            reject(null);
                        }
                        resolve(null);
                    });
            }).then((alumno) => {
                console.log("alumno cambiado de sucursal")
                if (alumno != null) {
                    // enviar correo
                    //para, asunto, params
                    /*mailService.enviarCorreoCambioSucursal(
                        alumno.nombre_alumno, id_sucursal_origen, id_sucursal_destino
                        );*/
                    response.status(200).json(alumno.id);
                } else {
                    response.status(200).json(0);
                }
            }).catch((e) => {
                handle.callbackError(e, response)
            });
        }
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }

};


module.exports = {
    cambiarSucursalAlumno
}