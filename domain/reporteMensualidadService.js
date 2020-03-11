const reporteMensualidadesDao = require('../dao/reporteMensualidadesDao');
const {CARGOS} = require('../utils/Constantes');

function getMensualidadesAlumnosSucursal(idSucursal,anio) {
    console.log("@getMensualidadesAlumnosSucursal");
    return reporteMensualidadesDao
            .getMensualidadesAlumnosSucursal(CARGOS.ID_CARGO_MENSUALIDAD,idSucursal,anio);

}


module.exports = { getMensualidadesAlumnosSucursal};