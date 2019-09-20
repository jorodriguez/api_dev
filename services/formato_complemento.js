
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');

//obtener actividades
const getCatalogoValoresEsperados = (request, response) => {
    console.log("@getCatalogoValoresEsperados");
    try {
        validarToken(request,response);
        
        var id_formato = request.params.id_formato;

        pool.query(
            " SELECT rel.id as id_relacion," +
            "       rel.co_formato_inscripcion," +
            "        (rel.id is not null) as existe_registro," +
            "        case when rel.seleccionado is null then false else rel.seleccionado end," +
            "       v.* " +
            "  FROM co_valor_esperado_empresa v left join co_formato_valor_esperado_empresa rel on rel.co_valor_esperado_empresa = v.id" +
            "       and rel.co_formato_inscripcion = $1 " +
            "       and rel.eliminado = false" +
            "       and v.eliminado = false"
            , [id_formato],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const actualizarValoresEsperados = (formato) => {
    console.log("@actualizarValoresEsperados");

    try {   

       const { valores_esperados, genero  } = formato;

       console.log(" ======== "+JSON.stringify(formato.valores_esperados));
       
       var sqlInserts = "INSERT INTO co_formato_valor_esperado_empresa(co_formato_inscripcion,co_valor_esperado_empresa,seleccionado,genero)"+
                        " VALUES ";

       var sqlUpdates = "";

        var existeUpdate = false;        
        var existeInsert = false;
        
        for (var i = 0; i < valores_esperados.length; i++) {
            
            var item = valores_esperados[i];
            
            if(item.existe_registro){

               sqlUpdates += ("UPDATE co_formato_valor_esperado_empresa SET seleccionado = "+item.seleccionado+
                                " WHERE id = "+item.id_relacion + ";");
                existeUpdate = true;

            }else{
                if(existeInsert){
                    sqlInserts+=",";                    
                }

                sqlInserts +="("+formato.id+","+item.id+","+item.seleccionado+","+ genero+")";                                                
                existeInsert = true;
            }            
        };        
        sqlInserts+=";";

        console.log("UPDATES "+sqlUpdates);
        console.log("INSERTS "+sqlInserts);

        pool.query( (existeUpdate ? sqlUpdates:"") +" "+(existeInsert ? sqlInserts:""),
            (error, results) => {
                if (error) {
                    console.log("Error al actualizar las relaciones de formatos con valor esperado "+error);      
                    return false;
                }
               console.log("Se actualizo correctamente la relacion con valor esperado"); 
               return true;
        });
        

    } catch (e) {
        console.error("Error  al actuzaliar los valores esperados "+e);
    }
};

module.exports = {
    getCatalogoValoresEsperados,
    actualizarValoresEsperados
}