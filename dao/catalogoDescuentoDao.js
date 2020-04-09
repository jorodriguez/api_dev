const genericDao = require('./genericDao');

const QUERY_DESCUENTOS_POR_EMPRESA =
    `        
    SELECT id,co_empresa,nombre,descuento,descuento_decimal,fecha_inicio,fecha_fin,tiene_vigencia,activo
    FROM cat_descuento_cargo
    WHERE co_empresa = $1
        AND activo = true AND eliminado = false
    ORDER BY descuento_decimal 
    `;
    
const getDescuentos = (idEmpresa) => {
    console.log("@getDescuentos ID empresa "+idEmpresa);
    return genericDao.findAll(QUERY_DESCUENTOS_POR_EMPRESA, [idEmpresa]);
};

module.exports = {
    getDescuentos
};