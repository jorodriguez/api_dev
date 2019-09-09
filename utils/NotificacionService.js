
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const { configuracion } = require('../config/ambiente');
const nodemailer = require('nodemailer');
const handle = require('../helpers/handlersErrors');
const helperToken = require('../helpers/helperToken');
const mustache = require('mustache');
var fs = require('fs');
var path = require('path');
const mensajeria = require('../services/mensajesFirebase');



const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

//Params [id_alumno]
const QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO =
    `SELECT  	a.id,
                a.nombre as nombre_alumno,		 
                string_agg(split_part(fam.nombre,' ',1),' / ') AS nombres_padres,    
                array_to_json(array_agg(to_json(fam.correo))) AS correos, 
                array_to_json(array_agg(to_json(fam.token))) as tokens
     FROM co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                            inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                            inner join co_alumno a on a.id = rel.co_alumno
    WHERE co_alumno = ANY($1::int[]) --and envio_recibos
            and co_parentesco in (1,2) -- solo papa y mama
            and fam.eliminado = false 
            and rel.eliminado = false
    group by a.nombre,a.id `;

const mailOptions = {
    from: 'joel@magicintelligence.com',
    cc: 'joel@magicintelligence.com'
};

const transporter = nodemailer.createTransport({
    host: 'mail.magicintelligence.com',
    port: 465,
    secureConnection: false,
    auth: {
        user: 'joel@magicintelligence.com',
        pass: 'Secreta.03'
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

const enviarCorreoTest = (request, response) => {
    console.log("Enviando correo de prueba ");
    const mailData = {
        from: mailOptions.from,
        //to: 'joel.rod.roj@hotmail.com',
        to: 'joel@magicintelligence.com',
        subject: 'Test',
        html: "<h3>Test</h3>"
    };
    try {
        transporter.sendMail(mailData, function (error, info) {
            if (error) {
                console.log("Error al enviar correo : " + error);
            } else {
                console.log(JSON.stringify(info));
                console.log('Email sent: ' + info.response);
            }
        });

        transporter.close();

        response.status(200).json({ envio: "Ok" });
        console.log("Enviado OK");
    } catch (e) {
        console.log("Error " + e);
        transporter.close();
    }
};



const notificarCargo = (id_alumno, id_cargo) => {
    console.log("notificarCargo " + id_alumno + "    " + id_cargo);
    //ir por alumno
    pool.query(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [[id_alumno]],
        (error, results) => {
            if (error) {
                return;
            }
            if (results.rowCount > 0) {
                let row = results.rows[0];
                enviarNotificacionCargo(row.correos, row.tokens, row.nombres_padres, id_pago, nombre_alumno);
            } else {
                console.log("No se encontraron registros de padres para el alumno " + id_alumno);
            }
        });
};

//Aqui me quede
function enviarNotificacionCargo(lista_correos, lista_tokens, nombres_padres, id_cargo, nombre_alumno) {

    pool.query(` select cat.nombre,		
                    cat.precio,
                    cargo.fecha,
                    cargo.cantidad,
                    cargo.total, 
                    cargo.nota
                from co_cargo_balance_alumno cargo inner join cat_cargo cat on cat.id = cargo.cat_cargo
                where cargo.id = $1 and cargo.eliminado = false
            `, [id_cargo],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];
                let tituloCorreo = "Cargo " + row.nombre;
                let titulo_mensaje = "Cargo de " + row.nombre;
                let cuerpo_mensaje = "Hola, se realizó un cargo de " + row.total + " por " + row.nombre + " del alumno " + nombre_alumno + ".";

                console.log("Enviando correo a " + JSON.stringify(lista_correos));
                enviarCorreoReciboPago(
                    lista_correos,
                    tituloCorreo,
                    {
                        titulo: "Magic Intelligence",
                        nombre_empresa: "Magic Intelligence",
                        nombre_cliente: nombres_padres,
                        pago: {
                            fecha: row.fecha,
                            pago: row.pago,
                            forma_pago: row.forma_pago,
                            factura: row.identificador_factura,
                            numero_cargos: row.count_cargos,
                            cargos: row.cargos
                        },
                        alumno: {
                            nombre: row.nombre_alumno,
                            apellidos: row.apellidos_alumno,
                            grupo: row.nombre_grupo
                        },
                        sucursal: {
                            nombre: row.nombre_sucursal,
                            direccion: row.direccion_sucursal
                        },
                        mensaje_pie: "Agradecemos tu confianza. <br/> Atentamente Magic Intelligence."
                    });

                //enviar mensaje te text
                if (lista_tokens != null && lista_tokens != [] && lista_tokens.length > 0) {
                    console.log("Enviando msj al token " + lista_tokens);
                    mensajeria.enviarMensajeToken(lista_tokens, titulo_mensaje, cuerpo_mensaje);
                } else { console.log("No existen tokens registraods "); }

            }
        });
}



const notificarReciboPago = (id_alumno, id_pago) => {
    console.log("notificarReciboPago " + id_alumno + "    " + id_pago);
    //ir por alumno
    pool.query(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [[id_alumno]],
        (error, results) => {
            if (error) {
                return;
            }
            if (results.rowCount > 0) {
                let row = results.rows[0];
                enviarReciboComplemento(row.correos, row.tokens, row.nombres_padres, id_pago);
            } else {
                console.log("No se encontraron registros de padres para el alumno " + id_alumno);
            }
        });
};

function enviarReciboComplemento(lista_correos, lista_tokens, nombres_padres, id_pago) {

    pool.query(`        
            WITH relacion_cargos AS (
	            SELECT  cargo.id,
			        rel.pago,
			        cat.nombre as nombre_cargo,			
			        cargo.pagado,
			        cargo.nota as nota_cargo,
			        cargo.cantidad,
			        cargo.cargo,
			        cargo.total,
			        cargo.total_pagado			
		        FROM co_pago_cargo_balance_alumno rel inner join co_cargo_balance_alumno cargo on rel.co_cargo_balance_alumno = cargo.id									
												inner join cat_cargo cat on cat.id = cargo.cat_cargo												
 		        WHERE rel.co_pago_balance_alumno = $1 and cargo.eliminado = false
            ) select pago.id,
 		            pago.pago,
		            fpago.nombre as forma_pago,
                    pago.identificador_factura,
		            TO_CHAR(pago.fecha, 'dd-mm-yyyy') as fecha,
		            grupo.nombre as nombre_grupo,
		            al.nombre as nombre_alumno,
		            al.apellidos as apellidos_alumno,
		            suc.nombre as nombre_sucursal,
		            suc.direccion as direccion_sucursal,		
		            count(cargo.id) as count_cargos,		
                    array_to_json(array_agg(to_json(cargo.*))) AS cargos
                from co_pago_balance_alumno pago inner join co_pago_cargo_balance_alumno rel on pago.id = rel.co_pago_balance_alumno
    								inner join relacion_cargos cargo on rel.co_cargo_balance_alumno = cargo.id
									inner join co_forma_pago fpago on fpago.id = pago.co_forma_pago
									inner join co_balance_alumno bal on pago.co_balance_alumno = bal.id
									inner join co_alumno al on al.co_balance_alumno = bal.id
									inner join co_grupo grupo on al.co_grupo = grupo.id
									inner join co_sucursal suc on al.co_sucursal = suc.id									
	            where pago.id = $2
                group by pago.id,fpago.nombre,al.nombre,al.apellidos,grupo.nombre,suc.nombre,suc.direccion 
          `, [id_pago, id_pago],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];
                let tituloCorreo = "Recibo de pago ✔";
                let titulo_mensaje = "Pago realizado ✔";
                let cuerpo_mensaje = "Hola, recibimos un pago correspondiente a " + row.count_cargos + " cargos del alumno "
                    + row.nombre_alumno + ", enviamos el recibo de pago a su correo registrado.";
                console.log("Enviando correo a " + JSON.stringify(lista_correos));
                //console.log("info "+JSON.stringify(row));
                enviarCorreoReciboPago(
                    lista_correos,
                    tituloCorreo,
                    {
                        titulo: "Magic Intelligence",
                        nombre_empresa: "Magic Intelligence",
                        nombre_cliente: nombres_padres,
                        pago: {
                            fecha: row.fecha,
                            pago: row.pago,
                            forma_pago: row.forma_pago,
                            factura: row.identificador_factura,
                            numero_cargos: row.count_cargos,
                            cargos: row.cargos
                        },
                        alumno: {
                            nombre: row.nombre_alumno,
                            apellidos: row.apellidos_alumno,
                            grupo: row.nombre_grupo
                        },
                        sucursal: {
                            nombre: row.nombre_sucursal,
                            direccion: row.direccion_sucursal
                        },
                        mensaje_pie: "Agradecemos tu confianza. <br/> Atentamente Magic Intelligence."

                    });

                //enviar mensaje te text
                if (lista_tokens != null && lista_tokens != [] && lista_tokens.length > 0) {
                    console.log("Enviando msj al token " + lista_tokens);
                    mensajeria.enviarMensajeToken(lista_tokens, titulo_mensaje, cuerpo_mensaje);
                } else { console.log("No existen tokens registraods "); }

            }
        });
}



const enviarCorreoReciboPago = (para, asunto, params) => {
    console.log("@enviarCorreoReciboPago");

    loadTemplateReciboPago(params)
        .then((renderHtml) => {

            if (renderHtml != null) {

                const mailData = {
                    from: mailOptions.from,
                    cc: mailOptions.cc,
                    to: para,
                    subject: asunto,
                    html: renderHtml
                };

                transporter.sendMail(mailData, function (error, info) {
                    if (error) {
                        console.log("Error al enviar correo : " + error);
                    } else {
                        console.log(JSON.stringify(info));
                        console.log('Email sent: ' + info.response);
                    }
                });

                transporter.close();
            } else {
                console.log("No se envio el correo");
            }
        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
};

function loadTemplateReciboPago(param) {
    var html = null;
    return new Promise((resolve, reject) => {
        try {
            console.log("loadTemplateReciboPago");
            fs.readFile(path.resolve(__dirname, "../templates/recibo_pago.html"), 'utf8', (err, data) => {
                html = mustache.to_html(data, param);
                resolve(html);
            });
        } catch (e) {
            reject(e);
        }
    });
}


// no se usa aun
const enviarCorreoCambioSucursal = (para, asunto, params) => {
    console.log("@enviarCorreoCambioSucursalComplemento");

    loadTemplateGenerico(params)
        .then((renderHtml) => {
            console.log("Dentro de la promesa resuelta");
            if (renderHtml != null) {

                const mailData = {
                    from: mailOptions.from,
                    to: para,
                    cc: mailOptions.cc,
                    subject: asunto,
                    html: renderHtml
                };

                transporter.sendMail(mailData, function (error, info) {
                    if (error) {
                        console.log("Error al enviar correo : " + error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }
                });

                transporter.close();
            } else {
                console.log("No se envio el correo");
            }
        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
            transporter.close();
        });
};



// no se usa aun
const enviarCorreoClaveFamiliar = (para, asunto, params) => {
    console.log("@enviarCorreoClaveFamiliar");

    pool
        .query('select link_descarga_app_android from configuracion limit 1')
        .then(res => {
            let row;
            if (res.rowCount > 0) {
                row = res.rows[0];
            }
            params.url_descarga_app = row.link_descarga_app_android;

            console.log(JSON.stringify(row));

            loadTemplateGenerico(params)
                .then((renderHtml) => {
                    console.log("Dentro d");
                    if (renderHtml != null) {

                        const mailData = {
                            from: mailOptions.from,
                            to: para,
                            cc: mailOptions.cc,
                            subject: asunto,
                            html: renderHtml
                        };

                        transporter.sendMail(mailData, function (error, info) {
                            if (error) {
                                console.log("Error al enviar correo : " + error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });

                        transporter.close();
                    } else {
                        console.log("No se envio el correo");
                    }
                }).catch(e => {
                    console.log("Excepción en el envio de correo : " + e);
                });
        }).catch((e) => {
            console.log("Excepción en el envio de correo : " + e);
        });
};


//mejorar esto param = {titulo:"",subtitulo:"",contenido:""}
function loadTemplateGenerico(params) {
    var html = null;
    //fixme : ir a la bd
    params.nombre_empresa = "Magic Intelligence";
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(path.resolve(__dirname, "../templates/generico.html"), 'utf8', (err, data) => {
                html = mustache.to_html(data, params);
                resolve(html);
            });
        } catch (e) {
            reject(e);
        }
    });
}


const getAlumnosInfoCorreoAlumnos = (request, response) => {
    console.log("@getAlumnosInfoCorreo");
    try {
        var validacion = helperToken.validarToken(request);

        if (!validacion.tokenValido) {
            return response.status(validacion.status).send(validacion.mensajeRetorno);;
        }

        const { ids }  = request.body;

        console.log("Ids "+ids);
        
        if(ids == undefined){
            response.status(200).json({ estatus: false, respuesta: "No existen correos registrados. " });
            return;
        }
        
        pool.query(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [ids],
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


const enviarRecordatorioPago = (request, response) => {
    console.log("@enviarRecordatorioPago");
    try {

        var respuesta = helperToken.validarToken(request);

        if (!respuesta.tokenValido) {
            return response.status(respuesta.statusNumber).send(respuesta);
        }

        var id_alumno = request.params.id_alumno;
        var { nota, nota_escrita } = request.body;
        console.log("id_alumno "+id_alumno);
               

        pool.query(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [[id_alumno]],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                console.log("result "+ JSON.stringify(results));
                if (results.rowCount > 0) {
                    let row = results.rows[0];

                    if (row.correos == '' || row.correos == null) {
                        response.status(500).json({ estatus: false, respuesta: "No existen correos registrados. " });
                        return;
                    }

                    let params = {
                        titulo: "Recordatorio de pago",
                        subtitulo: "Hola, " + row.nombres_padres,
                        contenido: nota_escrita ? nota : "Se le recuerda que tiene cargos pendientes por pagar."
                    };
                    //let para = row.correos;
                    console.log("correos obtenidos "+row.correos);
                    let para = "joel.rod.roj@hotmail.com";
                    let asunto = "Recordatorio de pago";

                    //enviar 
                    obtenerCargos(id_alumno)
                        .then((results) => {
                            if (results.rowCount > 0) {
                                //enviarRecordatorioPagoComplemento(row.correos, "Recordatorio de pago", params, cargos);
                                loadTemplateGenerico(params)
                                    .then((renderHtml) => {
                                        console.log("Dentro d");
                                        if (renderHtml != null) {

                                            const mailData = {
                                                from: mailOptions.from,
                                                to: para,
                                                cc: mailOptions.cc,
                                                subject: asunto,
                                                html: renderHtml
                                            };

                                            transporter.sendMail(mailData, function (error, info) {
                                                if (error) {
                                                    console.log("Error al enviar correo : " + error);
                                                    response.status(500).json({ estatus: false, respuesta: "Falló el envio de correo." });
                                                } else {
                                                    console.log('Email sent: ' + info.response);
                                                    response.status(500).json({ estatus: true, respuesta: "Enviado" });
                                                }
                                            });

                                            transporter.close();
                                        } else {
                                            console.log("No se envio el correo");
                                            response.status(500).json({ estatus: false, respuesta: "Falló el envio de correo." });
                                        }
                                    }).catch(e => {
                                        console.log("Excepción en el envio de correo : " + e);
                                        response.status(500).json({ estatus: false, respuesta: "Falló el envio de correo." });
                                    });
                            } else {
                                //no existen cargos 
                                response.status(500).json({ estatus: false, respuesta: "No existen cargos." });
                            }
                        }).catch(e => {
                            response.status(500).json({ estatus: false, respuesta: "Falló " });
                        });
                    //tokens para el cel
                } else {
                    //informar error
                    response.status(500).json({ estatus: false, respuesta: "no existen correos registrados. " });
                }
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

function obtenerCargos(id_alumno) {

    return pool.query(
        `SELECT a.co_balance_alumno,
           b.id as id_cargo_balance_alumno,
           b.fecha,
           b.cantidad,
           cargo.nombre as nombre_cargo,
           cat_cargo as id_cargo,
           cargo.es_facturable,
           b.total as total,
           b.cargo,
           b.total_pagado,
           b.nota,
           b.pagado            
         FROM co_cargo_balance_alumno b inner join co_alumno a on b.co_balance_alumno = a.co_balance_alumno 
                                       inner join cat_cargo cargo on b.cat_cargo = cargo.id					
         WHERE a.id = $1 and b.pagado = false and b.eliminado = false and a.eliminado = false
          ORDER by b.pagado, b.fecha desc`
        , [id_alumno]);
}



module.exports = {
    notificarReciboPago,
    enviarCorreoTest,
    enviarCorreoCambioSucursal,
    enviarCorreoClaveFamiliar,
    getAlumnosInfoCorreoAlumnos,
    enviarRecordatorioPago

}