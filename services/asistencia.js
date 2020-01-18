
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const { USUARIO_DEFAULT, ENTRADA, SALIDA } = require('../utils/Constantes');
const mensajeria = require('./mensajesFirebase');



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
/*
const getAlumnosRecibidos = (request, response) => {
    const id_sucursal = parseInt(request.params.id_sucursal);
    let sqlHelper = new SqlHelper(SQL_ALUMNOS_RECIBIDOS, [id_sucursal]);
    let result = sqlHelper.ejecutar() || [];    
    response.status(200).json(result);
};*/


const getAlumnosRecibidos = (request, response) => {
    console.log("@getAlumnosRecibidos");
    try {

        console.log("Iniciando consulta de alumno ");

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query(SQL_ALUMNOS_RECIBIDOS, [id_sucursal],
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

const getAlumnosPorRecibir = (request, response) => {
    console.log("@getAlumnosPorRecibir");
    try {
        // validarToken(request,response);

        const id_sucursal = parseInt(request.params.id_sucursal);

        pool.query(
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
            `,
            [id_sucursal, id_sucursal],
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


const registrarEntradaAlumnos = (request, response) => {
    console.log("@registrarEntrada");
    try {
        // validarToken(request,response);

        const { ids, genero } = request.body;

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
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};

function enviarMensajeEntradaSalida(ids_asistencias, operacion) {
    console.log(" ids asis  " + ids_asistencias + " operacion " + operacion);
    try {
        if (ids_asistencias == undefined || ids_asistencias == null) {
            console.log("La lista de ids de asistencia es null");
            return;
        }
        console.log("iniciando el proceso de envio de mensajeria ");
        pool.query(`with correos as (
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
            [ids_asistencias, ids_asistencias],
            (error, results) => {
                if (error) {
                    console.log("Excepcion en el query al enviar los mensajes " + error);
                    return;
                }
                console.log("result " + JSON.stringify(results));
                if (results.rowCount > 0) {
                    let asistencias = results.rows;
                    asistencias.forEach(e => {
                        let titulo_mensaje = (operacion == ENTRADA ? "Entrada de " + e.nombre : "Salida de " + e.nombre);
                        let mensaje_entrada = `Hola ${e.nombres_padres} recibimos a ${e.nombre} a las ${e.hora_entrada}.`;
                        let mensaje_salida = `Hola ${e.nombres_padres} entregamos a ${e.nombre} a las ${e.hora_salida}.
                        ${e.recargos_tiempo_extra > 0 ?' se registraron '+e.recargos_tiempo_extra+' recargos por tiempo extra.':''}`;
                        let cuerpo_mensaje = (operacion == ENTRADA ? mensaje_entrada : mensaje_salida);

                        //token,titulo,cuerpo
                        mensajeria.enviarMensajeToken(e.tokens, titulo_mensaje, cuerpo_mensaje);
                        //Enviar correo
                    });
                }
            });

    } catch (e) {
        //handle.callbackErrorNoControlado(e, response);
        console.log("Excepcion no controlada");

    }
}


const registrarSalidaAlumnos = (request, response) => {
    console.log("@registrarSalidaAlumnos");

    try {
        console.log(" = " + JSON.stringify(request.body));
        const { listaSalida = [], listaCalcularHorasExtras = [], genero } = request.body;

        console.log("PAsa 1" + JSON.stringify(request.body));

        console.log("arrayIdSalidas " + JSON.stringify(listaSalida));
        console.log("arrayIdSalidasCalcularHoraExtras " + JSON.stringify(listaCalcularHorasExtras));

        procesoSalidaAlumnos(listaSalida, listaCalcularHorasExtras, genero)
            .then((results) => {
                console.log("Resultado " + JSON.stringify(results));
                if (results.rowCount > 0) {
                    enviarMensajeEntradaSalida(listaSalida, SALIDA);
                }
                response.status(200).json(results.rowCount);
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });


        /*     console.log("IDS de asistencia recibidos " + ids);
             // obtener para el proceso de horas extras
             var idsAsistencias = '';
             var first = true;
     
             ids.forEach(element => {
                 if (first) {
                     idsAsistencias += (element + "");
                     first = false;
                 } else {
                     idsAsistencias += (',' + element);
                 }
             });
     
             console.log(" === > " + idsAsistencias);
     
             pool.query("SELECT registrar_salida_alumno('" + idsAsistencias + "'," + genero + ");")
                 .then((results) => {
                     console.log("Resultado " + JSON.stringify(results));
                     if (results.rowCount > 0) {
                         enviarMensajeEntradaSalida(ids, SALIDA);
                     }
                     response.status(200).json(results.rowCount);
                 }).catch((e) => {
                     handle.callbackErrorNoControlado(e, response);
                 });
     */
        // Jala 
        /*pool.query("UPDATE CO_ASISTENCIA " +
            " SET hora_salida = (getDate('')+getHora(''))::timestamp," +
            "  modifico = $1 " +
            " WHERE id IN " + sqlComplete,
            [genero])
            .then((results) => {
                console.log("Resultafdo "+JSON.stringify(results));

                if (results.rowCount > 0) {

                    ejecutarProcedimientoCalculoHorasExtra(idsForHorasExtras, genero);
                }

                response.status(200).json(results.rowCount);
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });*/
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
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
    return pool.query(`SELECT registrar_salida_alumno('${idsAsistencias}','${idsAsistenciasCalculoHorasExtras}',${genero});`);

}



//lista simple
const getListaAsistenciaPorSucursalFecha = (request, response) => {
    console.log("@getListaAsistenciaPorSucursalFecha");

    const { id_sucursal, fecha } = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha);
    try {
        pool.query(`
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

            `, [id_sucursal, new Date(fecha)]).then((results) => {
            console.log("resultado lista de asistencia");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


//lista simple
const getListaAsistenciaMesPorAlumno = (request, response) => {
    console.log("@getListaAsistenciaPorAlumno");

    const { id_alumno } = request.params;

    console.log("id_alumno = " + id_alumno);
    //console.log("numero_mes = " + numero_mes);
    try {
        pool.query(`                   
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

            `, [id_alumno]).then((results) => {
            console.log("resultado lista de asistencia");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

// para componente de calendrio
const getListaMesAsistenciaPorAlumno = (request, response) => {
    console.log("@getListaMeAsistenciaPorAlumno");

    const { id_alumno } = request.params;

    console.log("id_alumno = " + id_alumno);
    //console.log("numero_mes = " + numero_mes);
    try {
        pool.query(`
                  
       
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




            `, [id_alumno]).then((results) => {
            console.log("resultado lista de asistencia");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

const ejecutarProcesoSalidaAutomatica = () => {
    try {

        pool.query(`SELECT id as ids 
                    FROM co_asistencia a 
                    WHERE a.hora_salida is null AND a.fecha = getDate('') and a.eliminado = false`,
            (error, results) => {
                if (error) {
                    console.log("Error en el proceso de salida automatica de alumnos");
                    return;
                }

                console.log(JSON.stringify(results));
                if (results.rowCount > 0) {
                    let ids = results.rows[0].ids;

                    if (ids != null) {
                        console.log("ids " + ids);
                        procesoSalidaAlumnos(ids, [], USUARIO_DEFAULT)
                            .then((results) => {
                                console.log("Resultado " + JSON.stringify(results));
                                if (results.rowCount > 0) {
                                    enviarMensajeEntradaSalida(ids, SALIDA);
                                }
                            }).catch((e) => {
                                console.log("Excepcion al sacar alumnos automaticamente " + e);
                            });
                    } else { console.log("no existieron alumnos para salida automatica "); }
                }
            });


    } catch (e) {
        console.log("@excepcion " + e);
    }
}


const getListaAsistenciaAlumnoPorSalirConHorasExtras = (request, response) => {
    console.log("@getListaAsistenciaAlumnoPorSalirConHorasExtras");

    const { lista_id_asistencias = [] } = request.params;
    let array = [];
    if (lista_id_asistencias != undefined && lista_id_asistencias != []) {

        array = lista_id_asistencias.split(',').map(function (item) {
            return parseInt(item, 10);
        });
    }

    try {
        pool.query(SQL_ALUMNOS_RECIBIDOS_HORAS_EXTRAS, [array])
            .then((results) => {
                console.log("resultado lista de asistencia");
                console.log("===> " + JSON.stringify(results.rows));
                response.status(200).json(results.rows);
            }).catch((error) => {
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


const ejecutarProcedimientoCalculoHorasExtra = (ids_alumnos, id_genero) => {
    console.log("@ejecutarProcedimeintoCalculoHorasExtra");

    try {

        console.log("IDS recibidos " + ids_alumnos);

        pool.query("SELECT generar_horas_extras_alumno('" + ids_alumnos + "'," + id_genero + ");",
            (error, results) => {
                if (error) {
                    console.log("Error al ejecutar el procedimiento calculo extra " + error);
                    return;
                }
                console.log("Se ejecuto el procedimiento de horas extras " + JSON.stringify(results));
            });
    } catch (e) {
        console.log("Error al ejecutar el procedimiento calculo extra " + e);
    }
};


/* Lista de asistencias e inasistencias por alumno por mes  */
const getListaMesAsistenciaPorSucursal = (request, response) => {
    console.log("@getListaMesAsistenciaPorSucursal");

    const { id_sucursal } = request.params;

    console.log("id_sucursal = " + id_sucursal);
    //console.log("numero_mes = " + numero_mes);
    try {
        pool.query(`
                
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
order by a.nombre


            `, [id_sucursal, id_sucursal]).then((results) => {
            console.log("resultado lista de asistencia");
            response.status(200).json(results.rows);
        }).catch((error) => {
            handle.callbackError(error, response);
        });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
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
