
const { getQueryInstance } = require('../services/sqlHelper');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');

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
    console.log("@findOne");

    return new Promise((resolve, reject) => {  
        if(isEmptyOrNull(query,params)){
            console.error("el query o los parametros son null "+query);
            reject(new ExceptionBD("el query o los parametros son null"));
            return;
        }    
        
        getQueryInstance(query,params)
            .then(results => {
                console.log("resuls"+results);
                resolve(results.rowCount > 0 ? results.rows[0]:null);
            }).catch(error => {
                //reject(new ExceptionBD(error));
                console.log(error);
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
                console.log("Result "+JSON.stringify(results));
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
    /*
    return new Promise((resolve, reject) => { 
        if(isEmptyOrNull(query)){
            reject(new ExceptionBD("el query o los parametros son null"));
            return;
        }
        getQueryInstance(query,[])
            .then(results => {
                resolve(results);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });*/       
};

function eliminarPorId(tabla,id,genero){
    return execute(`UPDATE ${tabla} 
                    SET ELIMINADO = true,
                        MODIFICO = $2,
                        FECHA_MODIFICO = (getDate('')+getHora(''))::timestamp
                    WHERE ID = $1 RETURNING ID;
                        `,[id,genero])
}

/*module.exports = function findAll(query){
    console.log("@genericQuery");    
    return new Promise((resolve, reject) => {      
        getQueryInstance(query,params)
            .then(results => {
                resolve(results.rows);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });       
};*/


module.exports = {findAll,findOne,eliminarPorId,execute,executeProcedure,executeProcedureWithParameters};