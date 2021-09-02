
const { getQueryInstance } = require('../services/sqlHelper');
const { ExceptionBD } = require('../exception/exeption');
//const { isEmptyOrNull } = require('../utils/Utils');
const genericDao = require('./genericDao');
/*
function validarGasto(gastoData) {
    console.log("=====>> " + JSON.stringify(gastoData));
    if (gastoData == null || gastoData == undefined) {
        console.log("es null el obj");
        return false;
    }

    console.log("gastoData.cat_tipo_gasto" + gastoData.cat_tipo_gasto);
    let ret = !gastoData.cat_tipo_gasto
        || !gastoData.co_forma_pago
        || !gastoData.co_sucursal
        || !gastoData.fecha
        || !gastoData.gasto
        || !gastoData.observaciones
        || !gastoData.genero;

    console.log("==> " + ret);
    return ret;
}*/

const registrarGasto = (gastoData) => {
    console.log("@registrarGasto");
    return new Promise((resolve, reject) => {

      const { cat_tipo_gasto, co_forma_pago, co_sucursal, fecha, gasto, observaciones, genero } = gastoData;

        getQueryInstance(
            `INSERT INTO CO_GASTO(cat_tipo_gasto,co_forma_pago,co_sucursal,fecha,gasto,observaciones,genero)
                    VALUES($1,$2,$3,$4,$5,$6,$7) returning id;`,
            [cat_tipo_gasto, co_forma_pago, co_sucursal, new Date(fecha), gasto, observaciones, genero])
            .then((results) => {
                resolve(results.rowCount > 0 ? results.rows[0].id : 0);
            }).catch((error => {
                reject(new ExceptionBD(error));
            }));
    });
};


const modificarGasto = (gastoData) => {
    console.log("@modificarGasto");

    return new Promise((resolve, reject) => {

        /*  if(!validarGasto(gastoData)){
              reject(new Exception("Datos incompletos","Datos incompletos"));    
              return;            
          }       
  */

        const { id, cat_tipo_gasto, co_forma_pago, fecha, gasto, observaciones, genero } = gastoData;
//
        getQueryInstance(`
            UPDATE CO_GASTO
                SET cat_tipo_gasto = $2,
                    co_forma_pago = $3,                            
                    fecha = $4,
                    gasto = $5,
                    observaciones = $6,
                    modifico = $7,
                    fecha_modifico = (getDate('')+getHora(''))::timestamp
             WHERE ID = $1 returning id;
            `, [id, cat_tipo_gasto, co_forma_pago, fecha, gasto, observaciones, genero])
            .then(result => {
                resolve(result.rowCount > 0 ? result.rows[0].id : 0);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });
}


const eliminarGasto = (idGasto, genero) => {
    console.log("@eliminarGasto");

    return genericDao.eliminarPorId("CO_GASTO", idGasto, genero);

};

const getCatalogoTipoGasto = () => {
    console.log("@getCatalogoTipoGasto");

    return genericDao.findAll("SELECT * from cat_tipo_gasto where eliminado = false order by nombre", []);

};


const getGastosPorSucursal = (idSucursal, anioMes) => {
    console.log("@getGastosPorSucursal");
    console.log("request.params.co_sucursal" + idSucursal);

    const co_sucursal = idSucursal;
    const anio_mes = anioMes;
    return genericDao.findAll(
        `
                select 
                tipo.nombre as nombre_tipo_gasto, 
                fpago.nombre as nombre_tipo_pago,
                suc.nombre as nombre_sucursal,
                g.fecha,
                to_char(g.fecha,'dd-mm-yyyy') as fecha_text,
                g.id,
                g.cat_tipo_gasto,
                g.co_forma_pago,
                g.co_sucursal,
                g.gasto,
                g.observaciones
                from co_gasto g inner join cat_tipo_gasto tipo on g.cat_tipo_gasto = tipo.id
                    inner join co_forma_pago fpago on g.co_forma_pago = fpago.id
                    inner join co_sucursal suc on g.co_sucursal = suc.id
                where suc.id = $1 and g.eliminado  = false  
                        and to_char(g.fecha,'YYYYMM') = $2
                order by g.fecha desc                
            `
        , [co_sucursal, anio_mes]);
};


const getSumaMesGastosPorSucursal = (idSucursal) => {
    console.log("@getSumaMesGastosPorSucursal");
   
        console.log("request.params.co_sucursal" + idSucursal);

        return genericDao.findAll(
            `
        with meses AS(
            select generate_series((select min(fecha_inscripcion) from co_alumno),
								 (date_trunc('month',current_date) + '1 month - 1 day')::date,'1 month') as mes
        ) select
                to_char(m.mes,'Mon-YYYY') as mes_anio,
                to_char(m.mes,'YYYYMM') as anio_mes,
                coalesce(sum(gasto.gasto),0) as suma
          from meses m left join co_gasto gasto on to_char(m.mes,'YYYYMM') = to_char(gasto.fecha,'YYYYMM') and gasto.eliminado = false			
                    and gasto.co_sucursal = $1
        group by to_char(m.mes,'Mon-YYYY'),to_char(m.mes,'YYYYMM')
        order by to_char(m.mes,'YYYYMM') desc                             
        `,
            [idSucursal]);
       
};



//fix es por mes y sucursal
const getGastosAgrupadosPorSucursal = (idSucursal) => {
    console.log("@getGastosAgrupadosPorSucursal");
          console.log("request.params.co_sucursal" + idSucursal);

       return genericDao.findAll( `               
        select 
            tipo.nombre as nombre_tipo_gasto, 
            fpago.nombre as nombre_tipo_pago,
            suc.nombre as nombre_sucursal,
            sum(g.gasto) as gasto_sucursal
        from co_gasto g inner join cat_tipo_gasto tipo on g.cat_tipo_gasto = g.id
                inner join co_forma_pago fpago on g.co_forma_pago = fpago.id
                inner join co_sucursal suc on g.co_sucursal = suc.id
        where  g.eliminado  = false
        group by tipo.nombre,fpago.nombre,suc.nombre
        `, [idSucursal]);
        
};


module.exports = {
    registrarGasto,
    modificarGasto,
    eliminarGasto,
    getCatalogoTipoGasto,
    getGastosPorSucursal,
    getSumaMesGastosPorSucursal,
    getGastosAgrupadosPorSucursal

};