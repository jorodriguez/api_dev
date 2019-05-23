
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
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
    console.log("@actualizar alumno en campo familiar");
    try {

        if (id_familiar != null && id_alumno !== null) {

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
                    console.log("Se modifico el campo " + columna);
                });
        }

    } catch (e) {
        console.log("error al actualizar el formato en el alumno " + e);
    }
}

const createPadre = (id_alumno, familiarPadre, genero) => {
    console.log("@create padre");
    try {
        console.log("Se inserta padre");
        const idPadre = createFamiliar(id_alumno, familiarPadre, genero);
        if (idPadre != null) {
            actualizarAlumno(id_alumno, idPadre, 'co_padre', genero);
        }

    } catch (e) {
        console.log("error al crear padres  " + e);
    }
}

const createMadre = (id_alumno, familiarMadre, genero) => {
    console.log("@create madre genera "+genero);
    try {
        const idMadre = createFamiliar(id_alumno, familiarMadre, genero);
        if (idMadre != null) {
            actualizarAlumno(id_alumno, idMadre, 'co_madre', genero);
        }

    } catch (e) {
        console.log("error al crear madre  " + e);
    }
}


const createFamiliar = (id_alumno, familiar, genero) => {
    console.log("@create Familiar");
    try {

        console.log(" ID ALUMNO = " + id_alumno);
        console.log(" genero "+genero);
        if (id_alumno == null) {
            console.log("no se procede a crear el familiar faltan datos");
            throw error("id_alumn =es null ");
        }

        if (familiar == null) {
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

        var id_retorno = null;

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
                    return false;
                }

                if (results.rowCount > 0) {
                    id_retorno = results.rows[0].id;
                    console.log("se procede a relacionar alumno familiar");
                    relacionarAlumnoFamilia(id_alumno, id_retorno, genero);
                }

                return id_retorno;
            })

    } catch (e) {
        console.log("error al guardar el familiar " + e);
        return null;
    }
};


const relacionarAlumnoFamilia = (id_alumno, id_familiar, genero) => {
    console.log("@Relacion alumno familia");
    try {

        if (id_familiar != null) {

            pool.query(
                "INSERT INTO CO_ALUMNO_FAMILIAR(co_alumno,co_familiar,genero) " +
                "  VALUES($1,$2,$3) ",
                [
                    id_alumno, id_familiar, genero
                ],
                (error, results) => {
                    if (error) {
                        console.log("error al insertar la relacion alumno familia " + error);
                        return;
                    }
                    console.log("Se agrego la relacion alumno familia ");
                });
        }

    } catch (e) {
        console.log("error al guardar la realacion alumno materia " + e);
    }
}

const updateFamiliar = (id_familiar, familiar, genero) => {
    console.log("@updateFamiliar");
    try {

        const p = getParams(familiar);

        pool.query(
            "  UPDATE co_familiar SET " +
            " nombre = $2, telefono = $3,fecha_nacimiento = $4,correo,password = $5," +
            " celular = $6,religion = $7, nota_celebracion = $8,modifico = $9)" +
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
                    return false;
                }
                return true;
            })
    } catch (e) {
        console.log("ERROR " + e);
        //handle.callbackErrorNoControlado(e, response);
        console.log("Error al actualizar el familiar " + e);
        return false;
    }
};

const getParams = (body) => {
    const parametros = {
        nombre,
        telefono, fecha_nacimiento, correo, password, celular, religion,
        nota_celebracion_dia

    } = body;

    return parametros;
};


module.exports = {
    createPadre,
    createMadre,
    updateFamiliar

}