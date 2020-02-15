const genericDao = require('./genericDao');
const { TIPO_USUARIO } = require('../utils/Constantes');
const { generarRandomPassword } = require('../dao/utilDao');
const  {encriptar} = require('../utils/Utils');

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
    return genericDao.findAll(` 
    SELECT U.ID,
	        U.NOMBRE,
	        U.CORREO,
	        U.PASSWORD,
	        U.CO_SUCURSAL,
	        U.TOKEN,
	        to_char(U.HORA_ENTRADA,'HH:mm')::text as hora_entrada,
	        to_char(U.HORA_SALIDA,'HH:mm')::text as hora_salida,
	        U.FOTO,
	        U.ACTIVO,
	        U.MOTIVO_BAJA,
	        U.FECHA_BAJA,
	        U.MINUTOS_GRACIA_ENTRADA,
	        SUC.NOMBRE AS NOMBRE_SUCURSAL,
	        TIPO_USUARIO.NOMBRE AS TIPO_USUARIO
        FROM USUARIO U INNER JOIN CO_SUCURSAL SUC ON SUC.ID = U.CO_SUCURSAL 
		        INNER JOIN CAT_TIPO_USUARIO TIPO_USUARIO ON TIPO_USUARIO.ID = U.CAT_TIPO_USUARIO
        WHERE 	        
            SUC.ID = $1 
	        AND U.ELIMINADO = FALSE
        ORDER BY U.NOMBRE `, [idSucursal]);
};


const insertarUsuario = async (usuarioData) => {
    console.log("@insertarUsuario");

    const { nombre, correo, id_sucursal, hora_entrada, hora_salida, genero } = usuarioData;

    //TIPO_USUARIO.MAESTRA
    console.log(" hora entrada " + hora_entrada + " h salida " + hora_salida + " correo " + correo);

    let password = await generarRandomPassword();
    console.log("Password generado  "+password);

    let sql = `
            INSERT INTO USUARIO(NOMBRE,CORREO,CO_SUCURSAL,CO_TIPO_USUARIO,HORA_ENTRADA,HORA_SALIDA,PASSWORD,GENERO)
            VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ID;
            `;
   return genericDao
        .execute(sql, [nombre, correo, id_sucursal, TIPO_USUARIO.MAESTRA, hora_entrada, hora_entrada, password, genero]);
};


const modificarUsuario = (idUsuario,usuarioData) => {
    console.log("@modificarUsuario");

    const { nombre, correo, hora_entrada, hora_salida, genero } = usuarioData;

    //TIPO_USUARIO.MAESTRA
    console.log(" hora entrada " + hora_entrada + " h salida " + hora_salida + " correo " + correo);

    let sql = `
            UPDATE USUARIO SET 
                            NOMBRE = $2,
                            CORREO = $3,
                            HORA_ENTRADA = $4,
                            HORA_SALIDA=$5,
                            MODIFICO = $6,
                            FECHA_MODIFICO = getDate('')
            WHERE id = $1
            returning id;
            `;
    return genericDao.execute(sql, [idUsuario,nombre, correo, hora_entrada, hora_entrada, genero]);
};

const modificarContrasena = (idUsuario,usuarioData) => {
    console.log("@modificarContrasena");

    const { nueva_clave, genero } = usuarioData;

    let nuevoPassword = encriptar(nueva_clave);

    let sql = `
            UPDATE USUARIO SET PASSWORD =  $2,
                                MODIFICO = $3,
                                FECHA_MODIFICO = getDate('')
            WHERE id = $1
            returning id;
            `;
    return genericDao.execute(sql, [idUsuario,nuevoPassword, genero]);
};


const desactivarUsuario = (idUsuario,usuarioData) => {

    console.log("@desactivarUsuario");

    const { motivo_baja, fecha_baja, genero } = usuarioData;
    let sql = `
            UPTADE USUARIO SET 
                    BAJA = TRUE,
                    MOTIVO_BAJA = $2,
                    FECHA_BAJA = $3,
                    FECHA_MODIFICO=getDate(''),
                    MODIFICO = $4
            WHERE ID = $1     
            RETURNING ID;               
            `;
    return genericDao.execute(sql, [idUsuario, motivo_baja, fecha_baja, genero]);

};

const buscarUsuarioId = (idUsuario) => {
    console.log("@findUsuarioId");
    return genericDao.buscarPorId("USUARIO", idUsuario);
};

module.exports = { obtenerCorreosPorTema, insertarUsuario, modificarUsuario, desactivarUsuario, buscarUsuarioId, modificarContrasena,getUsuarioPorSucursal }

