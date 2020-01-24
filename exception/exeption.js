
class Exception{
    
    constructor(mensajeError,mensajeUsuario){
        this.mensajeError=  mensajeError;
        this.mensajeUsuario= mensajeUsuario;
    }      

    getMensajeError(){
        return this.mensajeError;
    }

    /*set mensajeError(value){
        this.mensajeError =value;
    }*/

    getMensajeUsuario(){
        return this.mensajeUsuario;
    }
    /*set mensajeUsuario(value){
            this.mensajeUsuario=value;
    }*/

}

class ExceptionBD extends Exception{
    constructor(mensajeError){
        super(mensajeError,"¡Ups! Ocurrió un error contacte al equipo de soporte.")
    }

}

module.exports = {Exception,ExceptionBD}