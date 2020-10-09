
const { getQueryInstance } = require('../services/sqlHelper');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');
const { pool } = require('../db/conexion');

 function findAll(query,params){
    console.log("@findAll");

    return new Promise((resolve, reject) => {    
        if(isEmptyOrNull(query,params)){
            reject(new ExceptionBD("el query o los parametros son null"));
            return;
        }   

        getQueryInstance(query,params)
            .then(results => {
                resolve(results.rows);
            }).catch(error => {
                //reject(new ExceptionBD(error));
                reject(error);
            });
    });       
};

function findOne(query,params){
    console.log("@findOne "+JSON.stringify(params));

    return new Promise((resolve, reject) => {  
        if(isEmptyOrNull(query,params)){
            console.error("el query o los parametros son null "+query);
            reject(new ExceptionBD("el query o los parametros son null"));
            return;
        }    

        /*findAll(query,params).then(results =>{

            console.log(" RESULTADO > "+JSON.stringify(results));

            resolve(results.rowCount > 0 ? results.rows[0]:null);
        }).catch(err => {
            console.log("EERROR"+err+" EN QUERY "+query +" PARAMS  "+JSON.stringify(params));            
            reject(err);
        });*/


        /*pool.query(query,params) 
        .then(results => {
            console.log("resuls"+ JSON.stringify(results));
            resolve(results.rowCount > 0 ? results.rows[0]:null);
        }).catch(error => {
            //reject(new ExceptionBD(error));
            console.log("EERROR"+error);            
            reject(error);
        });*/
        
        getQueryInstance(query,params)
            .then(results => {
               // console.log("resuls"+ JSON.stringify(results));
                resolve(results.rowCount > 0 ? results.rows[0]:null);
            }).catch(error => {
                //reject(new ExceptionBD(error));                
                console.log("EERROR"+error+" EN QUERY "+query +" PARAMS  "+JSON.stringify(params));            
                reject(error);
            });
    });       
};

function execute(query,params){
    console.log("@execute");
    return new Promise((resolve, reject) => { 
        if(isEmptyOrNull(query,params)){
            console.error("XX el query o los parametros son null XX");
            reject(new ExceptionBD("XX el query o los parametros son null XX"));
            return;
        }

        console.log("===QUERY "+query);

        getQueryInstance(query,params)
            .then(results => {
                //console.log("Result "+JSON.stringify(results));
                resolve(results.rowCount > 0 ? results.rows[0].id : null);
            }).catch(error => {
                //reject(new ExceptionBD(error));
                console.error(error);
                reject(error);
            });
    });       
};

function executeProcedureWithParameters(query,params){
    console.log("@executeProcedureWithParameters");
    return new Promise((resolve, reject) => { 
        if(isEmptyOrNull(query,params)){
            reject(new ExceptionBD("el query o los parametros son null"));
            return;
        }
        getQueryInstance(query,params)
            .then(results => {
                resolve(results);
            }).catch(error => {
                //reject(new ExceptionBD(error));
                reject(error);
            });
    });       
};

function executeProcedure(query){
    console.log("@executeProcedure");
    return executeProcedureWithParameters(query,[]);
         
};

function eliminarPorId(tabla,id,genero){
    return execute(`UPDATE ${tabla} 
                    SET ELIMINADO = true,
                        MODIFICO = $2,
                        FECHA_MODIFICO = (getDate('')+getHora(''))::timestamp
                    WHERE ID = $1 RETURNING ID;
                        `,[id,genero])
}


function buscarPorId(tabla,id){
     console.log(`Tabla consulta ${tabla} ID= ${id}`);
    if(tabla == undefined || tabla == null || tabla==''){
        console.log("el nombre de la tabla no esta definido ");        
        return null;
    }
    return findOne(`SELECT * FROM  ${tabla} WHERE ID = $1`,[id]);
    //return getQueryInstance(`SELECT * FROM  ${tabla} WHERE ID = $1`,[id]);
}

module.exports = {findAll,findOne,eliminarPorId,execute,executeProcedure,executeProcedureWithParameters,buscarPorId};