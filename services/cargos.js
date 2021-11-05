
const cargoService = require('../domain/cargoService');
const handle = require('../helpers/handlersErrors');
const { enviarEstadoCuenta } = require('../utils/NotificacionService');
const notificacionService = require('../utils/NotificacionService');

const registrarCargo = async (request, response) => {
    console.log("@registrarCargo");
    
    try {
        const params = { fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero } = request.body;
        
        const respuesta = await cargoService.registrarCargo(params);
        if(respuesta && respuesta.resultado){
            notificacionService.notificarCargo(params.id_alumno,respuesta.id_cargo);
        }        
        response.status(200).json(respuesta);
        /*cargoService
            .registrarCargo(params)
            .then(respuesta=>{
                response.status(200).json(respuesta);
            }).catch(error=>{
                handle.callbackError(error,response);
            });*/
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


const getCargosAlumno = async (request, response) => {
    console.log("@getCargosAlumno");
    try {
        
        const id_alumno = request.params.id_alumno;
        const limite = request.params.limite;
        
        const results = await cargoService.getCargosAlumno(id_alumno,limite);
        
        response.status(200).json(results);
        
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


const obtenerEstadoCuentaAlumno = async (request, response) => {
    console.log("@obtenerEstadoCuentaAlumno");    
    try {

        const { id_alumno } = request.params;

        const estadoCuenta = await cargoService.obtenerEstadoCuentaAlumno(id_alumno);

        response.status(200).json(estadoCuenta);       

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const enviarEstadoCuentaAlumno = async (request, response) => {
    console.log("@enviarEstadoCuentaAlumno");    
    try {

        const { id_alumno } = request.body;

        await enviarEstadoCuenta(id_alumno);

        response.status(200).json({procesado:true});       

    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const obtenerHtmlPreviewEstadoCuenta = async (request, response) => {
    console.log("@obtenerHtmlPreviewEstadoCuenta");    
    try {

        const { id_alumno } = request.params;

        const html = await cargoService.obtenerPreviewEstadoCuenta(id_alumno);

        //response.status(200).json(html);               
        response.status(200).send(html);

    } catch (e) {
        console.log(e);
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
    obtenerFiltroAniosCargosSucursal,
    obtenerEstadoCuentaAlumno,
    enviarEstadoCuentaAlumno,
    obtenerHtmlPreviewEstadoCuenta
    
};