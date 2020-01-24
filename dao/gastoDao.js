
const { getQueryInstance } = require('../services/sqlHelper');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');
const {findAll}  = require('./genericDao');

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

}

const registrarGasto = (gastoData) => {
    console.log("@registrarGasto");

    return new Promise((resolve, reject) => {

        /*  if(!validarGasto(gastoData)){
              reject(new Exception("Datos incompletos","Datos incompletos"));    
              return;            
          }       
  */
        const { cat_tipo_gasto, co_forma_pago, co_sucursal, fecha, gasto, observaciones, genero } = gastoData;

        getQueryInstance(
            `INSERT INTO CO_GASTO(cat_tipo_gasto,co_forma_pago,co_sucursal,fecha,gasto,observaciones,genero)
                    VALUES($1,$2,$3,$4,$5,$6,$7) returning id;`,
            [cat_tipo_gasto, co_forma_pago, co_sucursal, fecha, gasto, observaciones, genero])
            .then((results) => {
                resolve(results.rowCount > 0 ? results.rows[0].id : 0);
            }).catch((e => {
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
    return new Promise((resolve, reject) => {
        if (!isEmptyOrNull(idGasto, genero)) {
            reject(new Exception("Faltan datos", "Faltan datos"));
            return;
        }

        getQueryInstance(`
                    UPDATE CO_GASTO
                        SET eliminado = true,
                            modifico= $2,
                             fecha_modifico = (getDate('')+getHora(''))::timestamp
                     WHERE ID = $1 
                     returning id;
                    `, [id, genero])
            .then(result => {
                resolve(result.rowCount > 0 ? result.rows[0].id : 0);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });
};

const getCatalogoTipoGasto = () => {
    console.log("@getCatalogoTipoGasto");

    return new Promise((resolve, reject) => {      

        getQueryInstance("SELECT * from cat_tipo_gasto where eliminado = false order by nombre",[])
            .then(results => {
                resolve(results.rows);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });   
    
};


module.exports = {
    registrarGasto,
    modificarGasto,
    eliminarGasto,
    getCatalogoTipoGasto
}