
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


const guardarDatosFacturacionAlumno = (request, response) => {
    console.log("@guardarDatosFacturacionAlumno");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

       const { id } = request.body;
                
       if(id){
          //modificar 
          modificarDatosFacturacion(request.body);
       }else{
           //insertar
           guardarDatosFacturacion(request.body);
       }

    } catch (e) {

        handle.callbackErrorNoControlado(e, response);
    }
};


const guardarDatosFacturacion = (parametros) => {
    try {

        const {
            id_alumno,
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

                    actualizarDatoFacturacionAlumno(results.rows[0].id, id_alumno, genero).then((res) => {
                        console.log("Resultado actualizacion en tabla alumno " + JSON.stringify(res));

                        response.status(200).json(results.rowCount);

                    }).catch((er) => {
                        handle.callbackErrorNoControlado(er, response);
                    });
                }
            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const modificarDatosFacturacion = (parametros) => {
    try {

        const {            
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
                UPDATE CO_DATOS_FACTURACION
                  SET 
                    rfc = $2,
                    razon_social = $3,
                    curp = $4,
                    calle = $5,
                    numero_exterior = $6,
                    colonia,ciudad = $7,
                    municipio =  $8,
                    estado = $9,
                    codigo_postal = $10,
                    telefono_contacto = $11,
                    correo_contacto = $12,
                    modifico = $13
                 WHERE id = $1   
                 RETURNING id;
                `,
            [rfc, razon_social, curp, calle, numero_exterior, colonia, ciudad, municipio, estado, codigo_postal, telefono_contacto, correo_contacto, genero],
        )
            .then((results) => {               
                
                response.status(200).json(results.rowCount);

            }).catch((e) => {
                handle.callbackErrorNoControlado(e, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};



const actualizarDatoFacturacionAlumno = (id_dato_facturacion, id_alumno, id_genero) => {
    console.log("@actualizarDatoFacturacionAlumno id_dato_factu" + id_dato_facturacion + " id_alumno" + id_alumno + " genero " + id_genero);
    try {
        return pool.query(`
            UPDATE co_alumno 
                SET co_datos_facturacion = $2,
                fecha_modifico = (getDate('')+getHora(''))::timestamp
                modifico = $3
            WHERE id = $1 ;
            `, [id_alumno, id_dato_facturacion, id_genero]
        );
    } catch (e) {
        console.log(" error al actualizar la relacion en alumno  " + e);
    }
};


module.exports = {
    guardarDatosFacturacionAlumno
}