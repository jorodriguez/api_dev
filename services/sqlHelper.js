
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');

const QUERY = {
    FORMA_PAGO: "SELECT * FROM CO_FORMA_PAGO WHERE ELIMINADO = FALSE",
    CAT_GENERO: "SELECT * FROM CAT_GENERO WHERE ELIMINADO = FALSE",
    GRUPO: "SELECT * FROM CO_GRUPO WHERE ELIMINADO = false",
    SERVICIOS: "SELECT * FROM cat_servicio WHERE ELIMINADO = false order by nombre",
    CARGOS: "SELECT * FROM CAT_CARGO WHERE ELIMINADO = false order by nombre",
    SUCURSALES: "SELECT id,nombre,direccion,class_color FROM CO_SUCURSAL WHERE ELIMINADO = false ",
};


const getCatalogo = (query, response) => {
    console.log("@getCatalogo");
    try {

        if (query == undefined || query == '') {
            console.log("No esta definido el query");
            return;
        }

        pool.query(query,
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getResultQuery = (query, params, response, handler) => {
    console.log("@getResultQuery");
    try {


        if (query == undefined || query == '' || params == null) {
            console.log("No esta definido el query");
            return;
        }

        /* if(params == undefined || params == [] || params == null){
             console.log("No estan definidos los parametros []");
             return;
         }*/

        let tiene_parametros = tieneParametros(params);

        let hadlerGenerico = (results) => { console.log("Query Ejecutado correctamente.."); response.status(200).json(results.rows); };

        console.log(handler ? 'hanlder definido' : 'handler NO Definido');
        console.log("====> Con parametros " + tiene_parametros);

        if (tiene_parametros) {
            pool.query(query, params)
                .then(handler || hadlerGenerico)
                .catch((error) => {
                    handle.callbackError(error, response);
                    return;
                });
        } else {
            pool.query(query)
                .then(handler || hadlerGenerico)
                .catch((error) => {
                    handle.callbackError(error, response);
                    return;
                });
        }


    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

/*
EJEMPLO DE invocacion con hander 
executeQuery(`INSERT INTO USUARIO(nombre) VALUES($1)`,
                ['Joel Rodriguez Rojas'],
                response,
        (results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                let respuesta = null;

                if (results.rowCount > 0) {
                    respuesta = {
                        registrado: (results.rowCount > 0),
                        hora_salida: results.rows[0].hora_salida
                    };
                }
                response.status(200).json(respuesta);
    });

 --EJEMPLO SIN HANDLER

  executeQuery(`INSERT INTO USUARIO(nombre) VALUES($1)`,
                ['Joel Rodriguez Rojas'],
                response)
*/

const executeQuery = (query, params, response, handler) => {
    console.log("@executeQuery");
    try {

        if (query == undefined || query == '' || params == null) {
            console.log("No esta definido el query");
            return;
        }
        
        /*if (params == undefined || params == [] || params == null) {
            console.log("No estan definidos los parametros []");
            return;
        }*/
        let tiene_parametros = tieneParametros(params);

        let hadlerGenerico = (results) => {
            response.status(200).json(results.rowCount);
        };

        if(tieneParametros){
            pool.query(query, params)
            .then(handler || hadlerGenerico)
            .catch((error) => {
                console.log("XXXX EXCEPCION AL INSERT,UPDATE " + error);
                handle.callbackError(error, response);
                return;
            });
        }else{
            pool.query(query)
            .then(handler || hadlerGenerico)
            .catch((error) => {
                console.log("XXXX EXCEPCION AL INSERT,UPDATE " + error);
                handle.callbackError(error, response);
                return;
            });
        }
       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

function tieneParametros(params){
    return (params != undefined || params != null || params != []);
}

module.exports = {
    QUERY,
    getCatalogo,
    getResultQuery,
    executeQuery
}