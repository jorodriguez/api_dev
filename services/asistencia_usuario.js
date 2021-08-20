
const handle = require('../helpers/handlersErrors');
const { TIPO_USUARIO, ID_EMPRESA_MAGIC } = require('../utils/Constantes');
const { getResultQuery, executeQuery } = require('./sqlHelper');

//const mensajeria = require('./mensajesFirebase');


//FIXME : agregar el parametro de fecha
const SQL_USUARIO_POR_SALIR =
    `
    select a.id,
	    tipo.id as id_tipo_usuario,
	    tipo.nombre as tipo_usuario,
	    tipo.prefijo,
	    u.id as id_usuario,
        u.alias,
	    u.nombre,
	    u.correo,	
	    suc.nombre as nombre_sucursal,	
	    u.permiso_gerente,
	    u.hora_entrada,
        u.hora_salida,
        date_trunc('minutes',a.hora_entrada::time)::text as hora_asistencia_entrada,
         date_trunc('minutes',a.hora_salida::time)::text as hora_asistencia_salida,
        u.minutos_gracia_entrada,
        u.foto
    from co_asistencia_usuario a inner join usuario u on u.id = a.usuario
				inner join cat_tipo_usuario tipo on tipo.id = u.cat_tipo_usuario
				inner join co_sucursal suc on suc.id = u.co_sucursal
    where u.co_sucursal = $1 
            and u.eliminado = false
            and fecha = getDate('')
    order by u.nombre asc
    `
    ;

const SQL_USUARIOS_POR_ENTRAR =
    `
    select 
        tipo.id as id_tipo_usuario,
        tipo.nombre as tipo_usuario,
        tipo.prefijo,
        u.id,
        u.alias,
        u.nombre,
        u.correo,
        u.password,
        suc.nombre as nombre_sucursal,
        u.token,
        u.permiso_gerente,
        u.hora_entrada,
        u.hora_salida,
        u.minutos_gracia_entrada	
        from usuario u inner join cat_tipo_usuario tipo on tipo.id = u.cat_tipo_usuario
        inner join co_sucursal suc on suc.id = u.co_sucursal
where u.co_sucursal = $1	
    and tipo.id = 1
    and u.id not in  (
        select usuario
		from co_asistencia_usuario a inner join usuario u on u.id = a.usuario 
		where u.co_sucursal = $2
			and a.fecha = getDate('') 
			and a.eliminado = false      
			and u.eliminado = false
    )	
and u.eliminado = false
order by u.nombre asc
    `
    ;


const getListaUsuarioPorEntrar = (request, response) => {
    console.log("@getListaUsuarioPorEntrar");
    try {

        console.log("Iniciando consulta de usuarios por entrar ");

        const id_sucursal = parseInt(request.params.id_sucursal);

        getResultQuery(SQL_USUARIOS_POR_ENTRAR, [id_sucursal, id_sucursal], response);
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getListaUsuarioPorSalir = (request, response) => {
    console.log("@getListaUsuarioPorSalir");
    try {

        const id_sucursal = parseInt(request.params.id_sucursal);

        getResultQuery(SQL_USUARIO_POR_SALIR, [id_sucursal], response);

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const registrarEntradaUsuario = (request, response) => {
    console.log("@registrarEntradaUsuario");
    try {

        const { id, comentario_entrada = '', genero } = request.body;
        console.log("Ids registrar entrada  " + id);

        executeQuery(`
                INSERT INTO CO_ASISTENCIA_USUARIO(fecha,hora_entrada,horario_entrada,usuario,comentario_entrada,genero)
                values(getDate('')
                        ,(getDate('')+getHora(''))
                        ,(SELECT (getDate('') + hora_entrada)::timestamp FROM USUARIO WHERE id = $1 )
                        ,$1,$2,$3) RETURNING hora_entrada;
                `,
            [id, comentario_entrada, genero],
            response,
            (results) => {
                console.log("Ejecucion del inser");
                let respuesta = null;

                if (results.rowCount > 0) {
                    respuesta = {
                        registrado: (results.rowCount > 0),
                        hora_entrada: (results.rowCount > 0) ? results.rows[0].hora_entrada : null
                    };
                }
                response.status(200).json(respuesta);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const registrarSalidaUsuario = (request, response) => {
    console.log("@registrarSalidaUsuario");

    try {

        const { id_asistencia, comentario_salida = '', genero } = request.body;

        executeQuery(`
            update CO_ASISTENCIA_USUARIO
                SET hora_salida = (getDate('')+getHora(''))::timestamp,
                    horario_salida = (SELECT (getDate('') + u.hora_salida)::timestamp FROM USUARIO u WHERE u.id = usuario ),
                    comentario_salida =$2,                    
                    fecha_modifico = (getDate('')+getHora(''))::timestamp,
                    modifico = $3            
            WHERE id = $1 
            RETURNING hora_salida;        
        `, [id_asistencia, comentario_salida, genero]
            , response
            , (results) => {
                let respuesta = null;

                if (results.rowCount > 0) {
                    respuesta = {
                        registrado: (results.rowCount > 0),
                        hora_salida: results.rows[0].hora_salida
                    };
                }
                response.status(200).json(respuesta);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


//Lista de faltas por rango de fecha y sucursal
//FIXME: el id de la empresa debe de enviarse por parametro
/*const getListaFaltasUsuariosSucursalRangoFecha = (request, response) => {
    console.log("@getListaFaltasUsuariosSucursalRangoFecha");

    const { id_sucursal, fecha_inicio, fecha_fin, id_empresa } = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha_inicio + " fecha fin " + fecha_fin);

    try {
        getResultQuery(` 
        with dias_activos_trabajados AS(		
            SELECT count(*) as dias_trabajo			  
            FROM  generate_series($3::date,$4::date,'1 day')  g
            WHERE g::date not in (select fecha 
                                    from cat_dias_asueto 
                                    where cat_empresa = $5 
                                        and fecha between $3::date  and $4::date
                                        and activo=true 
                                        and eliminado = false)
                  and to_char(g::date,'d')::int not in (1,7)
        ) select 
            u.id,
            u.nombre as usuario,
            u.hora_entrada::text,
            u.hora_salida::text,
            count(au.id) as count_dias_asistencia,
            d.dias_trabajo - count(au.id) as count_dias_faltas,
            d.dias_trabajo 
        from dias_activos_trabajados d, usuario u left join co_asistencia_usuario au on au.usuario = u.id 
                                                and au.fecha between $3::date  and $4::date
        where u.co_sucursal = $1 and u.cat_tipo_usuario = $2 and u.eliminado = false		  
            group by u.id,d.dias_trabajo
            order by u.nombre
     `, [id_sucursal, TIPO_USUARIO.MAESTRA, new Date(fecha_inicio), new Date(fecha_fin), (id_empresa || ID_EMPRESA_MAGIC)],            
            response
        );

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};*/
const getListaFaltasUsuariosSucursalRangoFecha = (request, response) => {
    console.log("@getListaFaltasUsuariosSucursalRangoFecha");

    const { id_sucursal, fecha_inicio, fecha_fin, id_empresa } = request.params;

    console.log("id_suc = " + id_sucursal);
    console.log("fecha = " + fecha_inicio + " fecha fin " + fecha_fin);

    try {
        getResultQuery(` 
        with dias_activos_trabajados AS(		
            SELECT count(*) as dias_laborables			  
            FROM  generate_series($3::date,$4::date,'1 day')  g
            WHERE g::date not in (select fecha 
                                    from cat_dias_asueto 
                                    where cat_empresa = $5 
                                        and fecha between $3::date  and $4::date
                                        and activo=true 
                                        and eliminado = false)
                  and to_char(g::date,'d')::int not in (1,7)
        ) select 
            u.id,            
            u.nombre as usuario,
            u.hora_entrada::text,
            u.hora_salida::text,
            (u.hora_salida-u.hora_entrada)::text as horas_trabajar_en_horario,
			(d.dias_laborables * (u.hora_salida-u.hora_entrada))::text as horas_trabajar_dias_laborales,
			coalesce(sum(age(au.hora_salida,au.hora_entrada)),'00:00')::text as horas_trabajadas_dias_laborales,
			coalesce(count(au.hora_entrada) filter (where au.hora_entrada is not null),0) as count_checo_entrada,
			coalesce(count(au.hora_salida) filter (where au.hora_salida is not null),0) as count_checo_salida,
            ROUND(u.sueldo_mensual,2) as sueldo_base_mensual,			
            ROUND(u.sueldo_quincenal,2) as sueldo_base_quincenal,
            ROUND((u.sueldo_quincenal/15),2) as sueldo_base_diario,	
		    ((d.dias_laborables - count(au.id)) * 100) / d.dias_laborables as porcentaje_falta,						
			ROUND(
                (
                    u.sueldo_quincenal - ((u.sueldo_quincenal/15) * (d.dias_laborables::numeric - count(au.id)::numeric))
                )
            ,2) as sueldo_quincenal_pago,		
            ROUND(
                (
                    (u.sueldo_quincenal/15) * (d.dias_laborables::numeric - count(au.id)::numeric)
                )
            ,2) as descuento_faltas,		
			count(au.id) as count_dias_asistencia,
            d.dias_laborables - count(au.id) as count_dias_faltas,
            d.dias_laborables
        from dias_activos_trabajados d, usuario u left join co_asistencia_usuario au on au.usuario = u.id 
                                                and au.fecha between $3::date  and $4::date
        where u.co_sucursal = $1 and u.cat_tipo_usuario = $2 and u.eliminado = false		  
            group by u.id,d.dias_laborables
            order by u.nombre
     `, [id_sucursal, TIPO_USUARIO.MAESTRA, new Date(fecha_inicio),new Date(fecha_fin), (id_empresa || ID_EMPRESA_MAGIC)],
            response
        );

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getDetalleFaltasUsuariosRangoFecha = (request, response) => {
    console.log("@getDetalleFaltasUsuariosRangoFecha");

    const { id_usuario, fecha_inicio, fecha_fin } = request.params;

    console.log("id_usuario = " + id_usuario);
    console.log("fecha = " + fecha_inicio + " fecha fin " + fecha_fin);

    try {

        getResultQuery(` 
        with asistencia_usuario as(
			select au.*
			from co_asistencia_usuario au 
			where  au.fecha between $2::date  and $3::date 				
					and au.usuario = $1
					and au.eliminado = false
        ) SELECT 
                    (g::date)::text as fecha_rango,
                    dias_asuetos.fecha is not null as dia_asueto,
                    au.id is null as falta,
                    (date_trunc('minute',au.hora_entrada)::time)::text as hora_entrada,
                    (date_trunc('minute',au.hora_salida)::time)::text as hora_salida,
                    au.comentario_entrada,
                    au.comentario_salida
		FROM  generate_series($2::date,$3::date,'1 day')  g left join asistencia_usuario au on au.fecha = g::date																				
							left join (select fecha 
										from cat_dias_asueto 
										where cat_empresa =  $4
												and fecha between $2::date  and $3::date
												and activo=true 
											and eliminado = false)	
											dias_asuetos on dias_asuetos.fecha = g::date
		WHERE to_char(g::date,'d')::int not in (1,7)
     `, [id_usuario, new Date(fecha_inicio), new Date(fecha_fin), ID_EMPRESA_MAGIC],
            response);

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const getAniosFiltroAsistenciasUsuarios = (request, response) => {
    console.log("@getAniosFiltroAsistenciasUsuarios");

    const { co_empresa } = request.params;
    
    console.log("co_empresa = "+co_empresa);

    try {

        getResultQuery(` 
        select generate_series as numero_anio
        from generate_series(
             (select extract(year from (min(fecha)))::int 
             from co_asistencia_usuario a inner join usuario u on u.id = a.usuario 
             where u.co_empresa = $1 and  a.eliminado=false),
             (select extract(year from (getDate(''))))::int
             )                        
        order by generate_series desc		
     `, [co_empresa],  response);

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getMesesFiltroAsistenciasUsuarios = (request, response) => {
    console.log("@getMesesFiltroAsistenciasUsuarios");

    const { anio,co_empresa } = request.params;

    console.log("anio = " + anio);
    console.log("co_empresa = "+co_empresa);

    try {

        getResultQuery(` 
        with universo AS(
            select generate_series(
                (
                    select min(fecha) 
                    from co_asistencia_usuario a inner join usuario u on u.id = a.usuario 
                    where u.co_empresa = $2 
                        and to_char(a.fecha,'yyyy')::int = $1::int and  a.eliminado=false
                ),
                (select ((date_trunc('month',getDate(''))) + interval '1 month') - interval '1 day')
               ,'1 month'
          ) as fecha
         ) select 
             (select date_trunc('month',u.fecha))::date as primer_dia_mes, 
             (select (date_trunc('month',u.fecha)) + interval '14 day')::date  as quinceavo_dia_mes, 
             (select (date_trunc('month',u.fecha)) + interval '15 day')::date  as dieciseisavo_dia_mes, 
             (select ((date_trunc('month',u.fecha)) + interval '1 month') - interval '1 day')::date as ultimo_dia_mes, 
             extract(day from (date_trunc('month',u.fecha))) as numero_primer_dia_mes, 
             extract(day from ((date_trunc('month',u.fecha)) + interval '14 day'))  as numero_quinceavo_dia_mes, 
             extract(day from ((date_trunc('month',u.fecha)) + interval '15 day'))  as numero_dieciseisavo_dia_mes, 
             extract(day from (((date_trunc('month',u.fecha)) + interval '1 month') - interval '1 day')) as numero_ultimo_dia_mes, 
              extract(month from u.fecha) as numero_mes,
              extract(year from u.fecha) as numero_anio,
              to_char(u.fecha,'MMYYYY') as mes_anio,
              to_char(u.fecha,'Mon') as nombre_mes
      from universo u 
    order by u.fecha::date desc
     `, [anio, co_empresa],
            response);

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

module.exports = {
    getListaUsuarioPorEntrar,
    getListaUsuarioPorSalir,
    registrarEntradaUsuario,
    registrarSalidaUsuario,
    getListaFaltasUsuariosSucursalRangoFecha,
    getDetalleFaltasUsuariosRangoFecha,
    getAniosFiltroAsistenciasUsuarios,
    getMesesFiltroAsistenciasUsuarios

};
