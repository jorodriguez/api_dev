const alumnoDao = require('../dao/alumnoDao');

function getCorreosTokenAlumno(idAlumno) {
    console.log("@getCorreosTokenAlumno");
    return  alumnoDao.getCorreosTokensAlumno(idAlumno);    
}

function modificarFechaLimitePagoMensualidad(idAlumno,fecha,genero){
    return alumnoDao.modificarFechaLimitePagoMensualidadAlumno(idAlumno,fecha,genero);
}



module.exports = { getCorreosTokenAlumno,
                    modificarFechaLimitePagoMensualidad,
                    bajaAlumno:alumnoDao.bajaAlumno,
                    activarAlumnoEliminado:alumnoDao.activarAlumnoEliminado
                 };
