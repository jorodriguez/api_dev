
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const { isEmpty } = require('../helpers/Utils');
const Joi = require('@hapi/joi');

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

const actualizarAlumno = (id_alumno, id_familiar, columna, genero) => {
    console.log("@actualizar alumno en campo familiar " + id_alumno + " familiar " + id_familiar + " genero " + genero);
    try {

        if (id_familiar !== null && id_alumno !== null) {

            pool.query(
                "UPDATE CO_ALUMNO  " +
                " SET " + columna + " = $2, modifico = $3" +
                " WHERE id = $1",
                [
                    id_alumno, id_familiar, genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("error al actualizar el alumno " + error);
                        return;
                    }
                    console.log("****************************Se modifico el campo " + columna);
                });
        }

    } catch (e) {
        console.log("error al actualizar el formato en el alumno " + e);
    }
}



const crearFamiliar = (request, response) => {
    console.log("@create familiar autorizado");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        var id_alumno = request.params.id_alumno;

        const p = getParams(request.body);

        console.log(" === => " + JSON.stringify(p));

        console.log("insertando familiar");

        createFamiliar(id_alumno, p, p.genero).then((id_familiar) => {
            console.log(" creado familiar");

            relacionarAlumnoFamilia(id_alumno, id_familiar, p.co_parentesco, p.genero).then((id) => {
                response.status(200).json(id_familiar);
            }).catch((e) => {
                console.log("Excepcion al crear familia " + e);
                response.status(200).json(0);
            });

        }).catch((e) => {
            console.log(" Error al tratar de guardar un familiar " + e);
            response.status(200).json(0);
        });

    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};




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




const createPadre = (id_alumno, familiarPadre, genero) => {
    console.log("@create padre");
    try {
        console.log("Se inserta padre");
        const ID_PARENTESCO_PADRE = 1;

        createFamiliar(id_alumno, familiarPadre, genero).then((idPadre) => {

            relacionarAlumnoFamilia(id_alumno, idPadre, ID_PARENTESCO_PADRE, genero).then((id) => {
                actualizarAlumno(id_alumno, idPadre, 'co_padre', genero);
            });

        }).catch((e) => {
            console.log("Error al tratar de crear un familiar " + e);
        });

    } catch (e) {
        console.log("error al crear padres  " + e);
    }
}

const createMadre = (id_alumno, familiarMadre, genero) => {
    console.log("@create madre genera " + genero);
    try {
        const ID_PARENTESCO_MADRE = 2;
        createFamiliar(id_alumno, familiarMadre, genero).then((idMadre) => {
            console.log("Dentro de promise madre");

            relacionarAlumnoFamilia(id_alumno, idMadre, ID_PARENTESCO_MADRE, genero).then((id) => {

                actualizarAlumno(id_alumno, idMadre, 'co_madre', genero);
            });

        }).catch((e) => {
            console.log("Error al tratar de crear un familiar " + e);
        });;

    } catch (e) {
        console.log("error al crear madre  " + e);
    }
}


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
            "        p.nombre AS parentesco," +
            "        rel.co_parentesco, " +
            "        fam.*" +
            " FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id" +
            "                            inner join co_parentesco p on rel.co_parentesco = p.id" +
            " WHERE rel.co_alumno = $1 and rel.eliminado = false",
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

const getParams = (body) => {
    const parametros = {
        nombre,
        telefono, fecha_nacimiento, correo, password, celular, religion,
        nota_celebracion_dia, co_parentesco

    } = body;

    return parametros;
};


module.exports = {
    createPadre,
    createMadre,
    crearFamiliar,
    updateFamiliar,
    getFamiliaresAlumno,
    modificarFamiliar

}