const alumnoDao = require('../dao/alumnoDao');

function getCorreosTokenAlumno(idAlumno) {

    return alumnoDao.getCorreosTokensAlumno(idAlumno);    

}


function modificarFechaLimitePagoMensualidad(idAlumno,fecha,genero){
    return alumnoDao.modificarFechaLimitePagoMensualidadAlumno(idAlumno,fecha,genero);
}


module.exports = { getCorreosTokenAlumno,modificarFechaLimitePagoMensualidad }