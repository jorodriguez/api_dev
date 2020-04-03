const catalogoRecursosDao = require('../dao/catalogoRecursosDao');
const familiarDao = require('../dao/familiarDao');

function getRecursosPorGrupo(idGrupo,idSucursal) {
    console.log("@getRecursosPorGrupo");
    return catalogoRecursosDao.getRecursosPorGrupo(idGrupo,idSucursal);

}

function getAlumnosPorFamiliar(idFamiliar){
    return familiarDao.getAlumnosPorFamiliar(idFamiliar);
}


module.exports = { getRecursosPorGrupo,getAlumnosPorFamiliar}