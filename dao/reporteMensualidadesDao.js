
const genericDao = require('./genericDao');
/*
const getMensualidadesAlumnosSucursal = function (idCargo,idSucursal,anio) {
    return genericDao.findAll(
    `
    with meses AS(      
        select m.id,
				m.nombre,
				m.abreviatura,
				to_char(generate_series,'YYYY')  as anio,
				to_char(generate_series,'YYYYMM')  as anio_mes,
                to_char(generate_series,'MM')::integer  as numero_mes
        from generate_series(
							(select date_trunc('year', now())),
					    	(select TO_CHAR(getDate(''), 'yyyy-12-31')::date)
							,'1 month'
				) inner join si_meses m on m.id = to_char(generate_series,'MM')::integer 
    ), mensualidades AS(
	select			
			cargo.id,			
			cargo.co_balance_alumno,
			m.id as id_mes,
			m.nombre as nombre_mes,
			m.anio,
			m.anio_mes,
			cargo.pagado,
			cargo.total_pagado,
			cargo.cargo,
			cargo.total,
			cargo.fecha,
			cargo.texto_ayuda,
			(select count(*)
				from co_pago_cargo_balance_alumno
				where co_cargo_balance_alumno = cargo.id and eliminado = false
			) as numero_pagos
	from co_cargo_balance_alumno cargo left join meses m on m.anio_mes = to_char(cargo.fecha,'YYYYMM')
									   left join co_alumno a on a.co_balance_alumno = cargo.co_balance_alumno
	where  cargo.cat_cargo = $1 			
			and a.co_sucursal = $2
			and cargo.eliminado = false 	
			and  to_char(cargo.fecha,'YYYY')::integer = $3
	) select 
		a.id,
		a.nombre as nombre_alumno,
		a.apellidos as apellidos_alumno,
		grupo.nombre as grupo,
		a.eliminado,
		array_to_json(
                array_agg(row_to_json(m.*) order by m.fecha)
        ) as cargos_array
	  from co_alumno a inner join mensualidades m on a.co_balance_alumno = m.co_balance_alumno
	  				inner join co_grupo grupo on grupo.id = a.co_grupo
	 -- where a.eliminado = false
	  group by a.id,a.nombre,a.apellidos,a.eliminado,grupo.nombre
	  order by a.nombre
    
    `,[idCargo,idSucursal,anio]);
};
*/

const getMensualidadesAlumnosSucursal = function (idCargo, idSucursal, anio) {
	console.log("idCargo "+idCargo+" suc "+idSucursal+" anio "+anio);
	return genericDao.findAll(
		`		
		select *	
		from crosstab(
			'
		with meses AS(      
		select m.id,
				m.nombre,
				m.abreviatura,
				to_char(generate_series,''YYYY'')  as anio,
				to_char(generate_series,''YY'')  as anio_abreviado,
				to_char(generate_series,''YYYYMM'')  as anio_mes,
				to_char(generate_series,''MM'')::integer  as numero_mes
		from generate_series(
							(make_date(${anio},01,01)),
							(make_date(${anio},12,31))
							,''1 month''
				) inner join si_meses m on m.id = to_char(generate_series,''MM'')::integer 
		), mensualidades AS(
		select			
			cargo.id as id_cargo,				
			cargo.co_balance_alumno,
			suc.nombre as sucursal,
			a.id as id_alumno,
			a.nombre as nombre_alumno,						
			coalesce(a.apellidos,'''') as apellidos_alumno,
			a.eliminado,
			m.nombre as nombre_mes,
			m.anio,			
			m.anio_abreviado,
			m.abreviatura as abreviatura_mes,
			cargo.pagado,
			cargo.total_pagado,
			cargo.cargo,
			cargo.total,
			cargo.descuento,
			(des.id is not null) as descuento_aplicado,
			des.nombre as nombre_descuento,
			cargo.fecha as fecha_cargo,
			cargo.texto_ayuda,
			(select count(*)
				from co_pago_cargo_balance_alumno
				where co_cargo_balance_alumno = cargo.id and eliminado = false
			) as numero_pagos
		from co_cargo_balance_alumno cargo inner join meses m on m.anio_mes = to_char(cargo.fecha,''YYYYMM'')
									   inner join co_alumno a on a.co_balance_alumno = cargo.co_balance_alumno
									   inner join co_sucursal suc on suc.id = a.co_sucursal
									   left join cat_descuento_cargo des on des.id = cargo.cat_descuento_cargo
		where  cargo.cat_cargo = ${idCargo}		
			and a.co_sucursal = ${idSucursal}
			and cargo.eliminado = false 	
			and  to_char(cargo.fecha,''YYYY'')::integer = ${anio}
		)
		SELECT m.nombre_alumno::text||'' ''||m.apellidos_alumno,m.sucursal, m.nombre_mes,row_to_json(m.*) from mensualidades m order by 1',
		'select nombre from si_meses'
		)  as (
		alumno text,sucursal text,  ENERO json,  FEBRERO json,  MARZO json,  ABRIL json,  MAYO json,  JUNIO json,  JULIO json,
				AGOSTO json,  SEPTIEMBRE json,  OCTUBRE json,  NOVIEMBRE json,  DICIMEBRE json
		);
    `, []);
};


module.exports = {
	getMensualidadesAlumnosSucursal
};