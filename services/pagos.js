

const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { CARGOS } = require('../utils/Constantes');
const { QUERY, getCatalogo, getResultQuery } = require('./sqlHelper');

const notificacionService = require('../utils/NotificacionService');

//registrar pagos
const registrarCargo = (request, response) => {
    console.log("@registrarCargo");
    try {

        const { fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero } = request.body;

        let parametros = [];
        let sql = "";

        let respuesta = {
            id_cargo: -1,
            resultado: Boolean,
            mensaje: ""
        };

        if (cat_cargo.cat_cargo == CARGOS.ID_CARGO_MENSUALIDAD) {
            if ((fecha_cargo == undefined || fecha_cargo == null)) {
                respuesta.resultado = false;
                respuesta.mensaje = "Se requiere la fecha del cargo.";
                return response.status(200).json(respuesta);
            }
            //parametros para mensualidad
            sql = "select agregar_cargo_alumno($1,$2,$3,$4,$5,$6,$7);";
            parametros = [new Date(fecha_cargo), id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
        } else {
            //no es mensualidad
            if ((fecha_cargo == undefined || fecha_cargo == null)) {
                sql = "select agregar_cargo_alumno(getDate(''),$1,$2,$3,$4,$5,$6);";
                parametros = [id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
            } else {
                sql = "select agregar_cargo_alumno($1,$2,$3,$4,$5,$6,$7);";
                parametros = [new Date(fecha_cargo), id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
            }
        }

        console.log("=====>> " + JSON.stringify(request.body));
        //fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer                             
        getResultQuery(
            sql,
            parametros,
            response,
            (results) => {
                console.log("Se llamo a la function de cargo ");
                //mensajeria.enviarMensaje("Actividad ",(nota==null || nota=='' ? 'sin nota':nota));
                //buscar el padre y enviarle la notificacion y el correo del registro del pago
                if (results.rowCount > 0) {
                    let id_cargo_generado = results.rows[0].id;
                    respuesta.id_cargo = id_cargo_generado;
                    respuesta.resultado = (id_cargo_generado != null);
                    respuesta.mensaje = `${results.rowCount} fila afectada`;
                    response.status(200).json(respuesta);
                } else {
                    respuesta.mensaje = "No se guardó el cargo.";
                    response.status(200).json(respuesta);
                }
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


//agregar_pago_alumno(IN id_alumno integer,pago_param numeric ,nota text ,id_genero integer,OUT retorno boolean) 
//registrar pagos
const registrarPago = (request, response) => {
    console.log("@registrarPago");
    try {
        //validarToken(request,response);        

        console.log("=====>> " + JSON.stringify(request.body));
        const { id_alumno, pago, nota, ids_cargos, cargos_desglosados, cat_forma_pago, identificador_factura, genero } = request.body;

        console.log("SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'" + identificador_factura + "'," + genero + " )");

        getResultQuery(
            "SELECT agregar_pago_alumno('" + ids_cargos + "','" + cargos_desglosados + "'," + id_alumno + "," + pago + ",'" + nota + "'," + cat_forma_pago + ",'" + identificador_factura + "'," + genero + " );",
            [],
            response,
            (results) => {
                if (results.rowCount > 0) {
                    let retorno = results.rows[0];
                    console.log("Retorno el ID " + JSON.stringify(results.rows));
                    notificacionService.notificarReciboPago(id_alumno, retorno.agregar_pago_alumno);
                }
                response.status(200).json(results.rowCount);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const getCatalogoCargos = (request, response) => {
    console.log("@getCatalogoCargos");
    getCatalogo(QUERY.CARGOS, response);
};


const getCargosAlumno = (request, response) => {
    console.log("@getCargosAlumno");
    try {
        //validarToken(request,response);        

        console.log("request.params.id_alumno " + request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

        getResultQuery(
            " SELECT a.co_balance_alumno," +
            "   b.id as id_cargo_balance_alumno," +
            "   b.fecha," +
            "   b.cantidad," +
            "   cargo.nombre as nombre_cargo," +
            "   cat_cargo as id_cargo," +
            "   cargo.es_facturable," +
            "   b.total as total," +
            "   b.cargo," +
            "   b.total_pagado," +
            "   b.nota," +
            "   b.pagado ," +
            "   false as checked ," +
            "   0 as pago " +
            " FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno " +
            "                               inner join cat_cargo cargo on b.cat_cargo = cargo.id					" +
            " WHERE a.id = $1 and b.eliminado = false and a.eliminado = false" +
            "  ORDER by b.pagado, b.fecha desc" +
            " LIMIT 20",
            [id_alumno],
            response);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getPagosByCargoId = (request, response) => {
    console.log("@getPagosByCargoId");
    try {
        console.log("request.params.id_cargo_balance_alumno " + request.params.id_cargo_balance_alumno);

        var id_cargo_balance_alumno = request.params.id_cargo_balance_alumno;

        getResultQuery(
            ` 	
              SELECT forma_pago.id as id_forma_pago,
                    forma_pago.nombre as nombre_forma_pago,
                    pago.identificador_factura ,r.*
               FROM co_pago_cargo_balance_alumno r inner join co_pago_balance_alumno pago on r.co_pago_balance_alumno = pago.id
                                                   inner join co_forma_pago forma_pago on pago.co_forma_pago = forma_pago.id
               WHERE r.co_cargo_balance_alumno = $1 and r.eliminado = false and pago.eliminado = false
               ORDER BY pago.fecha DESC`,
            [id_cargo_balance_alumno],
            response);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const getBalanceAlumno = (request, response) => {
    console.log("@getBalanceAlumno");
    try {

       console.log("request.params.id_alumno " + request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

        getResultQuery(
            " SELECT al.nombre as nombre_alumno,al.apellidos as apellidos_alumno, bal.* " +
            " FROM co_alumno al inner join  co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false" +
            " WHERE al.id = $1 and al.eliminado = false ",
            [id_alumno],
            response,
            (results) => {
                if (results.rowCount > 0) {

                    let balance_alumno = results.rows[0];

                    response.status(200).json(balance_alumno);

                } else {
                    console.log("No existe balance para el alumno " + id_alumno);

                    response.status(200).json({});
                }

                //response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const eliminarCargos = (request, response) => {
    console.log("@eliminarCargos");
    try {
        //validarToken(request,response);        

        const { ids, motivo, genero } = request.body;

        var idsCargos = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsCargos += (element + "");
                first = false;
            } else {
                idsCargos += (',' + element);
            }
        });

        console.log("Ids cargos eliminar  " + idsCargos);
        //eliminar_cargos_alumno(IN ids_cargos_param text,motivo text,ID_GENERO integer) 
        getResultQuery(
            "select eliminar_cargos_alumno('" + idsCargos + "','" + motivo + "'," + genero + ") as ids_cagos_eliminados;",
            [],
            response,
            (results) => {
                if (results.rowCount > 0) {
                    //Enviar mensaje de recepcion
                    console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                    var listaIdsCargos = results.rows.map(e => e.ids_cagos_eliminados);
                    console.log(" listaIdsCargos " + listaIdsCargos);
                    //enviarMensajeEntradaSalida(listaIdsAsistencias, ENTRADA);
                }
                response.status(200).json(results.rowCount);
            });
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

        getResultQuery(QUERY_MESES_SIN_CARGO_MESUALIDAD, [id_alumno, CARGOS.ID_CARGO_MENSUALIDAD], response);

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


const QUERY_MESES_SIN_CARGO_MESUALIDAD = `
    with  serie_meses as (
         SELECT g::date as fecha,
                to_char(g::date,'mm')::int as numero_mes,	
                to_char(g::date,'YY')::int as numero_anio,		
                CASE to_char(g::date,'mm'):: int 
                    WHEN 1 THEN 'ENERO' 
                    WHEN 2 THEN 'FEBRERO' 
                    WHEN 3 THEN 'MARZO' 
                    WHEN 4 THEN 'ABRIL'
                    WHEN 5 THEN 'MAYO' 
                    WHEN 6 THEN 'JUNIO'
                    WHEN 7 THEN 'JULIO'
                    WHEN 8 THEN 'AGOSTO'
                    WHEN 9 THEN 'SEPTIEMBRE'
                    WHEN 10 THEN 'OCTUBRE'
                    WHEN 11 THEN 'NOVIEMBRE'
                    WHEN 12 THEN 'DICIEMBRE'
                END as nombre_mes
            FROM  generate_series(
                    date_trunc('year', getDate(''))::timestamp,
                    (date_trunc('year', getDate(''))) + (interval '1 year') - (interval '1 day'),
                  '1 month')  g
            ), meses_pagados AS (
            select 
                sm.fecha,	  
                sm.nombre_mes,
                count(cb.*) as cout_registro
            from serie_meses sm inner join co_cargo_balance_alumno cb on to_char(cb.fecha,'MMYYYY') = to_char(sm.fecha,'MMYYYY')
            where cb.co_balance_alumno = (select co_balance_alumno from co_alumno where id = $1 and eliminado = false) 
                and cb.cat_cargo = $2
                and cb.eliminado = false
        group by  sm.nombre_mes,sm.fecha
      order by sm.fecha
    ) select (mp.cout_registro is not null) as cargo_registrado, *	   
    from serie_meses s left join meses_pagados mp on mp.fecha = s.fecha
`;



module.exports = {
    registrarPago,
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,
    getPagosByCargoId,
    eliminarCargos,
    obtenerMesesAdeudaMensualidad

}