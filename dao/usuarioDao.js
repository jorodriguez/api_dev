const genericDao = require('./genericDao');
const { TIPO_USUARIO } = require('../utils/Constantes');
const bcrypt = require('bcryptjs');

function obtenerCorreosPorTema(co_sucursal, id_tema) {
    return genericDao.findAll(`
            SELECT 
                (select array_to_json(array_agg(to_json(u.correo)))
                FROM co_usuario_notificacion un inner join usuario u on u.id = un.usuario
                WHERE un.co_sucursal = $1 and un.co_tema_notificacion = $2
                and un.eliminado = false and u.eliminado = false)
                AS correos_usuarios,	
                (SELECT array_to_json(array_agg(to_json(correo)))
                FROM co_correo_copia_notificacion
                WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false) 
                as correos_copia    
`, [co_sucursal, id_tema])
}

const getUsuarioPorSucursal = (idSucursal) => {
    return genericDao.findAll(`SELECT `);
};

falta generarle una clave de acceso y guardarla en el insert

const insertarUsuario = (usuarioData) => {
    console.log("@insertarUsuario");

    const { nombre, correo, id_sucursal, hora_entrada, hora_salida, genero } = cargoData;
    
    //TIPO_USUARIO.MAESTRA
    console.log(" hora entrada " + hora_entrada + " h salida " + hora_salida + " correo " + correo);
    
    let sql = `
            INSERT INTO USUARIO(NOMBRE,CORREO,CO_SUCURSAL,CO_TIPO_USUARIO,HORA_ENTRADA,HORA_SALIDA,GENERO)
            VALUES($1,$2,$3,$4,$5,$6,$7);
            `;
    return genericDao.execute(sql, [nombre,correo,id_sucursal,TIPO_USUARIO.MAESTRA,hora_entrada,hora_entrada,genero]);        
};


const modificarUsuario = (usuarioData) => {
    console.log("@modificarUsuario");

    const { nombre, correo, hora_entrada, hora_salida, genero } = cargoData;
    
    //TIPO_USUARIO.MAESTRA
    console.log(" hora entrada " + hora_entrada + " h salida " + hora_salida + " correo " + correo);
    
    let sql = `
            INSERT INTO USUARIO(NOMBRE,CORREO,CO_SUCURSAL,CO_TIPO_USUARIO,HORA_ENTRADA,HORA_SALIDA,GENERO)
            VALUES($1,$2,$3,$4,$5,$6);
            `;
    return genericDao.execute(sql, [nombre,correo,hora_entrada,hora_entrada,genero]);        
};


const bajaUsuario = (usuarioData) => {

    console.log("@modificarUsuario");

    const {id_usuario,motivo_baja,fecha_baja, genero } = cargoData;
    let sql = `
            UPTADE USUARIO SET 
                    BAJA = TRUE,
                    MOTIVO_BAJA = $2,
                    FECHA_BAJA = $3,
                    FECHA_MODIFICO=getDate(''),
                    MODIFICO = $4
            WHERE ID = $1;                    
            `;
    return genericDao.execute(sql, [id_usuario,motivo_baja,fecha_baja,genero]);        

};

module.exports = { obtenerCorreosPorTema,insertarUsuario,modificarUsuario,eliminarUsuario,bajaUsuario}
