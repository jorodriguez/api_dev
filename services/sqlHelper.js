
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');

const QUERY = {
    FORMA_PAGO: "SELECT * FROM CO_FORMA_PAGO WHERE ELIMINADO = FALSE",
    CAT_GENERO_FAMILIAR: "SELECT * FROM CAT_GENERO WHERE ELIMINADO = FALSE AND TIPO = 'FAMILIAR'",
    CAT_GENERO_ALUMNO: "SELECT * FROM CAT_GENERO WHERE ELIMINADO = FALSE AND TIPO = 'ALUMNO'",
    GRUPO: "SELECT * FROM CO_GRUPO WHERE ELIMINADO = false",
    SERVICIOS: "SELECT * FROM cat_servicio WHERE ELIMINADO = false order by nombre",
    CARGOS: "SELECT * FROM CAT_CARGO WHERE ELIMINADO = false order by nombre",
    SUCURSALES: "SELECT id,nombre,direccion,class_color FROM CO_SUCURSAL WHERE ELIMINADO = false ",
    TEMPLATE_EMPRESA : `
        SELECT t.nombre as nombre_template,
            t.encabezado,
            t.pie,
            em.nombre as nombre_empresa,
            em.direccion,
            em.telefono		
        from co_template t inner join co_empresa em on em.id = t.id
        where em.id = $1 and t.eliminado = false order by t.id desc limit 1`
    
};


const getCatalogo = (query, response) => {
    console.log("@getCatalogo");
    try {

        if (query == undefined || query == '') {
            console.log("No esta definido el query");
            return;
        }

        pool.query(query, (error, results) => {
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


function getResults(query, params, handler) {
    getResults(query, params, handler, undefined);
}


function getResults(query, params, handler, handlerCatch) {
    console.log("@getResults");
    try {

        if (query == undefined || query == '' || query == null) {
            console.log("No esta definido el query");
            return;
        }

        if (handler == undefined || handler == '' || handler == null) {
            console.log("No esta definido el handler el query");
            return;
        }


        if (handlerCatch == undefined || handlerCatch == '' || handlerCatch == null) {

            handlerCatch = (error) => {
                console.log("Exepcion al realizar el query " + query + " /n causa " + error);
            };
        }

        let tiene_parametros = tieneParametros(params);

        console.log("tiene parametros " + tiene_parametros);

        if (tiene_parametros) {
            pool.query(query, params)
                .then(handler)
                .catch(handlerCatch);
        } else {
            pool.query(query)
                .then(handler)
                .catch(handlerCatch);
        }
    } catch (e) {
        console.log("Excepción al ejecutar el query " + e);
    }
}



const getResultQuery = (query, params, response, handler) => {
    console.log("@getResultQuery");
    try {

       let hadlerGenerico = (results) => {
            console.log("Query Ejecutado correctamente..");
            response.status(200).json(results.rows);
        };

       let handlerCatch = (error) => {
           console.log("Excepcion al ejecutar el query "+error);
            handle.callbackError(error, response);
            return;
        };

        console.log("*****************************************************");
        getResults(query, params, handler || hadlerGenerico, handlerCatch);

        
        
        
           /*     if (query == undefined || query == '' || query == null) {
                    console.log("No esta definido el query");
                    return;
                }
             
        
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
        */

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const executeQuery = (query, params, response, handler) => {
    console.log("@executeQuery");
    try {

        if (query == undefined || query == '' || params == null) {
            console.log("No esta definido el query");
            return;
        }

      
        let tiene_parametros = tieneParametros(params);

        let hadlerGenerico = (results) => {
            response.status(200).json(results.rowCount);
        };

        if (tiene_parametros) {
            pool.query(query, params)
                .then(handler || hadlerGenerico)
                .catch((error) => {
                    console.log("XXXX EXCEPCION AL INSERT,UPDATE " + error);
                    handle.callbackError(error, response);
                    return;
                });
        } else {
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


function tieneParametros(params) {
    return (params != undefined || params != null || params != []);
}

function getQueryInstance(query,params){
    
    let tiene_parametros = tieneParametros(params);

    console.log("Tiene parametros "+tiene_parametros+" PARAMS "+JSON.stringify(params));
    console.log("Query "+query);

    return tiene_parametros ? pool.query(query, params) : pool.query(query);

    //return pool.query(query,params);
}

module.exports = {
    getQueryInstance,
    QUERY,
    getCatalogo,
    getResultQuery,    
    getResults,
    executeQuery//FIX
};