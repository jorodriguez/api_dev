const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const mailService = require('../utils/NotificacionService');
const utilerias = require('./utilerias');

var bcrypt = require('bcryptjs');

const ID_PADRE = 1;
const ID_MADRE = 2;

const crearFamiliar = (request, response) => {
    console.log("@create familiar autorizado");
    try {
        validarToken(request,response);
        
        var id_alumno = request.params.id_alumno;

        const p = getParams(request.body);

        let esRegistroParaRelacionar = (p.id != null && p.id != -1 && p.id != 0);

        if (esRegistroParaRelacionar) {
            console.log("Relacionar alumno y familiar ");
            relacionarAlumnoFamilia(id_alumno, p.id, p.co_parentesco, p.genero).then((id_resolve) => {
                //response.status(200).json(id_resolve);
                response.status(200).json({ mensaje: "Familiar agregado.", estatus: true });
            }).catch((e) => {
                console.log("Excepcion al crear familia " + e);
                response.status(200).json({ mensaje: "Error al guardar el familiar.", estatus: false });
            });
        } else {

            console.log("insertar  familiar");

            utilerias.findCorreoPadre(p.correo)
                .then((encontrado) => {
                    if ((p.co_parentesco == ID_MADRE || p.co_parentesco == ID_PADRE) && encontrado) {
                        console.log("El correo ya se encuentra registrado con otro usuario.");
                        response.status(200).json({ mensaje: "El correo ya se encuentra registrado con otro usuario.", estatus: false });
                    } else {

                        console.log("iniciando el guardado del familiar ");
                        createFamiliar(id_alumno, p, p.genero).then((id_familiar) => {
                            console.log(" creado familiar");

                            relacionarAlumnoFamilia(id_alumno, id_familiar, p.co_parentesco, p.genero).then((id) => {
                                //enviar correo
                                enviarClaveFamiliar(id_familiar);
                                response.status(200).json({ mensaje: "Familiar agregado.", estatus: true });
                            }).catch((e) => {
                                console.log("Excepcion al crear familia " + e);
                                //response.status(200).json(0);
                                response.status(200).json({ mensaje: "Error al guardar el familiar.", estatus: false });
                            });

                        }).catch((e) => {
                            console.log(" Error al tratar de guardar un familiar " + e);
                            response.status(200).json({ mensaje: "Error al guardar el familiar.", estatus: false });
                        });

                    }
                }).catch((e) => {
                    console.log("Ocurrio un error al insertar al padre " + e);
                    response.status(200).json({ mensaje: "Error al guardar el familiar.", estatus: false });
                });
        }
    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const resetPasswordFamiliar = (request, response) => {
    try {
        validarToken(request,response);

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
                    console.log(JSON.stringify(results.rows));
                    let password = results.rows[0].password;

                    let hashedPassword = bcrypt.hashSync(password, 8);

                    pool.query(
                        `UPDATE co_familiar SET password = $2 
                         WHERE id = $1 
                         RETURNING (SELECT split_part(nombre, ' ', 1)) as nombre ,correo;`,                        
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
                                        "Contraseña",
                                        {
                                            titulo: "Hola " + (row.nombre != undefined ? row.nombre:"") +",",
                                            subtitulo: "Enviamos tu contraseña de acceso a la aplicación",
                                            contenido: `<strong>Usuario : </strong> ${row.correo} <br/>
                                                       <strong>Contraseña : </strong> ${password}` 
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
        
        validarToken(request,response);

        var id_familiar = request.params.id_familiar;

        const p = getParams(request.body);

        console.log("modificar familiar "+id_familiar+" correo "+p.correo);

        //validar datos
        pool
            .query('SELECT * FROM co_familiar WHERE id = $1 AND correo= $2::text AND eliminado = false', [id_familiar, p.correo])
            .then(res => {
                console.log("RESSSS "+JSON.stringify(res.rows));
                if (res != null && res.rowCount > 0) {
                    //proceder al update sin validar correo
                    updateFamiliar(id_familiar, p, p.genero).then((id) => {
                        console.log("Todo bien ");
                        response.status(200).json({ mensaje: "Se modificaron los datos.", estatus: true });
                    }).catch((e) => {
                        console.log(" Error al tratar de modificar un familiar " + e);
                        response.status(200).json({ mensaje: "Ocurrió un error al modificar el registro.", estatus: false });
                    });
                } else {
                    //cambio el correo del usuario validar que no este asignado a otro papa
                    utilerias.findCorreoPadre(p.correo)
                        .then((encontrado) => {
                        
                            console.log("ID:MADRE "+ID_MADRE+" ID_PADRE "+ID_PADRE);

                            if ((p.co_parentesco == ID_MADRE || p.co_parentesco == ID_PADRE) && encontrado) {
                                console.log("El correo ya se encuentra registrado con otro usuario.");
                                response.status(200).json({ mensaje: "El correo ya se encuentra registrado con otro usuario.", estatus: false });
                            } else {

                                updateFamiliar(id_familiar, p, p.genero).then((id) => {
                                    console.log("Todo bien ");
                                    response.status(200).json({ mensaje: "Se modificaron los datos.", estatus: true });
                                }).catch((e) => {
                                    console.log(" Error al tratar de modificar un familiar " + e);
                                    response.status(200).json({ mensaje: "Ocurrió un error al modificar el registro.", estatus: false });
                                });
                            }
                        }).catch((e) => {
                            response.status(200).json({ mensaje: "Ocurrió un error al modificar los datos del familiar.", estatus: false });
                        });
                }
            }).catch(err => console.error('Error executing query', err.stack))

    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const eliminarFamiliar = (request, response) => {
    console.log("@elimiar familiar autorizado");
    try {
        console.log("eliminar familiar");
        
        validarToken(request,response);

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

}


const eliminarRelacionarAlumnoFamilia = (id_relacion, genero) => {
    console.log("@Eliminar Relacion alumno familia " + id_relacion + "     " + genero);

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
        validarToken(request,response);

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
        validarToken(request,response);

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
    crearFamiliar,
    updateFamiliar,
    getFamiliaresAlumno,
    modificarFamiliar,
    eliminarFamiliar,
    getFamiliareParaRelacionar,
    resetPasswordFamiliar
 
}
