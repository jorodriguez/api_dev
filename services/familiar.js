
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const Joi = require('@hapi/joi');
const mailService = require('../utils/MailService');

var bcrypt = require('bcryptjs');

const config = require('../config/config');
const jwt = require('jsonwebtoken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


const crearFamiliar = (request, response) => {
    console.log("@create familiar autorizado");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_alumno = request.params.id_alumno;

        const p = getParams(request.body);

        console.log(JSON.stringify(p));

        if (p.id != null && p.id != -1 && p.id != 0) {
            console.log("Relacionar alumno y familiar ");

            relacionarAlumnoFamilia(id_alumno, p.id, p.co_parentesco, p.genero).then((id_resolve) => {
                enviarClaveFamiliar(id_familiar);
                response.status(200).json(id_resolve);
            }).catch((e) => {
                console.log("Excepcion al crear familia " + e);
                response.status(200).json(0);
            });
        } else {

            console.log("insertar  familiar");

            createFamiliar(id_alumno, p, p.genero).then((id_familiar) => {
                console.log(" creado familiar");

                relacionarAlumnoFamilia(id_alumno, id_familiar, p.co_parentesco, p.genero).then((id) => {
                    //enviar correo
                    enviarClaveFamiliar(id_familiar);
                    response.status(200).json(id_familiar);
                }).catch((e) => {
                    console.log("Excepcion al crear familia " + e);
                    response.status(200).json(0);
                });

            }).catch((e) => {
                console.log(" Error al tratar de guardar un familiar " + e);
                response.status(200).json(0);
            });
        }
    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const resetPasswordFamiliar = (request, response) => {
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_familiar = request.params.id_familiar;

        enviarClaveFamiliar(id_familiar);

        response.status(200).json(id_familiar);

    } catch (e) {
        console.log("Error al reseterar la clave " + e);
        handle.callbackErrorNoControlado(e, response);
    }
}

const enviarClaveFamiliar = (id_familiar) => {
    try {

        pool.query(
            `
                SELECT pass||(random() * 5000 + 1)::int AS password FROM random_pass  ORDER BY random() LIMIT 1;
            `,
            (error, results) => {
                if (results.rowCount > 0) {
                    console.log(JSON.stringify( results.rows));
                    let password = results.rows[0].password;

                    let hashedPassword = bcrypt.hashSync(password, 8);

                    pool.query(
                        `
                            UPDATE co_familiar SET password = $2 WHERE id = $1 RETURNING nombre,correo;            
                        `,
                        [id_familiar, hashedPassword],
                        (error, results) => {
                            if (error) {
                                console.log("Error al actualizar el familiar " + error);
                                return;
                            }

                            if (results.rowCount > 0) {
                                let row = results.rows[0];
                                //enviar correo
                                mailService
                                    .enviarCorreoClaveFamiliar(
                                        row.correo,
                                        "Magic Intelligence",
                                        {
                                            titulo: "Hola " + row.nombre + " bienvenido a la familia Magic Intelligence",
                                            subtitulo: "Te enviamos tu contraseña de acceso",
                                            contenido: " Contraseña : " + password
                                        }
                                    );
                            }

                        });
                }
            });
    } catch (e) {
        console.log("Fallo al enviar el correo de la clave " + e);
        //handle.callbackErrorNoControlado(e, response);
        return;
    }
}


const modificarFamiliar = (request, response) => {
    console.log("@modificar familiar autorizado");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_familiar = request.params.id_familiar;

        const p = getParams(request.body);

        console.log("modificar familiar");

        updateFamiliar(id_familiar, p, p.genero).then((id) => {
            console.log("Todo bien ");
            response.status(200).json(id);
        }).catch((e) => {
            console.log(" Error al tratar de modificar un familiar " + e);
            response.status(200).json(0);
        });


    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const eliminarFamiliar = (request, response) => {
    console.log("@elimiar familiar autorizado");
    try {
        console.log("eliminar familiar");
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_relacion = request.params.id_relacion;

        if (id_relacion == null || id_relacion == undefined) {
            handle.callbackError("id_relacion es null", response);
            return;
        }

        const { id, genero } = request.body;

        console.log("eliminar familiar" + JSON.stringify(request.body));

        return new Promise((resolve, reject) => {

            pool.query(
                "  UPDATE co_familiar SET " +
                "  modifico = $2,fecha_modifico = (getDate('')+getHora(''))::timestamp," +
                "  eliminado = true " +
                "  WHERE id = $1  ",
                [
                    id,
                    genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("Error al actualizar el familiar " + error);
                        reject(null);
                        return;
                    }
                    resolve(id);
                });
        }).then((id) => {
            //eliminar relacion
            eliminarRelacionarAlumnoFamilia(id_relacion, genero).then((id_rel) => {
                response.status(200).json(id);
            }).catch((error) => {
                console.error("erorr al elimiar la relacion con la familia " + error);
                response.status(200).json(null);
            });;
        }).catch((error) => {
            console.error("erorr al elimiar el familiar " + error);
            response.status(200).json(null);
        });

    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const createFamiliar = (id_alumno, familiar, genero) => {
    console.log("@create Familiar");
    try {

        console.log(" ID ALUMNO = " + id_alumno);
        console.log(" genero " + genero);

        if (id_alumno == null) {
            console.log("no se procede a crear el familiar faltan datos");
            throw error("id_alumn =es null ");
        }

        console.log("Familiar en create familia " + JSON.stringify(familiar));

        if (familiar == null || isEmpty(familiar)) {
            console.log("Se genera un registro en empty");
            familiar = {
                nombre: "",
                telefono: "",
                fecha_nacimiento: null,
                correo: "",
                password: "",
                celular: "",
                religion: "",
                nota_celebracion_dia: ""
            };
        }
        const p = getParams(familiar);
        console.log(" ==== " + JSON.stringify(p));
        var id_retorno = null;

        return new Promise((resolve, reject) => {
            pool.query(
                "  INSERT INTO co_familiar(nombre,telefono,fecha_nacimiento,correo,password,celular,religion,nota_celebracion_dia,genero)" +
                " VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id ",
                [
                    p.nombre, p.telefono, p.fecha_nacimiento, p.correo, p.password, p.celular, p.religion,
                    p.nota_celebracion_dia,
                    genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("Error al guardar el familiar " + error);
                        reject(false);
                    }

                    if (results.rowCount > 0) {

                        id_retorno = results.rows[0].id;

                        console.log("se procede a relacionar alumno familiar");

                        console.log("Retornando el id del Familiar " + id_retorno);

                        resolve(id_retorno);
                    } else {
                        reject(false);
                    }
                })
        });

    } catch (e) {
        console.log("error al guardar el familiar " + e);
        return null;
    }
};

const relacionarAlumnoFamilia = (id_alumno, id_familiar, id_parentesco, genero) => {
    console.log("@Relacion alumno familia");

    //try {
    return new Promise((resolve, reject) => {

        if (id_familiar != null) {

            pool.query(
                "INSERT INTO CO_ALUMNO_FAMILIAR(co_alumno,co_familiar,co_parentesco,genero) " +
                "  VALUES($1,$2,$3,$4)",
                [
                    id_alumno, id_familiar, id_parentesco, genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("error al insertar la relacion alumno familia " + error);
                        reject(null);
                        return;
                    }

                    console.log("Se agrego la relacion alumno familia ");
                    resolve(id_familiar);
                });

        } else {
            reject(null);
        }
    });

    /*} catch (e) {
        console.log("error al guardar la realacion alumno materia " + e);

    }*/
}


const eliminarRelacionarAlumnoFamilia = (id_relacion, genero) => {
    console.log("@Eliminar Relacion alumno familia " + id_relacion + "     " + genero);

    //try {
    return new Promise((resolve, reject) => {

        if (id_relacion != null) {

            pool.query(
                "UPDATE CO_ALUMNO_FAMILIAR SET eliminado = true, modifico = $2, fecha_modifico = (getDate('')+getHora(''))::timestamp " +
                " WHERE id= $1",
                [
                    id_relacion, genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("error al eliminar la relacion alumno familia " + error);
                        reject(null);
                        return;
                    }

                    console.log("Se elimino la relacion alumno familia ");
                    resolve(id_relacion);
                });

        } else {
            reject(null);
        }
    });

    /*} catch (e) {
        console.log("error al guardar la realacion alumno materia " + e);

    }*/
}


const updateFamiliar = (id_familiar, familiar, genero) => {
    console.log("@updateFamiliar");
    try {

        return new Promise((resolve, reject) => {
            const p = getParams(familiar);

            console.log("PARAMS " + JSON.stringify(p));

            pool.query(
                "  UPDATE co_familiar SET " +
                "  nombre = $2, telefono = $3,fecha_nacimiento = $4,correo=$5,password = $6," +
                "  celular = $7,religion = $8, nota_celebracion_dia = $9," +
                "  modifico = $10" +
                " WHERE id = $1  ",
                [
                    id_familiar,
                    p.nombre, p.telefono, p.fecha_nacimiento, p.correo, p.password, p.celular, p.religion,
                    p.nota_celebracion_dia,
                    genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("Error al actualizar el familiar " + error);
                        reject(null);
                        return;
                    }
                    resolve(id_familiar);

                    //return true;
                });
        });

    } catch (e) {
        console.log("ERROR " + e);
        //handle.callbackErrorNoControlado(e, response);
        console.log("Error al actualizar el familiar " + e);
        return false;
    }
};




const getFamiliaresAlumno = (request, response) => {
    console.log("@getFamiliaresAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_alumno = request.params.id_alumno;

        pool.query(
            " SELECT rel.id as id_relacion," +
            "   p.nombre AS parentesco," +
            "   p.sistema," +
            "   rel.co_parentesco, 		" +
            "   rel.autorizado_para_entrega," +
            "   rel.orden_autorizado_para_entrega," +
            "   rel.orden_aviso_emergencia," +
            "   rel.envio_avisos," +
            "   rel.envio_recibos," +
            "   fam.*" +
            " FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id" +
            "                            inner join co_parentesco p on rel.co_parentesco = p.id" +
            " WHERE rel.co_alumno = $1 and rel.eliminado = false and fam.eliminado = false",
            [id_alumno],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getFamiliareParaRelacionar = (request, response) => {
    console.log("@getFamiliaresConApellidosParecidos");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const SPLIT_APELLIDO_PATERNO = 2;
        const SPLIT_APELLIDO_MATERNO = 3;

        //saber si es familiar directo
        var id_parentesco = request.params.id_parentesco;
        var id_sucursal = request.params.id_sucursal;
        var apellidos_alumno = request.params.apellidos_alumno;
        var split_apellido_padre = (id_parentesco == 1 ? SPLIT_APELLIDO_PATERNO : SPLIT_APELLIDO_MATERNO);
        var split_apellido_alumno = (id_parentesco == 1 ? 1 : 2);

        console.log("Params "
            + " suc " + id_sucursal
            + " split padre " + split_apellido_padre
            + " apellidos alum " + apellidos_alumno
            + " split alumno " + split_apellido_alumno
            + " id_parentesco " + id_parentesco
        );
        pool.query(
            `
            select               
                string_agg(SPLIT_PART(a.nombre,' ',1),' / ') as alumno_hijo,
                parentesco.nombre as parentesco,
                LOWER(SPLIT_PART(f.nombre,' ',$2)) like LOWER('%'||SPLIT_PART($3::text,' ',$4)||'%') AS posible_padre,                
                f.id, 
                f.nombre,
                f.telefono,
                f.fecha_nacimiento,
                f.correo,
                f.celular,
                f.religion,
                f.recibir_notificacion_actividad,
                f.recibir_notificacion_pagos,
                f.recibir_notificacion_avisos
            from co_familiar f inner join co_alumno_familiar rel on f.id = rel.co_familiar				
                       inner join co_alumno a on rel.co_alumno = a.id
                       inner join co_parentesco parentesco on rel.co_parentesco = parentesco.id
            where  a.co_sucursal = $1 
                AND rel.co_parentesco = $5
                AND f.eliminado  = false		
                AND rel.eliminado = false 	
            GROUP BY  parentesco.nombre,rel.co_parentesco,f.nombre,f.id
            ORDER BY posible_padre DESC
           `,
            [id_sucursal, split_apellido_padre, apellidos_alumno, split_apellido_alumno, id_parentesco],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};




const getParams = (body) => {
    const parametros = {
        nombre,
        telefono, fecha_nacimiento, correo, password, celular, religion,
        nota_celebracion_dia, co_parentesco

    } = body;

    return parametros;
};


module.exports = {
    //    createPadre,
    //    createMadre,
    crearFamiliar,
    updateFamiliar,
    getFamiliaresAlumno,
    modificarFamiliar,
    eliminarFamiliar,
    getFamiliareParaRelacionar,
    resetPasswordFamiliar
}
