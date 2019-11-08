import { string } from "prop-types";

const { pool } = require('../db/conexion');

export class SqlHelper {

    constructor(sql:string,params:Array<any>){
        this.sql = sql;
        this.params =params;
    }

    ejecutar(){     
        console.log("@ejecutar");
        try {       
            console.log("Iniciando ejecucion sql ");            
            pool.query(this.sql,this.params,(error, results) => {
                    if (error) {
                        console.log("Error al ejecutar el query "+error);
                        return new ExceptionGeneral(error,"Al ejecutar el query");
                    }
                    return results;                    
                });
        } catch (exception) {      
            console.log("Execepion "+exception);      
            return new ExceptionGeneral(exception,"Exepción no controlada");
        }
    }
}

class ExceptionGeneral{
    constructor(error,mensaje){
        this.error= error;
        this.mensaje = mensaje;    
    }
}

/*
module.exports = {
 
}
*/