
const genericDao = require('./genericDao');
const { isEmptyOrNull } = require('../utils/Utils');
const { Exception } = require('../exception/exeption');

class DaoBase{
    
    constructor(tableName){
        this.tableName=  tableName;     
        throw new Exception("No esta Definida la table","La tabla no esta definida");           
    }      

    getTableName(){
        return this.tableName;
    }

    findAll(){
        return genericDao.findAll(`SELECT * FROM  ${this.tableName} WHERE ELIMINADO = FALSE `,[]); 
    }

    findId(id){
        if(isEmptyOrNull(id)){
            console.log("El id a buscar es null o empty");
        }
        return genericDao.findOne(`SELECT * FROM  ${this.tableName} WHERE ID = $1 ELIMINADO = FALSE `,[id]); 
    }

    execute(sql,params){        
        return genericDao.execute(sql,params); 
    }


}


module.exports = {DaoBase}