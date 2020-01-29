
const nodemailer = require('nodemailer');
const mustache = require('mustache');
var fs = require('fs');
var path = require('path');
const { variables } = require('../config/ambiente');
const { QUERY, getQueryInstance } = require('../services/sqlHelper');
const { ID_EMPRESA_MAGIC } = require('./Constantes');
const correoTemaService = require('../domain/temaNotificacionService');
const {existeValorArray} = require('./Utils');

const transporter = nodemailer.createTransport(variables.configMail);

const TEMPLATES = {
    TEMPLATE_GENERICO: "generico.html",
    TEMPLATE_RECIBO_PAGO: "recibo_pago.html",
    TEMPLATE_AVISO_CARGO: "aviso_cargo.html",
    TEMPLATE_DATOS_FACTURACION: "datos_factura.html"
}


function enviarCorreoConCopiaTemaNotificacion(asunto, para, idSucursalTemaCopia, idTemaNotificacion, params, template) {
    console.log("@enviarCorreoPorTemaNotificacion copia a la suc " + idSucursalTemaCopia + " tema " + idTemaNotificacion);

    loadTemplate(template, params)
        .then((renderHtml) => {
            //obtener correos copia por sucursal y tema
            obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion)
                .then(correos => {
                    console.log("Correos copia iniciando");

                    let cc = correos;
                    /*let cc = "";                    
                    if (result != null && result.rowCount > 0) {
                        cc = result.rows[0].correos_copia;                        
                    }*/

                    enviarCorreo(para, cc, asunto, renderHtml);
                }).catch(e => {
                    console.log("Excepción al consultar correos copia: " + e);
                });;

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
}


function enviarCorreoParaTemaNotificacion(asunto, idSucursalTemaCopia, idTemaNotificacion, params, template) {
    console.log("@enviarCorreoParaTemaNotificacion");

    loadTemplate(template, params)
        .then((renderHtml) => {
            obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion)
                .then(correosCopia => {

                    let para = correosCopia;
                    /*let para = "";
                    if (result != null && result.rowCount > 0) {
                        para = result.rows[0].correos_copia;
                    }*/
                    if(existeValorArray(para)){
                        enviarCorreo(para, "", asunto, renderHtml);
                    }else{
                        console.log("No existen correo para enviar el mail ");
                    }
                    
                });

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
}


function enviarCorreoTemplate(para, cc, asunto, params, template) {
    console.log("@enviarCorreoTemplate");

    loadTemplate(template, params)
        .then((renderHtml) => {           
            
            enviarCorreo(para, cc, asunto, renderHtml);

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
}

function loadTemplate(templateName, params) {
    var html = '';
    //fixme : ir a la bd
    params.nombre_empresa = "Mi Empresa";

    return new Promise((resolve, reject) => {
        try {
            getQueryInstance(QUERY.TEMPLATE_EMPRESA, [ID_EMPRESA_MAGIC])
                .then((rowTemplate) => {
                    console.log("TEMPLATE ENCONTRADO EN LA BD");
                    if (rowTemplate.rowCount > 0) {
                        let row = rowTemplate.rows[0];
                        // console.log(""+JSON.stringify(row));
                        fs.readFile(path.resolve(__dirname, "../templates/" + templateName), 'utf8', (err, data) => {
                            params.nombre_empresa = row.nombre_empresa;
                            let htmlTemp = '';
                            htmlTemp = htmlTemp.concat(row.encabezado, (data || ''), row.pie);
                            console.log("html final");
                            html = mustache.to_html(htmlTemp, params);
                            //console.log(html);
                            resolve(html);
                        });
                    } else {
                        console.log("Resolver con templates Fisicos");
                        //resolver con archivos
                        /*fs.readFile(path.resolve(__dirname, "../templates/" + templateName), 'utf8', (err, data) => {                        
                            params.nombre_empresa= row.nombre_empresa;                            
                            let cuerpo = mustache.to_html(data, params);
                            html.concat(row.encabezado);
                            html.concat(cuerpo);                            
                            html.concat(row.pie);
                            resolve(html);
                        });*/
                    }
                }).catch((e) => {
                    //leer template de archivos
                    console.log("Error al obtener el template de la BD");
                    reject(e);
                });
        } catch (e) {
            reject(e);
        }
    });
}

function obtenerCorreosCopiaPorTema(co_sucursal, id_tema) {
    /*return getQueryInstance(`
        SELECT array_to_json(array_agg(to_json(correo))) as correos_copia
        FROM co_correo_copia_notificacion
        WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false
   `, [co_sucursal, id_tema]);*/
   /*  return getQueryInstance(`
                    SELECT 
                        (select array_to_json(array_agg(to_json(u.correo)))
                        FROM co_usuario_notificacion un inner join usuario u on u.id = un.usuario
                        WHERE un.co_sucursal = $1 and un.co_tema_notificacion = $2
                        and un.eliminado = false and u.eliminado = false)
                        AS correos_usuarios,	
                        (SELECT array_to_json(array_agg(to_json(correo)))
                        FROM co_correo_copia_notificacion
                        WHERE co_sucursal = $1 and co_tema_notificacion = $2 and eliminado = false) 
                        as correos_copia    
   `, [co_sucursal, id_tema]);*/
   return correoTemaService.obtenerCorreosPorTema(co_sucursal,id_tema);
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


        console.log(`Sender FROM ${variables.mailOptions.from}`);
        console.log("Correo para " + para);
        console.log("Correo cc " + JSON.stringify(conCopia));
        console.log("Asunto " + asunto);
        console.log(`Ambiente ${variables.env}`);

        transporter.sendMail(mailData, function (error, info) {
            if (error) {
                console.log("Error al enviar correo : " + error);
            } else {
                console.log('CORREO ENVIADO ======>>>: ' + info.response);
            }
        });

        transporter.close();
    } else {
        console.log("No se envio el correo, no existe HTML");
    }
}

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


module.exports = {
    TEMPLATES,
    enviarCorreoTest,
    enviarCorreoConCopiaTemaNotificacion,
    enviarCorreoParaTemaNotificacion,
    enviarCorreo,
    enviarCorreoTemplate

}