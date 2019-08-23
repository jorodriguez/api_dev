
const { dbParams } = require('../config/config');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config/config');
const handle = require('../helpers/handlersErrors');

const helperToken = require('../helpers/helperTokenMovil');


const Pool = require('pg').Pool;
const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

// GET a Login 
const loginCliente = (request, response) => {

    console.log("En el login del cliente  ");
    try {
        const { correo, password } = request.body;
        console.log("correo " + correo + " " + password);
        pool.query(
            `
            select 
            f.id,
            f.nombre,
            f.telefono,
            f.fecha_nacimiento,
            f.correo,
            f.celular,
            f.religion,
            f.password,
            f.token,            
            f.recibir_notificacion_actividad,
			f.recibir_notificacion_pagos,
			f.recibir_notificacion_avisos,
            count(rel.id) as numero_hijos
        FROM co_familiar f left join co_alumno_familiar rel on rel.co_familiar = f.id and co_parentesco in (1,2)  
        where correo =  $1            
            and f.eliminado= false
            and rel.eliminado = false
        group by f.id

            `,
            [correo],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                console.log(JSON.stringify(results));

                if (results.rowCount > 0) {

                    var usuario = results.rows[0];

                    if (usuario.password != null && usuario.password != undefined && usuario.password != '') {

                        console.log("usuario login movil " + JSON.stringify(usuario));

                        var passwordIsValid = bcrypt.compareSync(password, usuario.password);

                        if (!passwordIsValid) return response.status(401).send({ auth: false, token: null, usuario: null, mensaje: "Usuario no encontrado." });

                        var token = jwt.sign({ id: results.id }, config.secret, {
                            expiresIn: 86400 // expires in 24 hours
                        });

                        response.status(200).send({ auth: true, token: token, usuario: usuario });
                    } else { 

                        response.status(400).send({ auth: false, token: null, usuario: null,mensaje:"Existe un detalle con su registro, se recomienda notificar este mensaje a la sucursal." });    
                    }

                } else {

                    response.status(400).send({ auth: false, token: null, usuario: null });
                }
            });

    } catch (e) {

        // response.status(400).send({ auth: false, token: null });
        handle.callbackErrorNoControlado(e, response);
    }
};


const cambioClaveFamiliar = (request, response) => {
    console.log("@cambioClaveFamiliar");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_familiar = request.params.id_familiar;

        const { password, password_nuevo, correo } = request.body;

        console.log("id_familiar " + id_familiar);

        pool.query(
            `
            select 
                f.id,
                f.password         
            FROM co_familiar f
            where f.id = $1
        	      and f.correo = $2
                and f.eliminado= false
            `,
            [id_familiar, correo],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                console.log(JSON.stringify(results));

                if (results.rowCount > 0 && password_nuevo != "" && password_nuevo != undefined) {

                    var usuario = results.rows[0];

                    var passwordIsValid = bcrypt.compareSync(password, usuario.password);

                    if (!passwordIsValid) {
                        return response.status(401).send({ auth: false, mensaje: "La contraseña no es válida." });
                    } else {

                        var hashedPassword = bcrypt.hashSync(password_nuevo, 8);

                        console.log("Proceder al update de la clave");

                        console.log("hashedPassword " + hashedPassword);

                        pool.query("UPDATE co_familiar SET " +
                            " password = $2, " +
                            " fecha_modifico = (getDate('')+getHora(''))::timestamp " +
                            " WHERE id = $1",
                            [id_familiar, hashedPassword],
                            (error, results) => {
                                if (error) {
                                    console.log("Error al cambiar el pass del  familiar " + error);
                                    handle.callbackError(error, response);
                                    return;
                                }
                                console.log("Se cambio el pass del familiar");
                                response.status(200).send({ auth: true, mensaje: "Contraseña actualizada." });
                            });
                    }
                } else {
                    response.status(400).send({ auth: false, mensaje: "No se encotró el usuario." });
                }
            });

    } catch (e) {
        console.log("Error al actualizar los datos del familiar " + e);
        handle.callbackErrorNoControlado(e, response);
    }
}

const encriptar = (request, response) => {

    var pass = request.params.clave;

    var hashedPassword = bcrypt.hashSync(pass, 8);
    /*    var hashedPassword="sin hash";
    
        console.log("Clave "+pass);
    
        bcrypt.hash(pass, 8, function(err, hash) {
            // Store hash in your password DB.
    
            hashedPassword = hash;
            console.log(""+hash);
            console.log("error "+err);
        
        });
    */

    response.status(400).send(hashedPassword);
}

module.exports = {
    loginCliente,
    cambioClaveFamiliar
};