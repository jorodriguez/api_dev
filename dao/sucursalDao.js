const genericDao = require('./genericDao');

const getInfoSucursal = async(idSucursal) => {
    return await genericDao.findOne(`select s.id,s.nombre,s.direccion,s.foto,s.cat_tipo_cobranza,tipo_cobranza.nombre as tipo_cobranza, tipo_cobranza.descripcion,tipo_cobranza.etiqueta_inscripcion
    from co_sucursal s inner join cat_tipo_cobranza tipo_cobranza on tipo_cobranza.id = s.cat_tipo_cobranza
    where s.id = $1 and s.eliminado = false
    `, [idSucursal]);
};

module.exports = { getInfoSucursal };