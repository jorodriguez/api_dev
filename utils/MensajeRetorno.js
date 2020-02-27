
class Mensaje{
    
    constructor(estatus,mensaje,excepcion,meta){        
        this.estatus= estatus;
        this.mensaje= mensaje;
        this.meta = meta;
        this.excepcion = excepcion;
    }      

    getMensaje(){
        return this.mensaje;
    }

    getEstatus(){
        return this.estatus;
    }

    getMeta(){
        return this.meta;
    }

    getExcepcion(){
        return this.excepcion;
    }
}

class MensajeRetorno extends Mensaje{
    constructor(estatus,mensaje,excepcion){
        super(estatus,mensaje,null,excepcion);
        super.meta = null;        
    }

    toJson(){
        return JSON.parse(this);
    }
}



module.exports = {MensajeRetorno};