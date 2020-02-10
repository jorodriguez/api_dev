
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
/*
const getReporteBalanceAlumnosSucursal = (request, response) => {
    console.log("@getReportePrincipal");
    try {
       // validarToken(request,response);        

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            "  select a.id," +
            "   a.foto," +
            "   a.nombre," +
            "   a.apellidos," +
            "   a.hora_entrada," +
            "   a.hora_salida," +
            "   a.costo_colegiatura," +
            "   a.costo_inscripcion," +
            "   a.minutos_gracia," +
            "   a.fecha_inscripcion::date," +
            "   a.fecha_reinscripcion::date," +
            "   suc.nombre as nombre_sucursal, " +
            "   balance.id as id_balance," +
            "   balance.total_adeudo," +
            "   balance.total_pagos," +
            "   balance.total_cargos," +
            "   to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM') AS nuevo_ingreso " +
            " From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "                 inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "                 inner join co_sucursal suc on a.co_sucursal =suc.id" +
            " WHERE a.co_sucursal = $1 and a.eliminado = false " +
            " ORDER BY balance.total_adeudo DESC ",
            [id_sucursal],
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

*/


const getReporteBalanceAlumnosSucursal = (request, response) => {
    console.log("@getReportePrincipal");
    try {
       // validarToken(request,response);        

        const id_sucursal = request.params.id_sucursal;
        const idTipoCargoFiltro = request.params.id_tipo_cargo;
        
        const filtrarPorCargo = (idTipoCargoFiltro > 0);
        console.log("Tipo cargo "+idTipoCargoFiltro);
        console.log("filtrar ?  "+filtrarPorCargo);

        const parametros = filtrarPorCargo ? [id_sucursal,idTipoCargoFiltro] : [id_sucursal];
        pool.query(
            `
            WITH cargos AS (
            select a.id as id_alumno,
                cargos.id as id_cargo,
                tipo_cargo.id as tipo_cargo,	
                tipo_cargo.nombre as nombre_cargo,	
                cargos.fecha as fecha_cargo,
                cargos.cantidad as cantidad_cargo,	
                cargos.cargo as precio_cargo,
                cargos.total as total_adeudo,
                cargos.nota as nota_cargo,
                cargos.pagado as pagado,	
                cargos.total_pagado as total_pagado_cargo,
                cargos.texto_ayuda, 
                to_char(cargos.fecha,'YY') as anio
            from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                                                 inner join co_cargo_balance_alumno cargos on cargos.co_balance_alumno = balance.id	
                                                 inner join cat_cargo tipo_cargo on  cargos.cat_cargo = tipo_cargo.id
            where co_sucursal = $1                 
                and cargos.pagado = false
                and balance.eliminado = false 
                and cargos.eliminado = false	
            order by cargos.fecha
            ) select a.id,
                           a.foto,
                           a.nombre,
                           a.apellidos,
                           a.hora_entrada,
                           a.hora_salida,
                           a.costo_colegiatura,
                           a.costo_inscripcion,
                           a.minutos_gracia,
                           a.fecha_inscripcion::date,
                           a.fecha_reinscripcion::date,               
                           balance.id as id_balance,
                           balance.total_adeudo,
                           balance.total_pagos,
                           balance.total_cargos,
                           to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM') AS nuevo_ingreso ,
                           array_to_json(array_agg(row_to_json((c.*)))) AS cargos_array,
                           count(c.id_alumno) as numero_cargos,
                           count(c.id_alumno) > 0 as existen_cargos_adeuda
                         From co_alumno a 
                            inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                            inner join co_grupo grupo on a.co_grupo = grupo.id	
                            LEFT join cargos c  on c.id_alumno = a.id                          
                         WHERE a.co_sucursal = $1 
                         ${filtrarPorCargo ? `
                         and a.id in (
                            select a.id
                            From co_alumno a 
                                inner join co_balance_alumno balance on a.co_balance_alumno = balance.id                            												
                                inner join co_cargo_balance_alumno cargos on cargos.co_balance_alumno = balance.id  
                            where a.co_sucursal = $1
                                and a.eliminado = false 
                                and cargos.cat_cargo = $2 
                                and cargos.pagado = false 
                                and cargos.eliminado=false
                        )	
                         `:''}
                       and a.eliminado = false
                group by a.id,balance.id
                    ORDER BY balance.total_adeudo DESC
            `,
            parametros,
            (error, results) => {
                if (error) {
                    console.log(error);
                    handle.callbackError(error, response);
                    return;
                }
                console.log(" ==> "+results.rows);
                response.status(200).json(results.rows);
            });
    } catch (e) {
        console.log(e);
        handle.callbackErrorNoControlado(e, response);
    }
};


const getReporteBalancePorSucursal = (request, response) => {
    console.log("@getReporteBalancePorSucursal");
    try {
       // validarToken(request,response);        

        pool.query(
            `
            with total_alumnos_count As( 
                select co_sucursal,count(*) AS contador_alumnos
                    from co_alumno 
                    where eliminado = false
                    group by co_sucursal
             ),cargos_desglose AS (						
                 with universo_cargos as (
                         select suc.id as id_sucursal,									
                                 count(cargos.id) as cargos_pendientes_pago,
                                 tipo_cargo.id as id_cargo,
                                 tipo_cargo.nombre as tipo_cargo,
                                 sum(cargos.total) as total_cargos_desglose,
                                 sum(cargos.total_pagado) as total_cargos_pagados_desglose,
                                 (sum(cargos.total) - sum(cargos.total_pagado)) as total_cargos_pendiente_desglose
                         from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                                     inner join co_cargo_balance_alumno cargos on cargos.co_balance_alumno = balance.id	and a.eliminado = false	
                                                 and cargos.pagado = false
                                                 and cargos.eliminado = false
                                     inner join cat_cargo tipo_cargo on  cargos.cat_cargo = tipo_cargo.id
                                     inner join co_sucursal suc on a.co_sucursal = suc.id
                             group by suc.id,tipo_cargo.id
                             order by suc.id,tipo_cargo.id
                         ) select c.id_sucursal,
                                 array_to_json(array_agg(row_to_json((c.*))))::text AS json_array
                             from universo_cargos c
                             group by c.id_sucursal						
             ) SELECT suc.id, suc.nombre,suc.class_color,
                    sum(balance.total_adeudo) as total_adeuda,
                    sum(balance.total_pagos) as total_pagos,
                    sum(balance.total_cargos) as total_cargos,
                    total_alumnos.contador_alumnos,
                    COALESCE(cargos.json_array::json,'[]'::json) AS array_desglose_cargos 
              FROM co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id and a.eliminado = false
                        inner join co_grupo grupo on a.co_grupo = grupo.id
                        inner join co_sucursal suc on a.co_sucursal =suc.id
                        inner join total_alumnos_count total_alumnos on total_alumnos.co_sucursal = suc.id             
                        left join cargos_desglose cargos on cargos.id_sucursal = suc.id																
              WHERE a.eliminado = false 
              GROUP by suc.id,suc.class_color,total_alumnos.contador_alumnos,cargos.json_array
              ORDER BY suc.nombre DESC 
            `,
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

const getReporteCrecimientoBalancePorSucursal = (request, response) => {
    console.log("@getReporteCrecimientoBalancePorSucursal");
    try {
        //validarToken(request,response);        

        pool.query(
            `
             with universo AS(
                select getDate('') As fecha
            ) select 
                suc.id,
                suc.nombre,
                suc.class_color,
				to_char(getDate(''),'Mon-YYYY') as mes_anio,								
				to_char(getDate(''),'YYYY') as numero_anio,
				to_char(getDate(''),'MM') as numero_mes,				
				count(alumno.*) as count_alumno,					
			    coalesce(sum(alumno.costo_colegiatura),0) as suma_colegiaturas,
				coalesce(sum(alumno.costo_inscripcion),0) as suma_inscripciones,
				coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) as suma_total							
			 from co_sucursal suc left join co_alumno alumno on alumno.co_sucursal = suc.id								            
								    and to_char(getDate(''),'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')						 
									and alumno.eliminado = false								   
			group by suc.id,to_char(getDate(''),'Mon-YYYY'),
						to_char(getDate(''),'MMYYYY'),
						numero_anio,
						numero_mes
                        ,suc.nombre
                        ,suc.class_color	
			order by 
					suc.nombre desc`,
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


const getReporteCrecimientoBalanceAlumnosSucursal = (request, response) => {
    console.log("@getReporteCrecimientoBalanceAlumnosSucursal");
    try {
       // validarToken(request,response);        

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            "  select a.id," +
            "   a.nombre," +
            "   a.apellidos," +
            "   a.hora_entrada," +
            "   a.hora_salida," +
            "   a.costo_colegiatura," +
            "   a.costo_inscripcion," +
            "   a.minutos_gracia," +
            "   a.fecha_inscripcion::date," +
            "   a.fecha_reinscripcion::date," +
            "   suc.nombre as nombre_sucursal, " +
            "   balance.id as id_balance," +
            "   balance.total_adeudo," +
            "   balance.total_pagos," +
            "   balance.total_cargos" +
            " From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id" +
            "                 inner join co_grupo grupo on a.co_grupo = grupo.id" +
            "                 inner join co_sucursal suc on a.co_sucursal =suc.id" +
            " WHERE a.co_sucursal = $1 and a.eliminado = false " +
            "       AND to_char(a.fecha_inscripcion,'YYYYMM') = to_char(getDate(''),'YYYYMM')" +
            " ORDER BY balance.total_adeudo DESC ",
            [id_sucursal],
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



const getReporteCrecimientoGlobal = (request, response) => {
    console.log("@getReporteCrecimientoGlobal");
    try {
       // validarToken(request,response);        

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            "  with universo AS( " +
            "       select generate_series((select min(fecha_inscripcion) from co_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha" +
            "   ) select " +
            "           to_char(u.fecha,'Mon-YYYY') as mes_anio," +
            "		    to_char(u.fecha,'YYYY') as numero_anio," +
            "           to_char(u.fecha,'MM') as numero_mes," +
            "           count(alumno.*) as count_alumno," +
            "           coalesce(sum(alumno.costo_colegiatura),0) as suma_colegiaturas," +
            "           coalesce(sum(alumno.costo_inscripcion),0) as suma_inscripciones," +
            "           coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) as suma_total" +
            "   from universo u left join co_alumno alumno " +
            "           on to_char(u.fecha,'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')" +
            "           and alumno.eliminado = false" +
            "    group by to_char(u.fecha,'Mon-YYYY')," +
            "   to_char(u.fecha,'MMYYYY')," +
            "           numero_anio," +
            "			numero_mes	" +
            " order by numero_anio desc,numero_mes desc ",
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



const getReporteCrecimientoMensualSucursal = (request, response) => {
    console.log("@getReporteCrecimientoMensualSucursal");
    try {
        //validarToken(request,response);        

        const id_sucursal = request.params.id_sucursal;

        pool.query(
            ` 
            with universo AS(
                select generate_series((select date_trunc('year', now())),(getDate('')+getHora(''))::timestamp,'1 month') as fecha                                
			), gastos_mensuales AS(
					  Select      
							g.co_sucursal,
							to_char(g.fecha,'YYYYMM') as mes,
                			sum(g.gasto) as suma_gastos
            			from co_gasto g left join universo u on to_char(g.fecha,'YYYYMM') =  to_char(u.fecha,'YYYYMM')
			            where  g.co_sucursal = $2 and g.eliminado = false				
						group by  g.co_sucursal,to_char(g.fecha,'YYYYMM')					
								
			) select 
                suc.nombre,
                suc.class_color,
				to_char(u.fecha,'Mon-YYYY') AS mes_anio,								
				to_char(u.fecha,'YYYY') AS numero_anio,
				to_char(u.fecha,'MM') AS numero_mes,				
				count(alumno.*) as count_alumno,			
				gastos.suma_gastos,
			    coalesce(sum(alumno.costo_colegiatura),0) AS suma_colegiaturas,
				coalesce(sum(alumno.costo_inscripcion),0) AS suma_inscripciones,
				coalesce((sum(alumno.costo_colegiatura) + sum(alumno.costo_inscripcion)),0) AS suma_total							
			 from universo u left join co_alumno alumno 
								on to_char(u.fecha,'YYYYMM') = to_char(alumno.fecha_inscripcion,'YYYYMM')
								and alumno.eliminado = false																				
                                inner join co_sucursal suc on alumno.co_sucursal = suc.id								
								left join gastos_mensuales gastos on gastos.co_sucursal = suc.id  and gastos.mes = to_char(u.fecha,'YYYYMM')
            where suc.id = $1 
			group by to_char(u.fecha,'Mon-YYYY'),
						to_char(u.fecha,'MMYYYY'),
						numero_anio,
						numero_mes
                        ,suc.nombre
                        ,suc.class_color
						,gastos.suma_gastos
			order by 
					suc.nombre, 
            		numero_anio desc,
					numero_mes desc 
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





const getReporteAlumnosMensualCrecimiento = (request, response) => {
    console.log("@getReporteAlumnosMensualCrecimiento");
    try {
        
        //validarToken(request,response);        

        console.log(JSON.stringify(request.params));

        const id_sucursal = request.params.id_sucursal;
        const mes_anio = request.params.mes_anio;
        // const { id_sucursal,mes_anio } = request.body.json_param;

        pool.query(`
         select a.id, 
              a.nombre,
               a.apellidos,
               a.hora_entrada,
               a.hora_salida,
               a.costo_colegiatura,
               a.costo_inscripcion,
               a.minutos_gracia,
               a.fecha_inscripcion::date,
               a.fecha_reinscripcion::date,
               suc.nombre as nombre_sucursal, 
               balance.id as id_balance,
               balance.total_adeudo,
               balance.total_pagos,
               balance.total_cargos
             From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                             inner join co_grupo grupo on a.co_grupo = grupo.id
                             inner join co_sucursal suc on a.co_sucursal =suc.id
             WHERE a.co_sucursal = $1 and a.eliminado = false 			
                   AND to_char(a.fecha_inscripcion,'Mon-YYYY') = $2
             ORDER BY balance.total_adeudo DESC
         `,
            [id_sucursal, mes_anio],
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



const getReporteAlumnosNuevosIngresosGlobal = (request, response) => {
    console.log("@getReporteAlumnosNuevosIngresosGlobal");
    try {
        //validarToken(request,response);        

        const { anio, mes } = request.params;

        pool.query(
            `   
        select a.id, 
            a.nombre,
            a.apellidos,
            a.hora_entrada,
            a.hora_salida,
            a.costo_colegiatura,
            a.costo_inscripcion,
            a.minutos_gracia,
            a.fecha_inscripcion::date,
            a.fecha_reinscripcion::date,
            suc.nombre as nombre_sucursal, 
            suc.class_color,
            balance.id as id_balance,
            balance.total_adeudo,
            balance.total_pagos,
            balance.total_cargos,
            balance.total_adeudo > 0 as adeuda,
            to_char(a.fecha_inscripcion,'MM') = to_char(getDate(''),'MM') as nuevo_ingreso
       From co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                       inner join co_grupo grupo on a.co_grupo = grupo.id
                       inner join co_sucursal suc on a.co_sucursal =suc.id
       WHERE  to_char(a.fecha_inscripcion,'YYYY') = $1
              AND to_char(a.fecha_inscripcion,'MM') = $2
              AND a.eliminado = false 			
       ORDER BY suc.nombre DESC
         `,
            [anio, mes],
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


const getReporteGastosIngresosSucursalPorMes = (request, response) => {
    console.log("@getReporteGastosIngresosSucursalPorMes");
    try {
        //validarToken(request,response);        

        let id_sucursal = request.params.id_sucursal;
        let mes = request.params.mes;

        console.log("id_sucursal " + id_sucursal);
        console.log("mes " + mes);

        let sql = `  with gastos_mes AS (
            Select      
                g.co_sucursal,							
                sum(g.gasto) as suma_gastos
            from co_gasto g 
            where  g.co_sucursal = $3
                    and  
                    to_char(g.fecha,'Mon-YYYY') = `+ (mes != 'null' ? "'" + mes + "'" : "to_char(now(),'Mon-YYYY')") +
            ` and g.eliminado = false				
            group by g.co_sucursal
        )		
            SELECT 
                suc.id as id_sucursal,
                suc.nombre as sucursal,	                
                gastos.suma_gastos,
                (sum(cargo.cargo) - gastos.suma_gastos) as ganancias,
                count(cargo.*) as contador_total_cargos,
                count(cargo.*) filter (where cargo.pagado) as contador_cargos_pagados,			   
                count(cargo.*) filter (where not cargo.pagado) as contador_cargos_no_pagados,				
                sum(cargo.cargo) as cargos,
                sum(cargo.total_pagado) as pagados,               				
                sum(cargo.cargo) filter (where cargo.pagado) as suma_cargos ,              				
                sum(cargo.cargo) filter (where not cargo.pagado ) as suma_cargos_pendientes
        from co_cargo_balance_alumno cargo  left join co_pago_cargo_balance_alumno rel on rel.co_cargo_balance_alumno = cargo.id
                             left join co_pago_balance_alumno pago on rel.co_pago_balance_alumno = pago.id and pago.eliminado = false                 
                            inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
                            left join co_sucursal suc on suc.id = al.co_sucursal
                            left join gastos_mes gastos on gastos.co_sucursal = suc.id
    WHERE cargo.cat_cargo = $1
            and suc.id = $2
            and to_char(cargo.fecha,'Mon-YYYY') = `+ (mes != 'null' ? "'" + mes + "'" : "to_char(now(),'Mon-YYYY')") +
            ` and cargo.eliminado = false 
    GROUP BY suc.id,gastos.suma_gastos`;

        console.log(sql);

        pool.query(
            sql
            , [CARGOS.ID_CARGO_MENSUALIDAD, id_sucursal, id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                if (results.rowCount > 0) {
                    response.status(200).json(results.rows[0]);
                } else {
                    response.status(200).json(null);
                }
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const getAllAlumnosCargos = (request, response) => {
    console.log("@getAllAlumnosCargos");
    try {
       
       // validarToken(request,response);        

        const {id_sucursal } = request.params;

       pool.query(
            `
            with universo_cargos as (
                select
                    a.id as id_alumno,											 
                    tipo_cargo.nombre as tipo_cargo,
                    count(cargos.*) as cargos_totales, 
                    count(cargos.*) filter (where cargos.pagado) as cargos_pagados,
                    count(cargos.*) filter (where cargos.pagado = false) as cargos_no_pagados								 
                  from co_alumno a inner join co_balance_alumno balance on a.co_balance_alumno = balance.id
                        inner join co_cargo_balance_alumno cargos on cargos.co_balance_alumno = balance.id	and a.eliminado = false	
                                    --and cargos.pagado = false
                                    and cargos.eliminado = false
                        inner join cat_cargo tipo_cargo on  cargos.cat_cargo = tipo_cargo.id
                        inner join co_sucursal suc on a.co_sucursal = suc.id							
                 where suc.id = $1
                group by
                       tipo_cargo.nombre,                          
                       a.id
               order by a.id
            ) select 
                   al.id as id_alunno,
                   al.foto,
                   al.nombre as nombre_alumno,
                   al.apellidos,
                   grupo.nombre as grupo,
                   al.co_sucursal AS id_sucursal,
                   sum(c.cargos_totales) as total_cargos,
                   sum(c.cargos_no_pagados) as total_cargos_no_pagados,
                   sum(c.cargos_pagados) as total_cargos_pagados,
                   array_to_json(array_agg(row_to_json((c.*))))::text AS json_array
                from  co_alumno al inner join universo_cargos c on c.id_alumno = al.id 
                                   and al.co_sucursal = $2                
                                   inner join co_grupo grupo on grupo.id = al.co_grupo
                group by al.id,grupo.id
               order by al.nombre
            `,
            [id_sucursal,id_sucursal],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            })
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    getReporteBalanceAlumnosSucursal,
    getReporteBalancePorSucursal,
    getReporteCrecimientoBalancePorSucursal,
    getReporteCrecimientoBalanceAlumnosSucursal,
    getReporteCrecimientoGlobal,
    getReporteCrecimientoMensualSucursal,
    getReporteAlumnosMensualCrecimiento,
    getReporteAlumnosNuevosIngresosGlobal    ,
    getReporteGastosIngresosSucursalPorMes,
    getAllAlumnosCargos
}
