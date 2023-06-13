const genericDao = require('./genericDao');

const getFechaCorte = async() => {
    return await genericDao.findOne(`select to_char(current_date,'dd-mon') as fecha`, []);
}

const getCorteSucursales = async() => {

    return await genericDao.findAll(`
    with universo as(
      select 
        to_char(p.fecha,'HH24:MI') as hora,
        p.pago,
        coalesce(a.nombre_carino,a.nombre ||' '|| a.apellidos) as alumno, 	  
        fpago.nombre as forma_pago,
        suc.nombre as sucursal,
        suc.id as id_sucursal,
        current_date as dia        
      from co_pago_balance_alumno p inner join co_balance_alumno b on b.id = p.co_balance_alumno
                           inner join co_alumno a on a.co_balance_alumno = p.co_balance_alumno
                           inner join co_sucursal suc on suc.id = a.co_sucursal
                           inner join co_forma_pago fpago on fpago.id = p.co_forma_pago
      where 
          p.fecha::date = current_date 
          and p.eliminado = false
  )
  select u.sucursal, array_to_json(array_agg(to_json(u.*))) as lista_pagos, count(u.*) contador_pagos,sum(u.pago) as pago_total_sucursal,
       (
        select coalesce(sum(gasto),0) as gasto
    from co_gasto 
    where fecha = current_date 
      and co_sucursal = u.id_sucursal
      and eliminado = false			
  ) as total_gasto
    from universo u
    group by u.sucursal,total_gasto
    `, []);
};



const getCorteAdeudoSucursales = async() => {

    return await genericDao.findAll(`
 
  select  suc.nombre as sucursal, sum(cargo.total) as total_adeudo, count(cargo.*) as contador
  from co_cargo_balance_alumno cargo inner join co_alumno al on al.co_balance_alumno = cargo.co_balance_alumno
							  inner join co_sucursal suc on suc.id = al.co_sucursal
  where cargo.pagado = false
  	and cargo.eliminado = false
  group by suc.nombre
  `, []);
};


/*
 with universo as(
        select to_char(p.fecha,'HH24:MI') as hora,
          p.pago,
          coalesce(a.nombre_carino,a.nombre ||' '|| a.apellidos) as alumno, 	  
          fpago.nombre as forma_pago,
          suc.nombre as sucursal,
          suc.id as id_sucursal,
          current_date as dia
        from co_pago_balance_alumno p inner join co_balance_alumno b on b.id = p.co_balance_alumno
                             inner join co_alumno a on a.co_balance_alumno = p.co_balance_alumno
                             inner join co_sucursal suc on suc.id = a.co_sucursal
                             inner join co_forma_pago fpago on fpago.id = p.co_forma_pago
        where 
            p.fecha::date = current_date 
            and p.eliminado = false
    ) select u.sucursal, array_to_json(array_agg(to_json(u.*))), count(u.*),sum(u.pago) as pago_total_sucursal
      from universo u 
      group by u.sucursal
*/


module.exports = { getFechaCorte, getCorteSucursales, getCorteAdeudoSucursales };