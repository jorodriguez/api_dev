
const genericDao = require('./genericDao');

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
			m.nombre,
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
		array_to_json(
                array_agg(row_to_json(m.*) order by m.fecha)
        ) as cargos_array
	  from co_alumno a inner join mensualidades m on a.co_balance_alumno = m.co_balance_alumno
	  				inner join co_grupo grupo on grupo.id = a.co_grupo
	  where a.eliminado = false
	  group by a.id,a.nombre,a.apellidos,grupo.nombre
	  order by a.nombre
    
    `,[idCargo,idSucursal,anio]);
};



module.exports = {
    getMensualidadesAlumnosSucursal    
};