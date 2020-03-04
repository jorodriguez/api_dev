
const { pool } = require('../db/conexion');
const { getCatalogo,getResultQuery } = require('./sqlHelper');
const { ID_EMPRESA_MAGIC } = require('../utils/Constantes');
const handle = require('../helpers/handlersErrors');

const getMesesActivos = (request, response) => {
    console.log("@getMeses");

    const mesesSql = `
           with universo AS(
             select generate_series((select min(fecha) from co_cargo_balance_alumno),(getDate('')+getHora(''))::timestamp,'1 month') as fecha
               ) select u.fecha::date,
                       extract(month from u.fecha) as numero_mes,
                       extract(year from u.fecha) as numero_anio,
                       to_char(u.fecha,'MMYYYY') as mes_anio,
                       to_char(u.fecha,'Mon') as nombre_mes
               from universo u 
    `;

    getCatalogo(mesesSql,response);
  
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


const getListaDiasTrabajadosRangoFecha = (request,response) =>{

    console.log("@getListaFaltasUsuariosSucursalRangoFecha");

    const {fecha_inicio, fecha_fin, id_empresa } = request.params;

    console.log("id_empresa = " + id_empresa);
    console.log("fecha = " + fecha_inicio + " fecha fin " + fecha_fin);

    try {
        getResultQuery(`  
        SELECT g::date as fecha,    
            to_char(g::date,'d')::int in (1,7) as fin_semana,
            to_char(g::date,'d')::int as num_dia,
            to_char(g::date,'Day') as nombre_dia,
            dias_asuetos.fecha is not null as dia_asueto
        FROM  generate_series($1::date,$2::date,'1 day')  g
                left join (select fecha 
                from cat_dias_asueto 
                where cat_empresa = $3
                    and fecha between $1::date  and $2::date
                    and activo=true 
                    and eliminado = false) dias_asuetos on dias_asuetos.fecha = g::date       
     `, [new Date(fecha_inicio), new Date(fecha_fin), (id_empresa || ID_EMPRESA_MAGIC)],            
            response
        );

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    } 
};


module.exports = {
    getMesesActivos,
    findCorreoPadre,    
    getListaDiasTrabajadosRangoFecha
};