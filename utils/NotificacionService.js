
const { pool } = require('../db/conexion');
const { configuracion } = require('../config/ambiente');
const nodemailer = require('nodemailer');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');
const mustache = require('mustache');
var fs = require('fs');
var path = require('path');
const mensajeria = require('../services/mensajesFirebase');
const { CARGOS ,TEMA_NOTIFICACION} = require('../utils/Constantes');
const { variables } = require('../config/ambiente');

const TEMPLATE_GENERICO = "generico.html";
const TEMPLATE_RECIBO_PAGO = "recibo_pago.html";
const TEMPLATE_AVISO_CARGO = "aviso_cargo.html";
const TEMPLATE_DATOS_FACTURACION = "datos_factura.html";

//pasar al archivo de sonc
//const ID_TEMA_NOTIFICACION_PAGOS = 2;

//Params [id_alumno]
const QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO =
    `SELECT  	a.id,
                a.nombre as nombre_alumno,		
                a.co_sucursal, 
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

const transporter = nodemailer.createTransport(variables.configMail);

const enviarCorreoTest = (request, response) => {
    console.log("Enviando correo de prueba ");
    const mailData = {
        from: variables.mailOptions.from,
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



const notificarCargo = (id_alumno, id_cargos) => {
    console.log("notificarCargo " + id_alumno + "    " + id_cargos);
    //ir por alumno
    pool.query(QUERY_CORREOS_TOKEN_FAMILIARES_ALUMNO, [[id_alumno]],
        (error, results) => {
            if (error) {
                return;
            }
            if (results.rowCount > 0) {
                let row = results.rows[0];
                completarNotificacionCargo(row.correos, row.tokens, row.nombres_padres, row.nombre_alumno, id_cargos, row.co_sucursal);
            } else {
                console.log("No se encontraron registros de padres para el alumno " + id_alumno);
            }
        });
};

function completarNotificacionCargo(lista_correos, lista_tokens, nombres_padres, nombre_alumno, id_cargo, id_sucursal) {
    console.log("completar envio notificacion");
    if (lista_correos == null || lista_correos == undefined || lista_correos.length == []) {
        console.log("No existen correos para notificar el cargo");
        return;
    }

    pool.query(`SELECT cat.nombre as nombre_cargo,		
                    cat.id as id_cat_cargo,
                    cat.precio as cargo,
                    to_char(cargo.fecha,'dd-MM-YYYY') as fecha,
                    cargo.cantidad,
                    cargo.total as cargo, 
                    cargo.nota,
                    cargo.texto_ayuda,
                    cat.notificar
                FROM co_cargo_balance_alumno cargo inner join cat_cargo cat on cat.id = cargo.cat_cargo
                WHERE cargo.id = $1 and cargo.eliminado = false
            `, [id_cargo],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];

                if (row.notificar) {
                    let titulo_mensaje = `${row.nombre_cargo} de ${nombre_alumno}`;
                    let cuerpo_mensaje = `Hola ${nombres_padres}, se realizó un cargo de $${row.cargo} por ${row.nombre_cargo} ${row.texto_ayuda != '' ? '(' + row.texto_ayuda + ')' : ''} ${row.id_cat_cargo == CARGOS.ID_TIEMPO_EXTRA ? row.nota : ''}.`;

                    console.log("Enviando correo a " + JSON.stringify(lista_correos));
                    var params = {
                        fecha: row.fecha,
                        nombre_cliente: nombres_padres,
                        nota_inicial: `Se registró el siguiente cargo en la cuenta de ${nombre_alumno}`,
                        nombre_cargo: row.nombre_cargo,
                        texto_ayuda: row.texto_ayuda,
                        nota: row.nota,
                        cargo: row.cargo,
                        id_sucursal: id_sucursal,
                        nota_pie: ''
                    };
                    enviarNotificacionCargo(lista_correos, titulo_mensaje, params);
                    //enviar mensaje te text
                    enviarMensajeMovil(lista_tokens, titulo_mensaje, cuerpo_mensaje);
                }else{console.log("El cargo no esta configurado para notificar cargo")}
            }
        });
}


const enviarNotificacionCargo = (para, asunto, params) => {
    console.log("@enviarNotificacionCargo");

    //const ID_TEMA_NOTIFICACION_PAGOS = 2;

    loadTemplate(TEMPLATE_AVISO_CARGO, params)
        .then((renderHtml) => {
            obtenerCorreosCopiaPorTema(params.id_sucursal, TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_PAGOS)
                .then(result => {

                    let cc = "";
                    if (result != null && result.rowCount > 0) {
                        cc = result.rows[0].correos_copia;
                    }

                    enviarCorreo(para, cc, asunto, renderHtml);
                });

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
};



function enviarMensajeMovil(tokens, titulo, cuerpo) {
    console.log("Enviando mensaje a movil");
    if (tokens != null && tokens != [] && tokens.length > 0) {
        console.log("Enviando msj al token " + tokens);
        mensajeria.enviarMensajeToken(tokens, titulo, cuerpo);
    } else {
        console.log("No existen tokens registrados ");
    }

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
                    cargo.texto_ayuda, --nombre del mes
			        cargo.pagado,
			        cargo.nota as nota_cargo,
			        cargo.cantidad,
			        cargo.cargo,
			        cargo.total,
                    cargo.total_pagado,
                    cat.es_facturable
		        FROM co_pago_cargo_balance_alumno rel inner join co_cargo_balance_alumno cargo on rel.co_cargo_balance_alumno = cargo.id									
												inner join cat_cargo cat on cat.id = cargo.cat_cargo												
 		        WHERE rel.co_pago_balance_alumno = $1 and cargo.eliminado = false
            ) select pago.id,
 		            pago.pago,
                    fpago.nombre as forma_pago,
                    fpago.permite_factura as permite_factura_forma_pago,
                    pago.identificador_factura,
		            TO_CHAR(pago.fecha, 'dd-mm-yyyy') as fecha,
		            grupo.nombre as nombre_grupo,
		            al.nombre as nombre_alumno,
                    al.apellidos as apellidos_alumno,
                    al.factura, 
                    (select to_json(a.*) from co_datos_facturacion a where a.id = al.co_datos_facturacion and a.eliminado = false) AS datos_factura,
                    suc.id as id_sucursal,
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
                group by pago.id,fpago.permite_factura,fpago.nombre,al.nombre,al.apellidos,al.factura,al.co_datos_facturacion,grupo.nombre,suc.id,suc.nombre,suc.direccion 
          `, [id_pago, id_pago],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo Fallo algo en el query");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];
                let tituloCorreo = "Recibo de pago ✔";
                let titulo_mensaje = "Pago realizado ✔";
                let cuerpo_mensaje = `Hola, recibimos un pago correspondiente a ${row.count_cargos} cargo${row.count_cargos > 0 ? '' : 's'} del alumno ${row.nombre_alumno}, enviamos el recibo de pago a su correo.`;
                console.log("Enviando correo a " + JSON.stringify(lista_correos));

                var  pago = {
                    fecha: row.fecha,
                    pago: row.pago,
                    forma_pago: row.forma_pago,
                    factura: row.identificador_factura,
                    numero_cargos: row.count_cargos,
                    cargos: row.cargos,
                    escribir_folio_factura: (row.identificador_factura != null && row.identificador_factura != '')
                };

               var alumno = {
                    nombre: row.nombre_alumno,
                    apellidos: row.apellidos_alumno,
                    grupo: row.nombre_grupo
                };
                var sucursal = {
                    id: row.id_sucursal,
                    nombre: row.nombre_sucursal,
                    direccion: row.direccion_sucursal
                };
                var params = {
                    titulo: "Magic Intelligence",
                    nombre_empresa: "Magic Intelligence",
                    nombre_cliente: nombres_padres,
                    pago:pago,
                    alumno:alumno,
                    sucursal:sucursal,
                    mensaje_pie: variables.template_mail.mensaje_pie
                }

                enviarCorreoReciboPago(
                    lista_correos,
                    tituloCorreo,
                    params
                    );

                enviarMensajeMovil(lista_tokens, titulo_mensaje, cuerpo_mensaje);

                //enviar datos para facturacion
                    console.log("Iniciando envio de datos de factura factura "+row.factura+" permite "+row.permite_factura_forma_pago);
                if (row.factura && row.permite_factura_forma_pago) {
                                    
                    console.log("CARGOS "+ JSON.stringify(row.cargos));

                    var listaCargosFacturables = [];
                    var total_pagado_cargos = 0;

                    for (var item in row.cargos) {
                        let item_row = row.cargos[item];
                        console.log("item "+JSON.stringify(item_row));
                        if (item_row.es_facturable) {
                            listaCargosFacturables.push(item_row);
                            total_pagado_cargos +=item_row.total_pagado;
                        }
                        console.log("item "+JSON.stringify(listaCargosFacturables));
                    }
                    
                    const nuevoParams = JSON.parse(JSON.stringify(params));                   

                    nuevoParams.pago.cargos = listaCargosFacturables;
                    nuevoParams.pago.pago = total_pagado_cargos;
                    nuevoParams.datos_factura = row.datos_factura;
                    console.log(JSON.stringify(nuevoParams));

                    console.log("Cargos para facturar "+JSON.stringify(nuevoParams.pago.cargos));
                    if (listaCargosFacturables.length > 0 ) {
                        console.log("Enviar correo para facturacion ");                        
                        enviarCorreoParaTemaNotificacion(
                                                        'Registrar Factura - '+row.nombre_sucursal,
                                                        nuevoParams,
                                                        TEMPLATE_DATOS_FACTURACION,
                                                        TEMA_NOTIFICACION.ID_TEMA_DATOS_FACTURACION
                                                        );

                    }
                }
            }
        });
}



const enviarCorreoReciboPago = (para, asunto, params) => {
    console.log("@enviarCorreoReciboPago");

    params.id_sucursal = params.sucursal.id;

    enviarCorreoConCopiaTemaNotificacion(para,asunto,params,TEMPLATE_RECIBO_PAGO,TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_PAGOS);

    //loadTemplateReciboPago(params)
    /*loadTemplate(TEMPLATE_RECIBO_PAGO, params)
        .then((renderHtml) => {

            //obtener correos copia por sucursal y tema
            obtenerCorreosCopiaPorTema(params.sucursal.id, ID_TEMA_NOTIFICACION_PAGOS)
                .then(result => {

                    let cc = "";
                    if (result != null && result.rowCount > 0) {
                        cc = result.rows[0].correos_copia;
                    }

                    enviarCorreo(para, cc, asunto, renderHtml);
                });

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });*/
};

function enviarCorreoConCopiaTemaNotificacion(para,asunto,params,template,idTemaNotificacion){
    console.log("@enviarCorreoPorTemaNotificacion");
    
    loadTemplate(template, params)
    .then((renderHtml) => {

        //obtener correos copia por sucursal y tema
        obtenerCorreosCopiaPorTema(params.id_sucursal, idTemaNotificacion)
            .then(result => {

                let cc = "";
                if (result != null && result.rowCount > 0) {
                    cc = result.rows[0].correos_copia;
                }

                enviarCorreo(para, cc, asunto, renderHtml);
            });

    }).catch(e => {
        console.log("Excepción en el envio de correo : " + e);
    });
}


function enviarCorreoParaTemaNotificacion(asunto,params,template,idTemaNotificacion){
    console.log("@enviarCorreoParaTemaNotificacion");
    
    loadTemplate(template, params)
    .then((renderHtml) => {
        //obtener correos copia por sucursal y tema
        obtenerCorreosCopiaPorTema(params.id_sucursal, idTemaNotificacion)
            .then(result => {

                let para = "";
                if (result != null && result.rowCount > 0) {
                    para = result.rows[0].correos_copia;
                }

                enviarCorreo(para,"", asunto, renderHtml);
            });

    }).catch(e => {
        console.log("Excepción en el envio de correo : " + e);
    });
}



// no se usa aun
/*
const enviarCorreoCambioSucursal = (para, asunto, params) => {
    console.log("@enviarCorreoCambioSucursalComplemento");

    loadTemplate(TEMPLATE_GENERICO, params)
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
*/


// no se usa aun
const enviarCorreoClaveFamiliar = (para, asunto, params) => {
    console.log("@enviarCorreoClaveFamiliar");

    pool
        .query(`select link_descarga_app_android,
                        link_descarga_app_ios,
                        url_facebook,
                        url_twitter,
                        url_pagina_oficial,
                        url_logo_correo_header,
                        url_logo_correo_footer
                 from configuracion limit 1`)
        .then(res => {
            let row;
            if (res.rowCount > 0) {
                row = res.rows[0];
            }
            params.url_descarga_app_android = row.link_descarga_app_android;
            params.url_descarga_app_ios = row.link_descarga_app_ios;
            params.url_facebook = row.url_facebook;
            params.url_twitter = row.url_facebook;
            params.url_pagina_oficial = row.url_pagina_oficial;
            params.url_logo_correo_header = row.url_logo_correo_header;
            params.url_logo_correo_footer = row.url_logo_correo_footer;

            console.log(JSON.stringify(row));

           // const ID_TEMA_NOTIFICACION_ALTA_FAMILIAR = 4;

            loadTemplate(TEMPLATE_GENERICO, params)
                .then((renderHtml) => {
                    console.log("Dentro d");
                    obtenerCorreosCopiaPorTema(params.sucursal.id, TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_ALTA_FAMILIAR)
                        .then(result => {
                            let cc = "";
                            if (result != null && result.rowCount > 0) {
                                cc = result.rows[0].correos_copia;
                            }

                            enviarCorreo(para, cc, asunto, renderHtml);

                        });
                }).catch(e => {
                    console.log("Excepción en el envio de correo : " + e);
                });
        }).catch((e) => {
            console.log("Excepción en el envio de correo : " + e);
        });
};


//mejorar esto param = {titulo:"",subtitulo:"",contenido:""}
function loadTemplate(templateName, params) {
    var html = null;
    //fixme : ir a la bd
    params.nombre_empresa = "Magic Intelligence";
    
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(path.resolve(__dirname, "../templates/" + templateName), 'utf8', (err, data) => {
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

        const { ids } = request.body;

        console.log("Ids " + ids);

        if (ids == undefined) {
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

function obtenerCargos(id_alumno) {

    return pool.query(
        `
     with cargos as (
	        SELECT a.co_balance_alumno,
                b.id as id_cargo_balance_alumno,
                b.fecha,
                b.cantidad,
                cargo.nombre as nombre_cargo,
                cargo.texto_ayuda,
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
         ORDER by cargo.nombre 
)
	select 
			a.nombre,
            b.total_adeudo, 
            count(c.*) as contador_cargos,
		    array_to_json(array_agg(to_json(c.*))) AS cargos
	from co_balance_alumno b inner join co_alumno a on b.id = a.co_balance_alumno
							  left join cargos c on b.id =  c.co_balance_alumno
	where a.id = $2 and b.eliminado = false
	group by a.nombre,b.total_adeudo         `
        , [id_alumno, id_alumno]);
}


function obtenerCorreosCopiaPorTema(co_sucursal, id_tema) {
    return pool.query(`
        SELECT array_to_json(array_agg(to_json(correo))) as correos_copia
        FROM co_correo_copia_notificacion
        WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false
   `, [co_sucursal, id_tema]);

}

function enviarCorreo(para, conCopia, asunto, renderHtml) {
    console.log("Para " + para);
    console.log("CCC " + conCopia);
    if (para == undefined || para == '' || para == null
    ) {
        console.log("############ NO EXISTEN CORREOS EN NINGUN CONTENEDOR (para,cc)######");
        return;
    }
    if (conCopia == undefined || conCopia == '' || conCopia == null) {
        conCopia = "";
    }

    if (renderHtml != null) {

        const mailData = {
            from: variables.mailOptions.from,
            to: para,
            cc: conCopia,
            subject: asunto,
            html: renderHtml
        };

        console.log(`Ambiente ${variables.env}`);
        console.log(`Sender FROM ${variables.mailOptions.from}`);
        console.log("Correo para " + para);
        console.log("Correo cc " + JSON.stringify(conCopia));
        console.log("asuto " + asunto);

        transporter.sendMail(mailData, function (error, info) {
            if (error) {
                console.log("Error al enviar correo : " + error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        transporter.close();
    } else {
        console.log("No se envio el correo, no existe HTML");
    }
}


module.exports = {
    notificarReciboPago,
    enviarCorreoTest,
    //  enviarCorreoCambioSucursal,
    enviarCorreoClaveFamiliar,
    getAlumnosInfoCorreoAlumnos,
    // enviarRecordatorioPago
    notificarCargo

}