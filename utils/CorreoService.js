

const { pool } = require('../db/conexion');
const nodemailer = require('nodemailer');
const mustache = require('mustache');
var fs = require('fs');
var path = require('path');
//const mensajeria = require('../services/mensajesFirebase');
const { variables } = require('../config/ambiente');
const { QUERY, getQueryInstance } = require('../services/sqlHelper');
const transporter = nodemailer.createTransport(variables.configMail);

const TEMPLATES = {
    TEMPLATE_GENERICO: "generico.html",
    TEMPLATE_RECIBO_PAGO: "recibo_pago.html",
    TEMPLATE_AVISO_CARGO: "aviso_cargo.html",
    TEMPLATE_DATOS_FACTURACION: "datos_factura.html"
}


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


function enviarCorreoConCopiaTemaNotificacion(asunto, para, idSucursalTemaCopia, idTemaNotificacion, params, template) {
    console.log("@enviarCorreoPorTemaNotificacion");

    loadTemplate(template, params)
        .then((renderHtml) => {
            //obtener correos copia por sucursal y tema
            obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion)
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


function enviarCorreoParaTemaNotificacion(asunto, idSucursalTemaCopia, idTemaNotificacion, params, template) {
    console.log("@enviarCorreoParaTemaNotificacion");

    loadTemplate(template, params)
        .then((renderHtml) => {
            obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion)
                .then(result => {

                    let para = "";
                    if (result != null && result.rowCount > 0) {
                        para = result.rows[0].correos_copia;
                    }

                    enviarCorreo(para, "", asunto, renderHtml);
                });

        }).catch(e => {
            console.log("Excepción en el envio de correo : " + e);
        });
}

function loadTemplate(templateName, params) {
    var html = null;
    //fixme : ir a la bd
    params.nombre_empresa = "Magic Intelligence";

    return new Promise((resolve, reject) => {
        try {
            getQueryInstance(QUERY.TEMPLATE_EMPRESA,
                [idEmpresa],
                (rowTemplate) => {
                    aqui me qyede
                    fs.readFile(path.resolve(__dirname, "../templates/" + templateName), 'utf8', (err, data) => {
                        
                        html = mustache.to_html(data, params);
                        resolve(html);
                    });
                },(e)=>{
                    //leer template de archivos
                    console.log("Error al obtener el template de la BD");
                    reject(e);        
                }
            );
        } catch (e) {
            reject(e);
        }
    });
}

function obtenerTemplateBD(idEmpresa) {
    try {
        getQueryInstance(QUERY.TEMPLATE_EMPRESA, [idEmpresa]);
    } catch (e) {
        console.log("Fallo al leer el template de la empresa " + e);
    }
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

}