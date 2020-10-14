const genericDao = require('./genericDao');
const { TIPO_USUARIO } = require('../utils/Constantes');
const { generarRandomPassword } = require('../dao/utilDao');
const { encriptar } = require('../utils/Utils');

function obtenerCorreosPorTema(co_sucursal, id_tema) {
    return genericDao.findAll(`
            SELECT 
                (
                    SELECT coalesce(array_to_json(array_agg(to_json(u.correo))),'[]'::json)
                        FROM co_usuario_notificacion un inner join usuario u on u.id = un.usuario
                        WHERE un.co_sucursal = $1 and un.co_tema_notificacion = $2
                        and un.eliminado = false and u.eliminado = false
                )
                AS correos_usuarios,	
                (
                    SELECT coalesce(array_to_json(array_agg(to_json(correo))),'[]'::json)
                    FROM co_correo_copia_notificacion
                    WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false
                ) 
                AS correos_copia    
`, [co_sucursal, id_tema])
}

const getUsuarioPorSucursal = (idSucursal, idTipoUsario) => {
    return genericDao.findAll(` 
    SELECT U.ID,
	        U.NOMBRE,
	        U.CORREO,
	        U.PASSWORD,
	        U.CO_SUCURSAL,
	        U.TOKEN,
	        to_char(U.HORA_ENTRADA,'HH24:MI')::text as hora_entrada,
            to_char(U.HORA_SALIDA,'HH24:MI')::text as hora_salida,
	        U.FOTO,
	        U.ACTIVO,
	        U.MOTIVO_BAJA,
	        U.FECHA_BAJA,
	        U.MINUTOS_GRACIA_ENTRADA,
            SUC.NOMBRE AS NOMBRE_SUCURSAL,            
            TIPO_USUARIO.NOMBRE AS TIPO_USUARIO,
            U.ACCESO_SISTEMA,
            U.SUELDO_MENSUAL,
            U.SUELDO_QUINCENAL,
            EXTRACT(WEEK FROM  u.fecha_genero) = EXTRACT(WEEK FROM  getDate('')) as nuevo_ingreso
        FROM USUARIO U INNER JOIN CO_SUCURSAL SUC ON SUC.ID = U.CO_SUCURSAL 
		        INNER JOIN CAT_TIPO_USUARIO TIPO_USUARIO ON TIPO_USUARIO.ID = U.CAT_TIPO_USUARIO
        WHERE 	        
            SUC.ID = $1 AND U.CAT_TIPO_USUARIO=$2
            AND U.ACTIVO = TRUE
	        AND U.ELIMINADO = FALSE
        ORDER BY U.NOMBRE `, [idSucursal, idTipoUsario]);
};


const insertarUsuario = async (usuarioData) => {
    console.log("@insertarUsuario");

    const { nombre, correo,id_tipo_usuario, co_sucursal, hora_entrada, hora_salida,sueldo_mensual, genero } = usuarioData;

    console.log("HOIRA EN "+hora_entrada);
    console.log("HOIRA EN "+hora_salida);
    //TIPO_USUARIO.MAESTRA
    console.log(" hora entrada " + hora_entrada + " h salida " + hora_salida + " correo " + correo);
    let password = await generarRandomPassword();
    console.log("Password generado  " + password);

    let sql = `
            INSERT INTO USUARIO(NOMBRE,CORREO,CO_SUCURSAL,CAT_TIPO_USUARIO,HORA_ENTRADA,HORA_SALIDA,PASSWORD,SUELDO_MENSUAL,SUELDO_QUINCENAL,GENERO)
            VALUES(TRIM(BOTH FROM $1),TRIM($2),$3,$4,$5,$6,$7,$8::numeric,($8::numeric/2)::numeric,$9) RETURNING ID;
            `;
    return genericDao
        .execute(sql, [nombre, correo, co_sucursal,id_tipo_usuario, hora_entrada, hora_salida, password.encripted,sueldo_mensual,genero]);
};


const validarCorreoUsuario = (correo) => {
    return genericDao
        .findOne("select true from usuario where TRIM(correo) = TRIM($1) and eliminado = false", [correo]);
};

const buscarCorreo = (correo) => {
    return genericDao
        .findAll(`select * from usuario where TRIM(correo) = TRIM($1) and eliminado = false`
            , [correo]);
};


const modificarUsuario = (usuarioData) => {
    console.log("@modificarUsuario");
    console.log("usuarioDATA "+JSON.stringify(usuarioData));
    const { id,nombre, correo, hora_entrada, hora_salida,sueldo_mensual, genero } = usuarioData;

    //TIPO_USUARIO.MAESTRA
    
    let sql = `
            UPDATE USUARIO SET 
                            NOMBRE = TRIM(BOTH FROM $2),
                            CORREO = TRIM($3),
                            HORA_ENTRADA = $4,
                            HORA_SALIDA=$5,
                            MODIFICO = $6,                            
                            SUELDO_MENSUAL = $7::numeric,
                            SUELDO_QUINCENAL = ($7::numeric/2)::numeric,
                            FECHA_MODIFICO = getDate('')
            WHERE id = $1
            returning id;
            `;
    return genericDao.execute(sql, [id, nombre, correo, hora_entrada, hora_salida,genero,sueldo_mensual]);
};

const modificarContrasena = (idUsuario, usuarioData) => {
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
    return genericDao.execute(sql, [idUsuario, nuevoPassword, genero]);
};


const desactivarUsuario = (idUsuario, usuarioData) => {

    console.log("@desactivarUsuario");

    const { motivo_baja, fecha_baja, genero } = usuarioData;
    let sql = `
            UPDATE USUARIO SET 
                    ELIMINADO=true,
                    ACTIVO = FALSE,                    
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

const getSucursalesUsuario = (idUsuario)=>{
    return genericDao.findAll(
        `
        SELECT DISTINCT suc.*              
        FROM si_usuario_sucursal_rol usr inner join co_sucursal suc on usr.co_sucursal = suc.id
        WHERE usr.usuario = $1
            and usr.eliminado = false
            and suc.eliminado = false
        ORDER BY  suc.nombre DESC`

        ,[idUsuario]);
};

module.exports = {
    obtenerCorreosPorTema
    , insertarUsuario
    , modificarUsuario
    , desactivarUsuario
    , buscarUsuarioId
    , modificarContrasena
    , getUsuarioPorSucursal
    , validarCorreoUsuario
    , buscarCorreo
    , getSucursalesUsuario 
};

