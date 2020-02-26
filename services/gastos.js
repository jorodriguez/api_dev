
const handle = require('../helpers/handlersErrors');

const gastoService = require('../domain/gastoService');

//registrar gasto
const registrarGasto = (request, response) => {
    console.log("@registrarGasto");
    try {

        var gastoData = request.body;

        gastoService.registrarGasto(gastoData)
        .then(id=>{
            response.status(200).json(id);
        }).catch(error=>{
            handle.callbackError(error, response);
        });              
     
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const modificarGasto = (request, response) => {
    console.log("@modificarGasto");
    try {
     
        var gastoData = request.body;

        gastoService.modificarGasto(gastoData)
        .then(id=>{
            response.status(200).json(id);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const eliminarGasto = (request, response) => {
    console.log("@eliminarGasto");
    try {
        const id = request.params.id;
        const { genero } = request.body;

        gastoService.eliminarGasto(id,genero)
        .then(id=>{
            response.status(200).json(id);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};

const getCatalogoTipoGasto = (request, response) => {
    console.log("@getCatalogoTipoGasto");
    try {

        gastoService.getCatalogoTipoGasto()
        .then(results =>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getGastosPorSucursal = (request, response) => {
    console.log("@getGastosPorSucursal");
    try {
        console.log("request.params.co_sucursal" + request.params.co_sucursal);
        const co_sucursal = request.params.co_sucursal;
        const anio_mes = request.params.anio_mes;

        gastoService.getGastosPorSucursal(co_sucursal,anio_mes)
        .then(results=>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getSumaMesGastosPorSucursal = (request, response) => {
    console.log("@getSumaMesGastosPorSucursal");
    try {
       // validarToken(request,response);

        console.log("request.params.co_sucursal" + request.params.co_sucursal);

        const co_sucursal = request.params.co_sucursal;
        gastoService.getSumaMesGastosPorSucursal(co_sucursal)
        .then(results=>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });
        
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



//fix es por mes y sucursal
const getGastosAgrupadosPorSucursal = (request, response) => {
    console.log("@getGastosAgrupadosPorSucursal");
    try {
        //validarToken(request,response);

        console.log("request.params.co_sucursal" + request.params.co_sucursal);

        const co_sucursal = request.params.co_sucursal;
        gastoService.getGastosAgrupadosPorSucursal(co_sucursal)
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
    registrarGasto,
    modificarGasto,
    getCatalogoTipoGasto,
    getGastosPorSucursal,
    eliminarGasto,
    getSumaMesGastosPorSucursal,
    getGastosAgrupadosPorSucursal
};