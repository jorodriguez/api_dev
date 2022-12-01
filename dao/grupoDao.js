const genericDao = require('./genericDao');

const getAllGruposSucursal = async(idSucursal) => {
    return await genericDao.findAll(`SELECT * FROM CO_GRUPO WHERE CO_SUCURSAL = $1 AND ELIMINADO = false `, [idSucursal]);
};

module.exports = { getAllGruposSucursal };