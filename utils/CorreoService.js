const nodemailer = require('nodemailer')
const mustache = require('mustache')
var fs = require('fs')
var path = require('path')
const configEnv = require('../config/configEnv')
const { QUERY, getQueryInstance } = require('../services/sqlHelper')
const { ID_EMPRESA_MAGIC } = require('./Constantes')
const correoTemaService = require('../domain/temaNotificacionService')
const { existeValorArray } = require('./Utils')
const magicEmail = require('magic-email')

const TEMPLATES = {
    TEMPLATE_AVISO: 'aviso.html',
    TEMPLATE_GENERICO: 'generico.html',
    TEMPLATE_RECIBO_PAGO: 'recibo_pago.html',
    TEMPLATE_AVISO_CARGO: 'aviso_cargo.html',
    TEMPLATE_DATOS_FACTURACION: 'datos_factura.html',
    TEMPLATE_RECORDATORIO_PAGO_MENSUALIDAD: 'recordatorio_recargo_mensualidad.html',
    TEMPLATE_REPORTE_PROX_RECARGOS: 'reporte_prox_recargo_mensualidad.html',
    TEMPLATE_ESTADO_CUENTA: 'estado_cuenta.html',
}

function enviarCorreoFamiliaresAlumno(asunto, para, cc, params, template) {
    enviarCorreoTemplate(para, cc, asunto, params, template)
}

const enviarCorreoConCopiaTemaNotificacion = async(
    asunto,
    para,
    idSucursalTemaCopia,
    idTemaNotificacion,
    params,
    template,
) => {
    console.log(
        '@enviarCorreoPorTemaNotificacion copia a la suc ' +
        idSucursalTemaCopia +
        ' tema ' +
        idTemaNotificacion,
    )
    try {
        let renderHtml = await loadTemplate(template, params)
        let cc = await obtenerCorreosCopiaPorTema(
            idSucursalTemaCopia,
            idTemaNotificacion,
        )
        enviarCorreo(para, cc, asunto, renderHtml)
    } catch (error) {
        console.log('Excepción en el envio de correo : ' + error)
    }

    /* loadTemplate(template, params)
         .then((renderHtml) => {            
             obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion)
                 .then(correos => {
                     console.log("Correos copia iniciando");
                     let cc = correos;                    
                     enviarCorreo(para, cc, asunto, renderHtml);
                 }).catch(e => {
                     console.log("Excepción al consultar correos copia: " + e);
                 });
 
         }).catch(e => {
             console.log("Excepción en el envio de correo : " + e);
         });*/
}

function enviarCorreoParaTemaNotificacion(
    asunto,
    idSucursalTemaCopia,
    idTemaNotificacion,
    params,
    template,
) {
    console.log('@enviarCorreoParaTemaNotificacion')

    loadTemplate(template, params)
        .then((renderHtml) => {
            obtenerCorreosCopiaPorTema(idSucursalTemaCopia, idTemaNotificacion).then(
                (correosCopia) => {
                    let para = correosCopia
                        /*let para = "";
                                  if (result != null && result.rowCount > 0) {
                                      para = result.rows[0].correos_copia;
                                  }*/
                    if (existeValorArray(para)) {
                        enviarCorreo(para, '', asunto, renderHtml)
                    } else {
                        console.log('No existen correo para enviar el mail ')
                    }
                },
            )
        })
        .catch((e) => {
            console.log('Excepción en el envio de correo : ' + e)
        })
}

function enviarCorreoTemplate(para, cc, asunto, params, template, handler) {
    console.log('@enviarCorreoTemplate')

    loadTemplate(template, params)
        .then((renderHtml) => {
            enviarCorreo(para, cc, asunto, renderHtml, handler)
        })
        .catch((e) => {
            console.log('Excepción en el envio de correo : ' + e)
        })
}

const enviarCorreoTemplateAsync = async(
    para,
    cc,
    asunto,
    params,
    template,
) => {

    console.log('@enviarCorreoTemplateAsync')


    const renderHtml = await loadTemplate(template, params)

    const result = await enviarCorreo(para, cc, asunto, renderHtml);

    console.log("RESULT " + result);

    return { enviado: result }

    //return new Promise((resolve, reject) => {

    //return await enviarCorreoAsync(para, cc, asunto, renderHtml)

    /*return await enviarCorreo(para, cc, asunto, renderHtml, (error, info) => {
          if (error) {
              reject({ enviado: false, mensaje: error });
          } else {
              resolve({ enviado: true, mensaje: info });
          }
      });*/
    //});
}

const getHtmlPreviewTemplate = (templateName, params) => {
    return loadTemplate(templateName, params)
}

function loadTemplate(templateName, params) {
    var html = ''
        //fixme : ir a la bd
    params.nombre_empresa = 'Mi Empresa'

    return new Promise((resolve, reject) => {
        try {
            getQueryInstance(QUERY.TEMPLATE_EMPRESA, [ID_EMPRESA_MAGIC])
                .then((rowTemplate) => {
                    console.log('TEMPLATE ENCONTRADO EN LA BD')
                    if (rowTemplate.rowCount > 0) {
                        let row = rowTemplate.rows[0]
                            // console.log(""+JSON.stringify(row));
                        fs.readFile(
                            path.resolve(__dirname, '../templates/' + templateName),
                            'utf8',
                            (err, data) => {
                                params.nombre_empresa = row.nombre_empresa
                                let htmlTemp = ''
                                htmlTemp = htmlTemp.concat(row.encabezado, data || '', row.pie)
                                    //console.log("html final");
                                html = mustache.to_html(htmlTemp, params)
                                resolve(html)
                            },
                        )
                    } else {
                        console.log('Resolver con templates Fisicos')
                    }
                })
                .catch((e) => {
                    //leer template de archivos
                    console.log('Error al obtener el template de la BD')
                    reject(e)
                })
        } catch (e) {
            reject(e)
        }
    })
}

function obtenerCorreosCopiaPorTema(co_sucursal, id_tema) {
    return correoTemaService.obtenerCorreosPorTema(co_sucursal, id_tema)
}

//Esta configuracion se cambiara, se usara el API dedicado
/* 
    @Deprecated :
    Se depreca por que no es async

*/
function enviarCorreo(para, conCopia, asunto, renderHtml, handler) {
    console.log('Para ' + para)
    console.log('CCC ' + conCopia)
    try {
        if (para == undefined || para == '' || para == null) {
            console.log(
                '############ NO EXISTEN CORREOS EN NINGUN CONTENEDOR (para,cc)######',
            )
            return
        }
        if (conCopia == undefined || conCopia == '' || conCopia == null) {
            conCopia = ''
        }

        if (renderHtml != null) {
            //sendEmailNative(para, conCopia, asunto, renderHtml,handler);

            // descomentar cuando se agregue la libreria
            // if (configEnv.USE_MAGIC_EMAIL == 'true') {

            return sendMagicEmail({ para, conCopia, asunto, renderHtml, handler });

            //} else {
            //    sendEmailNative(para, conCopia, asunto, renderHtml, handler);
            //}
        } else {
            console.log('No se envio el correo, no existe HTML')
        }
    } catch (e) {
        console.log('ERROR AL ENVIAR EL CORREO ' + e)
    }
}

const sendMagicEmail = async(
    data = { para, conCopia, asunto, renderHtml, handler },
) => {
    try {
        const { para, conCopia, asunto, renderHtml, handler } = data

        const copiaOculta = configEnv.BBC_MAIL_ALL ? configEnv.BBC_MAIL_ALL : ''
        const hostMagicMail = configEnv.HOST_MAGIC_EMAIL ?
            configEnv.HOST_MAGIC_EMAIL :
            ''
        const portMagicMail = configEnv.PORT_MAGIC_EMAIL ?
            configEnv.PORT_MAGIC_EMAIL :
            ''
        const userMagicMail = configEnv.USER_MAGIC_EMAIL ?
            configEnv.USER_MAGIC_EMAIL :
            ''
        const passMagicMail = configEnv.PASSWORD_MAGIC_EMAIL ?
            configEnv.PASSWORD_MAGIC_EMAIL :
            ''
            /*host: `magicintelligence.com`,
            port: 465,
            user: `app@magicintelligence.com`,
            password: `TicFWX9bb(`*/

        const strategyParams = {
            strategyName: 'NodeMailer',
            smtp: {
                host: hostMagicMail,
                port: portMagicMail,
                user: userMagicMail,
                password: passMagicMail,
            },
        }

        const emailParams = {
            to: para,
            cc: conCopia,
            bcc: copiaOculta,
            subject: asunto,
            html: `${renderHtml}`,
        }

        //console.log(`${JSON.stringify(emailParams)}`)
        console.log("ANTES DE PROMESA ENVIAR")


        await magicEmail.sendEmail(strategyParams, emailParams);

        return true;

    } catch (e) {
        return false
    }
}


const sendMagicEmailSync = (
    data = { para, conCopia, asunto, renderHtml, handler },
) => {
    try {
        const { para, conCopia, asunto, renderHtml, handler } = data

        const copiaOculta = configEnv.BBC_MAIL_ALL ? configEnv.BBC_MAIL_ALL : ''
        const hostMagicMail = configEnv.HOST_MAGIC_EMAIL ?
            configEnv.HOST_MAGIC_EMAIL :
            ''
        const portMagicMail = configEnv.PORT_MAGIC_EMAIL ?
            configEnv.PORT_MAGIC_EMAIL :
            ''
        const userMagicMail = configEnv.USER_MAGIC_EMAIL ?
            configEnv.USER_MAGIC_EMAIL :
            ''
        const passMagicMail = configEnv.PASSWORD_MAGIC_EMAIL ?
            configEnv.PASSWORD_MAGIC_EMAIL :
            ''

        const strategyParams = {
            strategyName: 'NodeMailer',
            smtp: {
                host: hostMagicMail,
                port: portMagicMail,
                user: userMagicMail,
                password: passMagicMail,
            },
        }

        const emailParams = {
            to: para,
            cc: conCopia,
            bcc: copiaOculta,
            subject: asunto,
            html: `${renderHtml}`,
        }

        console.log(`${JSON.stringify(emailParams)}`)

        return new Promise((resolve, reject) => {
            magicEmail.sendEmail(strategyParams, emailParams)
                .then(() => {
                    resolve({ envio: true, error: false });
                }).catch(e => {
                    reject({ envio: true, error: false });
                })
        });



        return true

    } catch (e) {
        return false
    }
}


const sendEmailNative = (para, conCopia, asunto, renderHtml, handler) => {
    const mailOptions = configEnv.EMAIL_CONFIG ?
        configEnv.EMAIL_CONFIG.mailOptions : {}
    const configMail = configEnv.EMAIL_CONFIG ?
        configEnv.EMAIL_CONFIG.configMail : {}
    const copiaOculta = configEnv.BBC_MAIL_ALL ? configEnv.BBC_MAIL_ALL : ''

    const mailData = {
        from: mailOptions.from || '',
        //from: variables.mailOptions.from,
        to: para,
        cc: conCopia,
        bcc: copiaOculta,
        subject: asunto,
        html: renderHtml,
    }

    console.log(`Sender FROM ${mailOptions.from || 'NO-FROM'}`)
    console.log('Correo para ' + para)
    console.log('Correo cc ' + JSON.stringify(conCopia))
    console.log('Correo BCC ' + copiaOculta)
    console.log('Asunto ' + asunto)
    console.log(`Ambiente ${configEnv.ENV}`)
    console.log(`EMAIL_CONFIG ${JSON.stringify(configEnv.EMAIL_CONFIG)}`)

    const transporter = nodemailer.createTransport(configMail)
        //const transporter = nodemailer.createTransport(variables.configMail);

    const handlerMail = handler ?
        handler :
        (error, info) => {
            if (error) {
                console.log('Error al enviar correo : ' + error)
            } else {
                console.log('CORREO ENVIADO ======>>>: ' + info.response)
            }
        }

    transporter.sendMail(mailData, handlerMail)

    transporter.close()
}


module.exports = {
    TEMPLATES,
    enviarCorreoConCopiaTemaNotificacion,
    enviarCorreoParaTemaNotificacion,
    enviarCorreo,
    enviarCorreoTemplate,
    enviarCorreoFamiliaresAlumno,
    getHtmlPreviewTemplate,
    enviarCorreoTemplateAsync,
    sendMagicEmailSync,
}