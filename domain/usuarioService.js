const usuarioDao = require('../dao/usuarioDao');

function obtenerCorreosPorTema(idSucursal,idTema) {
    usuarioDao
        .obtenerCorreosPorTema(idSucursal,idTema)
        .then(results=>{
                        
        }).catch(error=>{
            console.error("Error al extraer los correos copia por tema "+error);
        })

        
}



// proceso de recargos en el día enviar correo a cada papa y toda la lista a las mises
//enviar la lista completa a los dueños de todas las sedes

module.exports = { ejecutarProcesoRecargoMensualidad }