
const { getQueryInstance } = require('../services/sqlHelper');
const { Exception, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');

module.exports = function findAll(query,params){
    console.log("@genericQuery");

    return new Promise((resolve, reject) => {      
        getQueryInstance(query,params)
            .then(results => {
                resolve(results.rows);
            }).catch(error => {
                reject(new ExceptionBD(error));
            });
    });       
};

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
