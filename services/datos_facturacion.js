
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');

const guardarDatosFacturacionAlumno = (request, response) => {
    console.log("@guardarDatosFacturacionAlumno");
    try {
        //validarToken(request,response);
        
        const { id } = request.body;
        
        console.log(JSON.stringify(request.body));

        if (id != null) {
            //modificar 
            console.log("===== MODIFICAR "+id);
            modificarDatosFacturacion(request.body,response);
        } else {
            //insertar
            console.log("===== INSERTAR ");
            guardarDatosFacturacion(request.body,response);
        }

    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const guardarDatosFacturacion = (parametros,response) => {
    try {

        const {
            id_alumno,
            factura,
            rfc,
            razon_social,
            curp,
            calle,
            numero_exterior,
            colonia,
            ciudad,
            municipio,
            estado,
            codigo_postal,
            telefono_contacto,
            correo_contacto,
            genero
        } = parametros;

        pool.query(
            `
                INSERT INTO CO_DATOS_FACTURACION(
                    rfc,
                    razon_social,
                    curp,
                    calle,
                    numero_exterior,
                    colonia,
                    ciudad,
                    municipio,
                    estado,
                    codigo_postal,
                    telefono_contacto,
                    correo_contacto,
                    genero)
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id;
                `,
            [rfc, razon_social, curp, calle, numero_exterior, colonia, ciudad, municipio, estado, codigo_postal, telefono_contacto, correo_contacto, genero],
        )
            .then((results) => {

                console.log("Resultado 1" + JSON.stringify(results));
                if (results && results.rowCount > 0) {

                    actualizarDatoFacturacionAlumno(results.rows[0].id, id_alumno, factura, genero).then((res) => {
                        console.log("Resultado actualizacion en tabla alumno " + JSON.stringify(res));

                        response.status(200).json(results.rowCount);

                    }).catch((er) => {
                        handle.callbackError(er, response);
                    });
                }
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const modificarDatosFacturacion = (parametros,response) => {
    try {
        const {
            id,
            id_alumno,
            factura,
            rfc,
            razon_social,
            curp,
            calle,
            numero_exterior,
            colonia,
            ciudad,
            municipio,
            estado,
            codigo_postal,
            telefono_contacto,
            correo_contacto,
            genero
        } = parametros;

        console.log(JSON.stringify(parametros));


        pool.query(
            `
                UPDATE CO_DATOS_FACTURACION
                  SET                   
                    rfc = $2,
                    razon_social = $3,
                    curp = $4,
                    calle = $5,
                    numero_exterior = $6,
                    colonia = $7,
                    ciudad = $8,
                    municipio =  $9,
                    estado = $10,
                    codigo_postal = $11,
                    telefono_contacto = $12,
                    correo_contacto = $13,
                    modifico = $14
                 WHERE id = $1   
                 RETURNING id;
                `,
            [id,rfc, razon_social, curp, calle, numero_exterior, colonia, ciudad, municipio, 
             estado, codigo_postal, telefono_contacto, correo_contacto, genero],
        )
            .then((results) => {
                if (results && results.rowCount > 0) {

                    actualizarRequiereFacturaAlumno(id_alumno, factura, genero).then((res) => {

                        console.log("Se guardo el registro de factura");
                        response.status(200).json(results.rowCount);

                    }).catch((er) => {
                        console.log("Sucedio algun error al modificar el registro de alumno " + er);
                        handle.callbackError(er, response);
                    });
                }
            }).catch((e) => {
                console.log("Sucedio algun error al guardar el registro de factura");
                handle.callbackError(e, response);
            });

    } catch (e) {
        console.log("Sucedio algun error al guardar el registro de factura NO CONTROLADO "+e);
        handle.callbackErrorNoControlado(e, response);
    }
};

const actualizarDatoFacturacionAlumno = (id_dato_facturacion, id_alumno, factura, id_genero) => {
    console.log("@actualizarDatoFacturacionAlumno id_dato_factu" + id_dato_facturacion + " id_alumno" + id_alumno + " genero " + id_genero);
    try {
        return pool.query(`
            UPDATE co_alumno 
                SET co_datos_facturacion = $2,
                factura = $3,
                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                modifico = $4
            WHERE id = $1 ;
            `, [id_alumno, id_dato_facturacion, factura, id_genero]
        );  
    } catch (e) {
        console.log(" error al actualizar el valor de requiere factura  " + e);
        handle.callbackErrorNoControlado(e, response);
    } 
};


const actualizarRequiereFacturaAlumno = (id_alumno, factura, id_genero) => {
    console.log("@actualizarRequiereFacturaAlumno ");
    try {
        return pool.query(`
            UPDATE co_alumno 
                SET factura= $2,                
                fecha_modifico = (getDate('')+getHora(''))::timestamp,
                modifico = $3
            WHERE id = $1 ;
            `, [id_alumno, factura, id_genero]
        );
    } catch (e) {
        console.log(" error al actualizar el valor de requiere factura  " + e);
    }
};



const actualizarRequiereFacturacionAlumno = (request, response) => {
    console.log("@actualizarRequiereFacturacionAlumno");
    try {
        //validarToken(request,response);

        const { id_alumno,factura,genero } = request.body;
        
        console.log(JSON.stringify(request.body));

        actualizarRequiereFacturaAlumno(id_alumno, factura, genero).then((results) => {

            console.log("Se modifico el estatus de factura en alumno");
            response.status(200).json(results.rowCount);

        }).catch((er) => {
            console.log("Sucedio algun error al modificar el registro de alumno " + er);
            handle.callbackError(er, response);
        });
       
    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


module.exports = {
    guardarDatosFacturacionAlumno,
    actualizarRequiereFacturaAlumno,
    actualizarRequiereFacturacionAlumno
}