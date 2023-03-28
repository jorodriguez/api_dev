const genericDao = require('./genericDao');

const getCorteSucursales = async() => {

    return await genericDao.findAll(`
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
    `, []);
};

module.exports = {  getCorteSucursales  };