
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const mensajeria  = require('./mensajesFirebase');

const registrarBalanceAlumno = (id_alumno,genero) => {
    console.log("@ragistrarBalanceAlumno");
    try {                     
        pool.query("select insertar_balance_alumno($1,$2)",                               
            [id_alumno,genero],
            (error, results) => {
                if (error) {
                    console.log("error al invocar el procedimeinto de alta de balance "+error);
                    return false;
                }                
                console.log("Se creo el balance y se relaciono ");                
                return results.rowCount >0;                
            });
    } catch (e) {
        console.log("error no controlado  "+error);     
        return false;        
    }
};


module.exports = {
    registrarBalanceAlumno
}