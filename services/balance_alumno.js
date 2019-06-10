
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mensajeria  = require('./mensajesFirebase');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


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