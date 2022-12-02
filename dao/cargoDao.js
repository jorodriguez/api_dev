const { CARGOS } = require('../utils/Constantes');
const { QUERY } = require('../services/sqlHelper');
const genericDao = require('./genericDao');
const { ExceptionDatosFaltantes, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');

//registrar pagos
const registrarCargo = (cargoData) => {
    console.log("@registrarCargo");

    return new Promise((resolve, reject) => {
        const { fecha_cargo, id_alumno, cat_cargo, cantidad, monto, nota, genero } = cargoData;

        let parametros = [];
        let sql = "";

        let respuesta = {
            id_alumno: id_alumno,
            id_cargo: -1,
            resultado: Boolean,
            mensaje: ""
        };

        console.log("CARGOS.ID_CARGO_MENSUALIDAD " + JSON.stringify(cat_cargo));

        if (cat_cargo.id == CARGOS.ID_CARGO_MENSUALIDAD) {
            if ((fecha_cargo == undefined || fecha_cargo == null || fecha_cargo.fecha_mes == undefined || fecha_cargo.fecha_mes == null)) {
                respuesta.resultado = false;
                respuesta.mensaje = "Se requiere la fecha del cargo.";
                reject(new ExceptionDatosFaltantes(respuesta));
                return;
            }
            console.log("cat_cargo.cat_cargo  " + fecha_cargo.fecha_mes);
            //parametros para mensualidad
            sql = "select agregar_cargo_alumno($1,$2,$3,$4,$5,$6,$7) as id_cargo_generado;";
            parametros = [new Date(fecha_cargo.fecha_mes), id_alumno, cat_cargo.id, cantidad, monto, nota, genero];
        } else {
            //no es mensualidad            
            sql = "select agregar_cargo_alumno(getDate(''),$1,$2,$3,$4,$5,$6) as id_cargo_generado;";
            parametros = [id_alumno, cat_cargo.id, cantidad, monto, nota, genero];

        }

        //fecha_cargo date,id_alumno integer, id_cargo integer, cantidad integer,monto numeric,nota text, id_genero integer                             
        genericDao.executeProcedureWithParameters(sql, parametros)
            .then(results => {
                if (results.rowCount > 0) {
                    var id_cargo_generado = results.rows[0].id_cargo_generado;
                    console.log("IDE CARGO GENERADO RESULT " + JSON.stringify(results.rows));
                    respuesta.id_cargo = id_cargo_generado;
                    respuesta.resultado = (id_cargo_generado != null);
                    respuesta.mensaje = `${results.rowCount} fila afectada`;
                    //notificacionService.notificarCargo(id_alumno,id_cargo_generado);                   
                    console.log("Se agrego el cargo correctamente...");
                    resolve(respuesta);
                } else {
                    respuesta.mensaje = "No se guardó el cargo.";
                    console.log("no se guardo el cargo..");
                    reject(respuesta);
                }
            }).catch(error => {
                respuesta.resultado = false;
                respuesta.error = error;
                console.log("Error al intentar ejecutar el procedimiento de registro de cargo " + error);
                reject(respuesta);
            });

    });

};

//fecha_limite_pago_mensualidad = (fecha_limite_pago_mensualidad + interval '1 month')


const completarRegistroRecargoMensualidad = (idCargoMensualidad, idRecargo, genero) => {

    console.log(`=========================idCargoMensualidad ${idCargoMensualidad},idRecargo ${idRecargo}, genero ${genero}`);

    return genericDao.execute(` UPDATE co_cargo_balance_alumno 
                                SET co_cargo_balance_alumno = $2,
                                    recargo = true,                                    
                                    fecha_modifico = (getDate('')+getHora(''))::timestamp,
                                    modifico = $3
                                WHERE id = $1 RETURNING id;`, [idCargoMensualidad, idRecargo, genero]);
};


const getCatalogoCargos = async(idSucursal) => {
    console.log("@getCatalogoCargos");
    //return genericDao.findAll(QUERY.CARGOS, []);
    return await genericDao.findAll(` select c.* from cat_cargo c where c.eliminado = false and c.co_sucursal = $1 or c.sistema = true `, [idSucursal]);
};

const getCargosAlumno = (idAlumno, limite) => {
    console.log("@getCargosAlumno");

    //pagina = (pagina-1);
    console.log("request.params.id_alumno " + idAlumno);
    console.log("limite " + limite);
    //console.log("pagin " + pagina);

    //    let offset = (limite * pagina);

    return genericDao.findAll(
        ` SELECT a.co_balance_alumno,
               b.id as id_cargo_balance_alumno,
               b.fecha,
               to_char(b.fecha,'dd-mm-yyyy HH24:MI') as fecha_format,
               b.cantidad,
               cargo.nombre as nombre_cargo,
               cargo.aplica_descuento,
               b.texto_ayuda,
               cat_cargo as id_cargo,
               cargo.es_facturable,
               b.total as total,
               b.cargo,
               b.total_pagado,
               b.nota,
               b.pagado,
               b.tiempo_horas,
               b.cat_tipo_cobranza,
               (des.id is not null) as descuento_aplicado,
	           des.id as id_descuento,
               des.nombre as nombre_descuento,   
               b.descuento, 
               false as checked,
               0 as pago 
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = $1 and b.eliminado = false and a.eliminado = false
             ORDER by b.pagado, b.fecha desc
             LIMIT ${limite}`, [idAlumno]);
    //LIMIT ${limite} OFFSET ${offset}
};

const getBalanceAlumno = (idAlumno) => {
    console.log("@getBalanceAlumno");
    console.log("id_alumno ** " + idAlumno);
    return genericDao.findOne(
        `SELECT al.nombre as nombre_alumno,al.apellidos as apellidos_alumno,to_char(al.fecha_limite_pago_mensualidad,'dd-Mon') as fecha_limite_pago_mensualidad, bal.* 
         FROM co_alumno al inner join  co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false
         WHERE al.id = $1::int and al.eliminado = false `, [idAlumno]);
    /*
    response,
    (results) => {
        if (results.rowCount > 0) {

            let balance_alumno = results.rows[0];

            response.status(200).json(balance_alumno);

        } else {
            console.log("No existe balance para el alumno " + id_alumno);

            response.status(200).json({});
        }            
    });*/

};



const eliminarCargos = (cargosData) => {
    console.log("@eliminarCargos");

    return new Promise((resolve, reject) => {
        if (isEmptyOrNull(cargosData)) {
            reject(new ExceptionDatosFaltantes("Son nulls los ids a eliminar"));
            return;
        }

        const { ids, motivo, genero } = cargosData;

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
        genericDao
            .executeProcedure(`SELECT eliminar_cargos_alumno('${idsCargos}','${motivo}',${genero}) as ids_cagos_eliminados;`)
            .then(results => {
                if (results.rowCount > 0) {
                    //Enviar mensaje de recepcion
                    console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                    var listaIdsCargos = results.rows.map(e => e.ids_cagos_eliminados);
                    console.log(" listaIdsCargos " + listaIdsCargos);
                    resolve(listaIdsCargos);
                }
            }).catch(error => {
                reject(new ExceptionBD(error));
            });

        /*
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
    });
};

const obtenerMesesAdeudaMensualidad = (idAlumno) => {
    console.log("@obtenerMesesAdeudaMensualidad");

    console.log("ID alumno " + idAlumno);
    console.log("CARGOS.ID_CARGO_MENSUALIDAD " + CARGOS.ID_CARGO_MENSUALIDAD);

    return genericDao.findAll(QUERY_MESES_SIN_CARGO_MESUALIDAD, [idAlumno, CARGOS.ID_CARGO_MENSUALIDAD]);
    //getResultQuery(QUERY_MESES_SIN_CARGO_MESUALIDAD, [id_alumno, CARGOS.ID_CARGO_MENSUALIDAD], response);
};


const obtenerFiltroAniosCargosSucursal = (idSucursal) => {
    console.log("@obtenerFiltroAniosCargosSucursal");

    console.log("ID sucursal " + idSucursal);
    return genericDao
        .findAll(
            `
            SELECT to_char(c.fecha,'YYYY')::integer as anio
	        from co_cargo_balance_alumno c inner join co_alumno al on al.co_balance_alumno = al.co_balance_alumno
	        where al.co_sucursal = $1
		        and al.eliminado = false 
		        and c.eliminado = false
	        group by to_char(c.fecha,'YYYY')
	        order by to_char(c.fecha,'YYYY')::integer desc
	
                        `, [idSucursal]);

};


const QUERY_MESES_SIN_CARGO_MESUALIDAD = `
with  serie_meses as (
    SELECT g::date as fecha_mes,
           to_char(g::date,'mm')::int as numero_mes,	
           to_char(g::date,'YY')::int as numero_anio,		
           (select nombre from si_meses where id = to_char(g::date,'mm')::int) as nombre_mes         
       FROM  generate_series(
               date_trunc('year', getDate(''))::timestamp,
               (date_trunc('year', getDate(''))) + (interval '1 year') - (interval '1 day'),
             '1 month')  g
       ), meses_pagados AS (
       select 
            sm.fecha_mes as fecha_registrado,
           sm.nombre_mes,
           count(cb.*) as count_registro
       from serie_meses sm inner join co_cargo_balance_alumno cb on to_char(cb.fecha,'MMYYYY') = to_char(sm.fecha_mes,'MMYYYY')
       where cb.co_balance_alumno = (select co_balance_alumno from co_alumno where id = $1 and eliminado = false) 
           and cb.cat_cargo = $2
           and cb.eliminado = false
      group by  sm.nombre_mes,sm.fecha_mes
      order by sm.fecha_mes
    ) select (mp.count_registro is not null) as cargo_registrado,
                s.fecha_mes::text,
                s.nombre_mes,
                s.fecha_mes,
                s.numero_mes,
                s.numero_anio,
                mp.nombre_mes as nombre_mes_registro_cargo,								
                mp.nombre_mes as fecha_mes_registro_cargo,								
                mp.nombre_mes as numero_mes_registro_cargo,	
                mp.nombre_mes as numero_anio_registro_cargo
        from serie_meses s left join meses_pagados mp on mp.fecha_registrado = s.fecha_mes
`;

const obtenerEstadoCuenta = async(idAlumno) => {
    console.log("@obtenerEstadoCuenta");

    console.log("ID alumno " + idAlumno);

    const alumno = await genericDao.findOne(`
        SELECT al.nombre as nombre_alumno,
			al.apellidos as apellidos_alumno,
			to_char(al.fecha_limite_pago_mensualidad,'dd-Mon') as fecha_limite_pago_mensualidad,
			al.fecha_inscripcion,
			bal.total_adeudo,
			grupo.nombre as grupo,
			suc.nombre as sucursal,
            suc.id as co_sucursal,
			suc.direccion as direccion_sucursal,
			empresa.nombre as empresa,
            bal.total_adeudo > 0 as adeuda,
            to_char(getDate(''),'YYYY-MM-DD') as fecha,			
			to_char(getHora(''),'HH24:MI') as hora
         FROM co_alumno al inner join co_balance_alumno bal on al.co_balance_alumno = bal.id and bal.eliminado = false
		 					inner join co_sucursal suc on suc.id = al.co_sucursal
							inner join co_grupo grupo on  grupo.id = al.co_grupo							
							inner join co_empresa empresa on empresa.id = suc.co_empresa
         WHERE al.id = $1::int and al.eliminado = false`, [idAlumno]);

    const detalleMensualidadesPendientes = await obtenerDetalleEstadoCuenta(
        idAlumno
    );

    return {
        alumno: alumno,
        cargos: detalleMensualidadesPendientes || []
    };


};

const obtenerDetalleEstadoCuenta = async(idAlumno) => {

    return await genericDao.findAll(` SELECT a.co_balance_alumno,
               b.id as id_cargo_balance_alumno,
               b.fecha,
               to_char(b.fecha,'dd-mm-yyyy') as fecha_format,
               to_char(b.fecha,'HH24:MI') as hora_format,
               b.cantidad,
               cargo.nombre as nombre_cargo,
               cargo.aplica_descuento,
               b.texto_ayuda,
               cat_cargo as id_cargo,
               cargo.es_facturable,
               b.total as total,
               b.cargo,
               b.total_pagado,
               b.nota,
               b.pagado,
               (des.id is not null) as descuento_aplicado,
	           des.id as id_descuento,
               des.nombre as nombre_descuento,   
               b.descuento, 
               cargo.id <> ${CARGOS.ID_CARGO_MENSUALIDAD} as mostrar_nota
             FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                           inner join cat_cargo cargo on b.cat_cargo = cargo.id					
                                           left join cat_descuento_cargo des on des.id = b.cat_descuento_cargo
             WHERE a.id = $1                  
					and b.pagado = false
			 		and b.eliminado = false
					and a.eliminado = false
              ORDER by b.pagado,cargo.nombre asc, b.fecha desc`, [idAlumno]);
};

module.exports = {
    registrarCargo,
    getCatalogoCargos,
    getCargosAlumno,
    getBalanceAlumno,
    eliminarCargos,
    obtenerMesesAdeudaMensualidad,
    completarRegistroRecargoMensualidad,
    obtenerFiltroAniosCargosSucursal,
    obtenerEstadoCuenta
};