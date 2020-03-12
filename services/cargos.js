
const cargoService = require('../domain/cargoService');
const handle = require('../helpers/handlersErrors');

const registrarCargo = (request, response) => {
    console.log("@registrarCargo");
    
    try {
        const params = { fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero } = request.body;
        
        cargoService
            .registrarCargo(params)
            .then(respuesta=>{
                response.status(200).json(respuesta);
            }).catch(error=>{
                handle.callbackError(error,response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getCatalogoCargos = (request, response) => {
    console.log("@getCatalogoCargos");
    cargoService.getCatalogoCargos()
    .then(results=>{
        response.status(200).json(results);
    }).catch(error=>{
        handle.callbackError(error,response);
    });
};


const getCargosAlumno = (request, response) => {
    console.log("@getCargosAlumno");
    try {
        
        const id_alumno = request.params.id_alumno;

        cargoService.getCargosAlumno(id_alumno)
        .then(results => response.status(200).json(results))
        .catch(error => handle.callbackError(error,response));

    } catch (e) {
        console.log("ERROR "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const getBalanceAlumno = (request, response) => {
    console.log("@getBalanceAlumno");
    try {

       console.log("request.params.id_alumno " + request.params.id_alumno);

        const id_alumno = parseInt(request.params.id_alumno || 0);

        cargoService
        .getBalanceAlumno(id_alumno)
        .then(results=>response.status(200).json(results))
        .catch(error=>handle.callbackError(error,response));

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const eliminarCargos = (request, response) => {
    console.log("@eliminarCargos");
    try {
        //validarToken(request,response);        

        const cargosData = { ids, motivo, genero } = request.body;

        cargoService
        .eliminarCargos(cargosData)
        .then(results=> response.status(200).json(results))
        .catch(error=> handle.callbackError(error,response));
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const obtenerMesesAdeudaMensualidad = (request, response) => {
    console.log("@obtenerMesesAdeudaMensualidad");

    //id_alumno
    //id_cargo sera la constantes del id de la MENSUALIDAD
    try {

        const { id_alumno } = request.params;

        cargoService
            .obtenerMesesAdeudaMensualidad(id_alumno)
            .then(results => response.status(200).json(results))
            .catch(error => handle.callbackError(error,response));

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const obtenerFiltroAniosCargosSucursal = (request, response) => {
    console.log("@obtenerFiltroAniosCargosSucursal");
   
    try {

        const { id_sucursal } = request.params;

        cargoService
            .obtenerFiltroAniosCargosSucursal(id_sucursal)
            .then(results => response.status(200).json(results))
            .catch(error => handle.callbackError(error,response));

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};




module.exports = {
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,    
    eliminarCargos,
    obtenerMesesAdeudaMensualidad,
    obtenerFiltroAniosCargosSucursal
    
};