
const { pool } = require('../db/conexion');
const { getCatalogo } = require('./catagolosHelper');

const getMesesActivos = (request, response) => {
    console.log("@getMeses");

    const mesesSql = `
           with universo AS(
             select generate_series((select min(fecha) from co_cargo_balance_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha
               ) select u.fecha::date,
                       extract(month from u.fecha) as numero_mes,
                       extract(year from u.fecha) as numero_anio,
                       to_char(u.fecha,'Mon') as nombre_mes
               from universo u 
    `;

    getCatalogo(mesesSql,request,response);
  
};

//buscar un correo de papa repetidos

//const findCorreoPadre = (request, response) => {
const findCorreoPadre = (correo) => {
    console.log("@findCorreoPapa");

    return new Promise((resolve, reject) => {
        pool.query(
            `
                SELECT 
                    CASE WHEN 
                            EXISTS (
                                SELECT true 
                                FROM co_familiar f 
                                WHERE f.correo = $1
                                    AND f.eliminado = false
                                )
                        THEN true
                        ELSE false
                    END AS encontrado
                `, [correo],
            (error, results) => {
                if (error) {
                    console.log("Error al buscar el correo del familiar " + e);
                    reject(error);
                }
                
                if (results.rowCount > 0) {
                    console.log(" Correo de papa encontrado ");                    
                    console.log("==== " + JSON.stringify(results.rows[0]));
                    let encontrado = results.rows[0].encontrado;

                    resolve(encontrado);

                }                
            });
    });

};




module.exports = {
    getMesesActivos,
    findCorreoPadre,    
}