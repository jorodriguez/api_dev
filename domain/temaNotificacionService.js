const usuarioDao = require('../dao/usuarioDao');
const { isEmptyOrNull, existeValorArray } = require('../utils/Utils');

function obtenerCorreosPorTema(idSucursal, idTema) {

    return new Promise((resolve, reject) => {
        usuarioDao
            .obtenerCorreosPorTema(idSucursal, idTema)
            .then(results => {
                var correos = [];
                if (!isEmptyOrNull(results)) {
                    let correoUsuarios = results[0].correos_usuario || [];
                    let correoCopia = results[1].correos_usuario || [];
                    correos = correoUsuarios.concat(correoCopia);
                }
                console.log("Correos de copia "+correos);
                resolve(correos);
            }).catch(error => {
                console.error("Error al extraer los correos copia por tema " + error);
                reject(error);
            });
    });
}

module.exports = { obtenerCorreosPorTema }