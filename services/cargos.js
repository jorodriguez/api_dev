
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
/*
        let parametros = [];
        let sql = "";

        let respuesta = {
            id_cargo: -1,
            resultado: Boolean,
            mensaje: ""
        };

        console.log("CARGOS.ID_CARGO_MENSUALIDAD "+JSON.stringify(cat_cargo));

        if (cat_cargo.id == CARGOS.ID_CARGO_MENSUALIDAD) {
            if ((fecha_cargo == undefined || fecha_cargo == null || fecha_cargo.fecha_mes == undefined || fecha_cargo.fecha_mes == null)) {
                respuesta.resultado = false;
                respuesta.mensaje = "Se requiere la fecha del cargo.";                
                return response.status(200).json(respuesta);
            }
            console.log("cat_cargo.cat_cargo  "+fecha_cargo.fecha_mes);
            //parametros para mensualidad
            sql = "select agregar_cargo_alumno($1,$2,$3,$4,$5,$6,$7) as id_cargo_generado;";
            parametros = [new Date(fecha_cargo.fecha_mes), id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
        } else {
            //no es mensualidad            
            sql = "select agregar_cargo_alumno(getDate(''),$1,$2,$3,$4,$5,$6) as id_cargo_generado;";
            parametros = [id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
           
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
                    var id_cargo_generado = results.rows[0].id_cargo_generado;
                    console.log("IDE CARGO GENERADO RESULT "+JSON.stringify(results.rows));
                    respuesta.id_cargo = id_cargo_generado;
                    respuesta.resultado = (id_cargo_generado != null);
                    respuesta.mensaje = `${results.rowCount} fila afectada`;
                    //notificacionService.notificarCargo(id_alumno,id_cargo_generado);

                    response.status(200).json(respuesta);
                } else {
                    respuesta.mensaje = "No se guardó el cargo.";
                    response.status(200).json(respuesta);
                }
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
    })
};


const getCargosAlumno = (request, response) => {
    console.log("@getCargosAlumno");
    try {
        
        const id_alumno = request.params.id_alumno;

        cargoService.getCargosAlumno(id_alumno)
        .then(results => response.status(200).json(results))
        .catch(error => handle.callbackError(error,response));
/*
        console.log("request.params.id_alumno " + request.params.id_alumno);

        var id_alumno = request.params.id_alumno;

        getResultQuery(
            ` SELECT a.co_balance_alumno,
               b.id as id_cargo_balance_alumno,
               b.fecha,
               b.cantidad,
               cargo.nombre as nombre_cargo,
               b.texto_ayuda,
               cat_cargo as id_cargo,
               cargo.es_facturable,
               b.total as total,
               b.cargo,
               b.total_pagado,
               b.nota,
               b.pagado,
               false as checked ,
               0 as pago 
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
             WHERE a.id = $1 and b.eliminado = false and a.eliminado = false
              ORDER by b.pagado, b.fecha desc
             LIMIT 20 `,
            [id_alumno],
            response);*/
    } catch (e) {
        console.log("ERROR "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const getBalanceAlumno = (request, response) => {
    console.log("@getBalanceAlumno");
    try {

       console.log("request.params.id_alumno " + request.params.id_alumno);

        const id_alumno = request.params.id_alumno;

        cargoService
        .getBalanceAlumno(id_alumno)
        .then(results=>response.status(200).json(results))
        .catch(error=>handle.callbackError(error,response));
/*
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
            });*/
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
/*
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
            });*/
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
/*
        console.log("ID alumno "+id_alumno);
        console.log("CARGOS.ID_CARGO_MENSUALIDAD "+CARGOS.ID_CARGO_MENSUALIDAD);

        getResultQuery(QUERY_MESES_SIN_CARGO_MESUALIDAD, [id_alumno, CARGOS.ID_CARGO_MENSUALIDAD], response);
*/
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

module.exports = {
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,    
    eliminarCargos,
    obtenerMesesAdeudaMensualidad

}