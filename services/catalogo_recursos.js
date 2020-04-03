
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const {validarToken} = require('../helpers/helperTokenMovil');
const catalogoRecursosService = require('../domain/catalogoRecursosService');

const getAlumnosPorFamiliar = (request, response) => {
    console.log("@getAlumnosPorFamiliar");
    try {
  
        var respuesta =  validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }                
        
        const id_familiar = request.params.id_familiar;
        console.log("id_familiar = "+id_familiar);
        catalogoRecursosService.getAlumnosPorFamiliar(id_familiar)
        .then(results=>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
        
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getRecursosPorGrupo = (request, response) => {
    console.log("@getRecursosPorGrupo");
    try {
  
        var respuesta =  validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }                
        
        const id_grupo = request.params.id_grupo;
        
        console.log("id_grupo = "+id_grupo);

        catalogoRecursosService.getRecursosPorGrupo(id_grupo)
        .then(results=>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
        
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



module.exports = {
    getAlumnosPorFamiliar,
    getRecursosPorGrupo
};