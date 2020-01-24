const { USUARIO_DEFAULT, ENTRADA, SALIDA, MENSAJE_ALGO_FALLO } = require('../utils/Constantes');
const mensajeria = require('../services/mensajesFirebase');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull, existeValorArray } = require('../utils/Utils');
const genericDao = require('./genericDao');


//FIXME : agregar el parametro de fecha
const SQL_ALUMNOS_RECIBIDOS =
    `SELECT asistencia.id,
            asistencia.fecha,
            asistencia.hora_entrada,
            asistencia.hora_salida,
            alumno.id as id_alumno,
            alumno.nombre as nombre_alumno,
            alumno.apellidos as apellido_alumno,
            grupo.id as co_grupo,
            grupo.nombre as nombre_grupo,
            true as visible,
            false as seleccionado,            
            (getDate('')+getHora(''))::timestamp > (asistencia.fecha+alumno.hora_salida)::timestamp as calcular_tiempo_extra,
			age((getDate('')+getHora(''))::timestamp,(asistencia.fecha+alumno.hora_salida)::timestamp) as tiempo_extra   
            FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id 
                              inner join co_grupo grupo on alumno.co_grupo = grupo.id         
        WHERE asistencia.hora_salida is null AND alumno.eliminado=false 
           AND alumno.co_sucursal = $1
        ORDER BY alumno.nombre ASC`
    ;

const SQL_ALUMNOS_RECIBIDOS_HORAS_EXTRAS =
    `SELECT 
        asistencia.id,
        asistencia.fecha,
        asistencia.hora_entrada,    
        asistencia.hora_salida,
        alumno.id as id_alumno,
        alumno.nombre as nombre_alumno,
        alumno.hora_salida as hora_salida_alumno,  
        false as seleccionado,   
        (getDate('')+getHora(''))::timestamp > (asistencia.fecha+alumno.hora_salida)::timestamp as calcular_tiempo_extra,
        age((getDate('')+getHora(''))::timestamp,(asistencia.fecha+alumno.hora_salida)::timestamp) as tiempo_extra
    FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno = alumno.id                               
    WHERE asistencia.id = ANY($1::int[])
        and (getDate('')+getHora(''))::timestamp > (asistencia.fecha+alumno.hora_salida)::timestamp 
        AND alumno.eliminado=false            
    ORDER BY alumno.nombre ASC`
    ;

const getAlumnosRecibidos = (idSucursal) => {
    console.log("@getAlumnosRecibidos");
    console.log("Iniciando consulta de alumno de la suc "+idSucursal);
    return genericDao.findAll(SQL_ALUMNOS_RECIBIDOS, [idSucursal]);
};

const getAlumnosPorRecibir = (idSucursal) => {
    console.log("@getAlumnosPorRecibir");

    return genericDao.findAll(
        `SELECT 
                grupo.nombre as nombre_grupo,
                false as visible,
                a.*
        FROM co_alumno a INNER JOIN co_grupo grupo ON a.co_grupo = grupo.id		
        WHERE a.id not in (
                       SELECT asistencia.co_alumno
                           FROM co_asistencia asistencia inner join co_alumno alumno on asistencia.co_alumno=alumno.id            
                        WHERE asistencia.hora_salida is null and  asistencia.eliminado = false 
        AND alumno.co_sucursal = $1
        AND asistencia.eliminado=false
        ) 
        AND a.co_sucursal = $2
        AND a.eliminado = false 
        ORDER BY a.nombre ASC
        `, [idSucursal, idSucursal]);
};


const registrarEntradaAlumnos = (params) => {
    console.log("@registrarEntrada");

    return new Promise((resolve, reject) => {
        console.log("params "+JSON.stringify(params));
        const { ids, genero } = params;
        console.log("IDS "+JSON.stringify(ids));
        var idsAlumnos = '';
        var first = true;

        ids.forEach(element => {
            if (first) {
                idsAlumnos += (element + "");
                first = false;
            } else {
                idsAlumnos += (',' + element);
            }
        });

        console.log("Ids registrar entrada  " + idsAlumnos);

        return genericDao
            .executeProcedure(`SELECT registrar_entrada_alumno('${idsAlumnos}',${genero});`)
            .then(results => {
                if (results.rowCount > 0) {
                    //Enviar mensaje de recepcion
                    console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                    var listaIdsAsistencias = results.rows.map(e => e.registrar_entrada_alumno);
                    enviarMensajeEntradaSalida(listaIdsAsistencias, ENTRADA);
                    resolve(listaIdsAsistencias);
                } else {
                    reject(new ExceptionDB(MENSAJE_ALGO_FALLO));
                }
            })
            .catch(error => {
                reject(new ExceptionBD(error));
            })
        /*
                pool.query("select registrar_entrada_alumno('" + idsAlumnos + "'," + genero + ");",
                    (error, results) => {
                        if (error) {
                            handle.callbackError(error, response);
                            return;
                        }
        
                        if (results.rowCount > 0) {
                            //Enviar mensaje de recepcion
                            console.log("Resultado del procedimiento " + JSON.stringify(results.rows));
                            var listaIdsAsistencias = results.rows.map(e => e.registrar_entrada_alumno);
                            enviarMensajeEntradaSalida(listaIdsAsistencias, ENTRADA);
                        }
        
                        response.status(200).json(results.rowCount);
                    });*/
    });
};

function enviarMensajeEntradaSalida(ids_asistencias, operacion) {
    console.log(" ids asis  " + ids_asistencias + " operacion " + operacion);
    try {
        if (ids_asistencias == undefined || ids_asistencias == null) {
            console.log("La lista de ids de asistencia es null");
            return;
        }
        console.log("iniciando el proceso de envio de mensajeria ");
        genericDao.findAll(`
            WITH correos as (
            SELECT  	
                    a.id as id_alumno,
                    a.nombre as nombre_alumno,		 
                    string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                    array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                    array_to_json(array_agg(to_json(coalesce(fam.token,'') ))) as tokens
            FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                                inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                                inner join co_alumno a on a.id = rel.co_alumno
            WHERE a.id IN (select co_alumno from co_asistencia where id = ANY($1::int[])) --PARAMETRO
                 --and envio_recibos -- id_alumnos
                and co_parentesco in (1,2) -- solo papa y mama
                and fam.eliminado = false 
                and rel.eliminado = false
            group by a.nombre,a.id
            )select 
                al.nombre,
                to_char(a.fecha,'DD-MM-YYYY')       AS fecha,	
                extract(dow from a.fecha)::integer  AS num_dia,
                to_char(a.fecha,'MM')::integer      AS num_mes,		
                to_char(a.fecha,'YY')               AS anio_label,            
                date_trunc('minute',a.hora_entrada)::time  AS hora_entrada,
                date_trunc('minute',a.hora_salida)::time  AS hora_salida,
                c.correos,
                c.nombres_padres,
                c.tokens,
                (select count(*) as recargos_tiempo_extra
                     from co_cargo_balance_alumno 
                    where fecha = a.fecha and co_balance_alumno = (select id from co_alumno where co_balance_alumno = al.id ) 
                        and cat_cargo = 3 --tiempo extra
                      and eliminado = false)
            from co_asistencia a inner join co_alumno al on a.co_alumno = al.id
                                left join correos c on c.id_alumno = al.id
            where a.id = ANY($2::int[])	 -- IDS DE ASISTENCIAS	 
              AND a.eliminado = false
              AND al.eliminado = false`,
            [ids_asistencias, ids_asistencias])
            .then(results => {
                console.log("result " + JSON.stringify(results));
                if (existeValorArray(results)) {
                    let asistencias = results;
                    asistencias.forEach(e => {
                        let titulo_mensaje = (operacion == ENTRADA ? "Entrada de " + e.nombre : "Salida de " + e.nombre);
                        let mensaje_entrada = `Hola ${e.nombres_padres} recibimos a ${e.nombre} a las ${e.hora_entrada}.`;
                        let mensaje_salida = `Hola ${e.nombres_padres} entregamos a ${e.nombre} a las ${e.hora_salida}.
                        ${e.recargos_tiempo_extra > 0 ? ' se registraron ' + e.recargos_tiempo_extra + ' recargos por tiempo extra.' : ''}`;
                        let cuerpo_mensaje = (operacion == ENTRADA ? mensaje_entrada : mensaje_salida);

                        //token,titulo,cuerpo
                        mensajeria.enviarMensajeToken(e.tokens, titulo_mensaje, cuerpo_mensaje);
                        //Enviar correo
                    });
                }
            }).catch(error => {
                console.log("Excepcion al enviar los mensajes de entrada o salida de alumno " + error);
            });

    } catch (e) {
        console.log("Excepcion al enviar los mensajes de entrada o salida de alumno " + e);

    }
}


const registrarSalidaAlumnos = (params) => {
    console.log("@registrarSalidaAlumnos");

    return new Promise((resolve, reject) => {

        console.log(" Params  " + JSON.stringify(params));
        const { listaSalida = [], listaCalcularHorasExtras = [], genero } = params;

        console.log("arrayIdSalidas " + JSON.stringify(listaSalida));
        console.log("arrayIdSalidasCalcularHoraExtras " + JSON.stringify(listaCalcularHorasExtras));

        procesoSalidaAlumnos(listaSalida, listaCalcularHorasExtras, genero)
            .then(results => {
                console.log("Resultado " + JSON.stringify(results));
                if (results.rowCount > 0) {
                    enviarMensajeEntradaSalida(listaSalida, SALIDA);
                    resolve(results.rowCount);
                } else {
                    reject(new ExceptionBD(MENSAJE_ALGO_FALLO));
                }
                //response.status(200).json(results.rowCount);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });

    });
};

const procesoSalidaAlumnos = (idSalidas, arrayIdSalidasCalcularHoraExtras = [], genero) => {
    console.log("IDS de asistencia recibidos " + idSalidas);
    var idsAsistencias = '';
    var idsAsistenciasCalculoHorasExtras = '';
    var first = true;

    idSalidas.forEach(element => {
        if (first) {
            idsAsistencias += (element + "");
            first = false;
        } else {
            idsAsistencias += (',' + element);
        }
    });

    first = true;

    arrayIdSalidasCalcularHoraExtras.forEach(element => {
        if (first) {
            idsAsistenciasCalculoHorasExtras += (element + "");
            first = false;
        } else {
            idsAsistenciasCalculoHorasExtras += (',' + element);
        }

    });

    console.log(" === > asistencias " + idsAsistencias);
    console.log(" === > asistencias para generar horas extras " + idsAsistenciasCalculoHorasExtras);
    //return pool.query(`SELECT registrar_salida_alumno('${idsAsistencias}','${idsAsistenciasCalculoHorasExtras}',${genero});`);
    return genericDao.executeProcedure(`SELECT registrar_salida_alumno('${idsAsistencias}','${idsAsistenciasCalculoHorasExtras}',${genero});`);
}



//lista simple
const getListaAsistenciaPorSucursalFecha = (idSucursal, fecha) => {
    console.log("@getListaAsistenciaPorSucursalFecha");
    //const { id_sucursal, fecha } = request.params;
    console.log("id_suc = " + idSucursal);
    console.log("fecha = " + fecha);

    return genericDao.findAll(`
            SELECT
                   a.id as id,
                    to_char(a.fecha,'DD-MM-YYYY')       AS fecha,
                    extract(dow from a.fecha)::integer  AS num_dia,
                    to_char(a.fecha,'MM')::integer      AS num_mes,		
                    to_char(a.fecha,'YY')               AS num_anio,
                    al.foto,
                    date_trunc('minute',a.hora_entrada)::time  AS hora_entrada,
                    date_trunc('minute',a.hora_salida)::time    AS hora_salida,
                    al.id                               as id_alumno,
                    al.nombre                           as nombre_alumno,
                    al.apellidos                        as apellido_alumno,
                    grupo.id                            as id_grupo,
                    grupo.nombre                        as nombre_grupo,
                    u.nombre usuario_registro,
                    date_trunc('minute',al.hora_entrada)::time  as hora_entra,
                    date_trunc('minute',al.hora_salida)::time   as hora_sale,
                    CASE 
                    WHEN a.hora_salida  is not null THEN 
                        date_trunc('minute',age(a.fecha::date + a.hora_salida::time,a.fecha::date + a.hora_entrada::time))::text
                    ELSE
                         date_trunc('minute',age((getDate('')+getHora(''))::timestamp,a.fecha::date + a.hora_entrada::time))::text
                    END  as tiempo_dentro,
                            age((a.fecha+al.hora_salida)::timestamp,coalesce(a.fecha::date + a.hora_salida::time,(getDate('')+getHora(''))::timestamp)) < '00:00:00' as alerta_tiempo,
                    date_trunc('minutes',
                            age((a.fecha+al.hora_salida)::timestamp,coalesce(a.fecha::date + a.hora_salida::time,(getDate('')+getHora(''))::timestamp))
                            )::text as tiempo

            FROM 
                co_asistencia a left join co_alumno al on al.id = a.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join usuario u on u.id = a.usuario
            WHERE
                al.co_sucursal = $1 
                and a.fecha = $2::date
                and a.eliminado = false
            ORDER BY  grupo.nombre,al.nombre asc
            `, [id_sucursal, new Date(fecha)]);
}


//lista simple
const getListaAsistenciaMesPorAlumno = (idAlumno) => {
    console.log("@getListaAsistenciaPorAlumno");

    //    const { id_alumno } = request.params;
    console.log("id_alumno = " + idAlumno);

    return genericDao.findAll(`                   
        with fechas as (
            select (date_trunc('month',  getDate('')))::timestamp AS primer_dia,
                (date_trunc('month',  getDate('')) + interval '1 month' - interval '1 day')  as ultimo_dia		   	   
        ),serie as (
            SELECT g::date as fecha			  
            FROM fechas f, generate_series(f.primer_dia,f.ultimo_dia,'1 day')  g
        )
        select 	
            s.fecha,
            to_char(s.fecha,'DD')::int as num_dia,
            to_char(s.fecha,'MM') as num_mes,
            to_char(s.fecha,'YYYY') as num_anio,
            to_char(s.fecha,'Day') as nombre_dia,    
            count(a.*) > 0 as asistencia,
            to_char(s.fecha,'d')::int in (1,7) as es_fin_semana, 
            count(a.*) as numero_asistencia,
            date_trunc('seconds',a.hora_entrada::time) as hora_entrada,
            date_trunc('seconds',a.hora_salida::time) as hora_salida,
            (select count(*) from co_cargo_balance_alumno where fecha = s.fecha) as cargos_extras
        from serie s left join co_asistencia a on s.fecha = a.fecha
            and a.co_alumno = $1
            group by s.fecha,a.hora_entrada,a.hora_salida
            order by s.fecha 
            `, [id_alumno]);

}

// para componente de calendrio
const getListaMesAsistenciaPorAlumno = (idAlumno) => {
    console.log("@getListaMeAsistenciaPorAlumno");
    //const { idAlumno } = request.params;
    console.log("id_alumno = " + idAlumno);
    //console.log("numero_mes = " + numero_mes);

    return genericDao.findAll(`                
        with fechas as (
            select (date_trunc('week', date_trunc('month', getDate(''))) - interval '1 day')::timestamp AS primer_domingo,
                (date_trunc('month',  getDate('')) + interval '1 month' - interval '1 day') as ultimo_dia_mes		   	   
        ),serie as (
            SELECT g::date as fecha			  
            FROM fechas f, generate_series(f.primer_domingo,f.ultimo_dia_mes,'1 day')  g
        )
        select 	
                to_char(s.fecha,'DD')::int as num_dia,
                to_char(s.fecha,'DDD')::int as num_dia_anio,
                to_char(s.fecha,'d') as num_dia_semana,
                to_char(s.fecha,'Day') as nombre_dia,
                extract(week from s.fecha) as num_semana,	
                to_char(s.fecha,'MM') as num_mes,
                count(a.*) > 0 as asistencia,
                to_char(s.fecha,'d')::int in (1,7) as es_fin_semana, 
                count(a.*),
                s.fecha > getDate('') as fecha_mayor_hoy,
                date_trunc('seconds',a.hora_entrada::time) as hora_entrada,
                date_trunc('seconds',a.hora_salida::time) as hora_salida,
                (select count(*) from co_cargo_balance_alumno where fecha = s.fecha) as cargos_extras
        from serie s left join co_asistencia a on s.fecha = a.fecha
                and a.co_alumno = $1
                group by s.fecha,a.hora_entrada,a.hora_salida
                order by s.fecha
            `, [id_alumno]);
}


const ejecutarProcesoSalidaAutomatica = () => {
    try {

        genericDao.findAll(`
                    SELECT id as ids 
                    FROM co_asistencia a 
                    WHERE a.hora_salida is null AND a.fecha = getDate('') 
                        and a.eliminado = false`, [])
            .then(results => {
                console.log(JSON.stringify(results));
                if (existeValorArray(results)) {
                    let ids = results[0].ids;
                    if (ids != null) {
                        console.log("ids " + ids);
                        procesoSalidaAlumnos(ids, [], USUARIO_DEFAULT)
                            .then(results => {
                                console.log("Resultado " + JSON.stringify(results));
                                if (results.rowCount > 0) {
                                    enviarMensajeEntradaSalida(ids, SALIDA);
                                }
                            }).catch((e) => {
                                console.log("Excepcion al sacar alumnos automaticamente " + e);
                            });
                    } else { console.log("no existieron alumnos para salida automatica "); }
                }
            }).catch(error => {
                console.log("EXCEPCION AL EJECUTAR EL PROCESO AUTOMATICO DE SALIDA " + error);
            });

    } catch (e) {
        console.log("@excepcion " + e);
    }
}


const getListaAsistenciaAlumnoPorSalirConHorasExtras = (params) => {
    console.log("@getListaAsistenciaAlumnoPorSalirConHorasExtras");

    const { lista_id_asistencias = [] } = params;

    let array = [];
    if (lista_id_asistencias != undefined && lista_id_asistencias != []) {
        array = lista_id_asistencias.split(',').map(function (item) {
            return parseInt(item, 10);
        });
    }
    return genericDao.findAll(SQL_ALUMNOS_RECIBIDOS_HORAS_EXTRAS, [array]);
}

//Esta desabilitado
const ejecutarProcedimientoCalculoHorasExtra = (ids_alumnos, id_genero) => {
    console.log("@ejecutarProcedimeintoCalculoHorasExtra");

    console.log("IDS recibidos " + ids_alumnos);

    genericDao.execute(`SELECT generar_horas_extras_alumno('${ids_alumnos}',${id_genero} );`)
        .then(results => {
            console.log("Se ejecuto el procedimiento de horas extras " + JSON.stringify(results));
        }).catch(error => {
            console.log("Error al ejecutar el procedimiento calculo extra " + error);
        })

    /*        pool.query("SELECT generar_horas_extras_alumno('" + ids_alumnos + "'," + id_genero + ");",
                (error, results) => {
                    if (error) {
                        console.log("Error al ejecutar el procedimiento calculo extra " + error);
                        return;
                    }
                    console.log("Se ejecuto el procedimiento de horas extras " + JSON.stringify(results));
                });
      */
};


/* Lista de asistencias e inasistencias por alumno por mes  */
const getListaMesAsistenciaPorSucursal = (idSucursal) => {
    console.log("@getListaMesAsistenciaPorSucursal");

    console.log("id_sucursal = " + idSucursal);

    return genericDao.findAll(`                
        with serie as (
            SELECT g::date as fecha	  
            FROM generate_series((date_trunc('month', getDate('')))::timestamp,getDate(''),'1 day')  g
            where to_char(g::date ,'d')::int not in (1,7) 
                    -- and to_char(g::date ,'d')::int not in (select id from si_dias_asuetos where eliminado = false)
        ), dias_activos as ( 
                    select count(*) as num_dias_trabajados 
                    from serie  
        ) 
        , alumno_asistencia as(
        select 
            s.fecha ,
            alumno.id as id_alumno,	
            count(a.*) as asistencias,
            count(s.fecha) as count_fechas
        from serie s left join co_asistencia a on s.fecha = a.fecha
           left join co_alumno alumno on alumno.id = a.co_alumno
            and alumno.co_sucursal= $1
            and alumno.eliminado= false
            and a.eliminado = false
        group by alumno.id,s.fecha
        order by s.fecha,alumno.id
        )select 
            a.id,
            a.nombre,
            a.apellidos,
            a.foto,
            grupo.id as id_grupo,
            grupo.nombre as nombre_grupo,
            count(asi.count_fechas) as count_fechas,		
            count(asi.asistencias) as numero_asistencias,		
            (dias_Activos.num_dias_trabajados - count(asi.count_fechas)) as numero_inasistencias,
            dias_Activos.num_dias_trabajados
        from dias_activos,
                co_alumno a left join alumno_asistencia asi on asi.id_alumno = a.id
                        left join co_grupo grupo on a.co_grupo = grupo.id
        where a.eliminado = false
            and a.co_sucursal = $2
        group by a.id,grupo.id,dias_activos.num_dias_trabajados
        order by a.nombre `, [id_sucursal, id_sucursal]);
}


module.exports = {
    getAlumnosRecibidos,
    getAlumnosPorRecibir,
    registrarEntradaAlumnos,
    registrarSalidaAlumnos,
    getListaAsistenciaPorSucursalFecha,
    ejecutarProcesoSalidaAutomatica,
    getListaAsistenciaMesPorAlumno,
    getListaMesAsistenciaPorAlumno,
    getListaAsistenciaAlumnoPorSalirConHorasExtras,
    getListaMesAsistenciaPorSucursal
}
