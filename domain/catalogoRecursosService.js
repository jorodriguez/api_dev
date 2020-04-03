const catalogoRecursosDao = require('../dao/catalogoRecursosDao');
const familiarDao = require('../dao/familiarDao');

function getRecursosPorGrupo(idGrupo) {
    console.log("@getRecursosPorGrupo");
    return catalogoRecursosDao.getRecursosPorGrupo(idGrupo);

}

function getAlumnosPorFamiliar(idFamiliar){
    return familiarDao.getAlumnosPorFamiliar(idFamiliar);
}


module.exports = { getRecursosPorGrupo,getAlumnosPorFamiliar}