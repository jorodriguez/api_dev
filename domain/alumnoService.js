const alumnoDao = require('../dao/alumnoDao');

function getCorreosTokenAlumno(idAlumno) {

    return alumnoDao.getCorreosTokensAlumno(idAlumno);    

}



module.exports = { getCorreosTokenAlumno }