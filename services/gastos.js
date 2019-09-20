
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria = require('./mensajesFirebase');

//registrar gasto
const registrarGasto = (request, response) => {
    console.log("@registrarGasto");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { cat_tipo_gasto, co_forma_pago, co_sucursal, fecha, gasto, observaciones, genero } = request.body;

        console.log("=====>> " + JSON.stringify(request.body));

        pool.query(`INSERT INTO CO_GASTO(cat_tipo_gasto,co_forma_pago,co_sucursal,fecha,gasto,observaciones,genero)
                    VALUES($1,$2,$3,$4,$5,$6,$7);`,
            [cat_tipo_gasto, co_forma_pago, co_sucursal, fecha, gasto, observaciones, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));                
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const modificarGasto = (request, response) => {
    console.log("@modificarGasto");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { id, cat_tipo_gasto, co_forma_pago, fecha, gasto, observaciones, genero } = request.body;

        pool.query(`
                    UPDATE CO_GASTO
                        SET cat_tipo_gasto = $2,
                            co_forma_pago = $3,                            
                            fecha = $4,
                            gasto = $5,
                            observaciones = $6,
                            modifico = $7,
                            fecha_modifico = (getDate('')+getHora(''))::timestamp
                     WHERE ID = $1;
                    `,
            [id, cat_tipo_gasto, co_forma_pago, fecha, gasto, observaciones, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const eliminarGasto = (request, response) => {
    console.log("@eliminarGasto");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const id = request.params.id;
        const { genero } = request.body;

        pool.query(`
                    UPDATE CO_GASTO
                        SET eliminado = true,
                            modifico= $2,
                             fecha_modifico = (getDate('')+getHora(''))::timestamp
                     WHERE ID = $1;
                    `,
            [id, genero],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rowCount)
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};

const getCatalogoTipoGasto = (request, response) => {
    console.log("@getCatalogoTipoGasto");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        pool.query(
            "SELECT * from cat_tipo_gasto where eliminado = false order by nombre",
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


const getGastosPorSucursal = (request, response) => {
    console.log("@getGastosPorSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("request.params.co_sucursal" + request.params.co_sucursal);

        const co_sucursal = request.params.co_sucursal;
        const anio_mes = request.params.anio_mes;
        pool.query(
            `
                select 
                    tipo.nombre as nombre_tipo_gasto, 
                    fpago.nombre as nombre_tipo_pago,
                    suc.nombre as nombre_sucursal,
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
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getSumaMesGastosPorSucursal = (request, response) => {
    console.log("@getSumaMesGastosPorSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("request.params.co_sucursal" + request.params.co_sucursal);

        const co_sucursal = request.params.co_sucursal;

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
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



//fix es por mes y sucursal
const getGastosAgrupadosPorSucursal = (request, response) => {
    console.log("@getGastosAgrupadosPorSucursal");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        console.log("request.params.co_sucursal" + request.params.co_sucursal);

        const co_sucursal = request.params.co_sucursal;

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
    getSumaMesGastosPorSucursal

}