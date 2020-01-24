
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

const gastoService = require('../domain/gastoService');

//registrar gasto
const registrarGasto = (request, response) => {
    console.log("@registrarGasto");
    try {

        var gastoData = request.body;

        gastoService.registrarGasto(gastoData)
        .then(id=>{
            response.status(200).json(id) 
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
        })
       
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

/*
        const co_sucursal = request.params.co_sucursal;
        const anio_mes = request.params.anio_mes;
        pool.query(
            `
                select 
                    tipo.nombre as nombre_tipo_gasto, 
                    fpago.nombre as nombre_tipo_pago,
                    suc.nombre as nombre_sucursal,
                    g.fecha::date as fecha,
                    g.*
                from co_gasto g inner join cat_tipo_gasto tipo on g.cat_tipo_gasto = tipo.id
                    inner join co_forma_pago fpago on g.co_forma_pago = fpago.id
                    inner join co_sucursal suc on g.co_sucursal = suc.id
                where suc.id = $1 and g.eliminado  = false  
                        and to_char(g.fecha,'YYYYMM') = $2
                order by g.fecha desc                
            `,
            [co_sucursal, anio_mes],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                response.status(200).json(results.rows);
            });*/
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
/*
        pool.query(
            `
            with meses AS(
                select generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as mes
			) select
					to_char(m.mes,'Mon-YYYY') as mes_anio,
					to_char(m.mes,'YYYYMM') as anio_mes,
					coalesce(sum(gasto.gasto),0) as suma
              from meses m left join co_gasto gasto on to_char(m.mes,'YYYYMM') = to_char(gasto.fecha,'YYYYMM') and gasto.eliminado = false			
                        and gasto.co_sucursal = $1
			group by to_char(m.mes,'Mon-YYYY'),to_char(m.mes,'YYYYMM')
			order by to_char(m.mes,'YYYYMM') desc                             
            `,
            [co_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                response.status(200).json(results.rows);
            });*/
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
/*
        pool.query(
            `               
            select 
                tipo.nombre as nombre_tipo_gasto, 
                fpago.nombre as nombre_tipo_pago,
                suc.nombre as nombre_sucursal,
                sum(g.gasto) as gasto_sucursal
            from co_gasto g inner join cat_tipo_gasto tipo on g.cat_tipo_gasto = g.id
                    inner join co_forma_pago fpago on g.co_forma_pago = fpago.id
                    inner join co_sucursal suc on g.co_sucursal = suc.id
            where  g.eliminado  = false
            group by tipo.nombre,fpago.nombre,suc.nombre
            `,
            [co_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                response.status(200).json(results.rows);
            });
            */
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
}