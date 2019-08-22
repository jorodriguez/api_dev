
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const { configuracion } = require('../config/ambiente');
const nodemailer = require('nodemailer');
const mustache = require('mustache');
var fs = require('fs');
var path = require('path');


const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

const mailOptions = {
    from: 'joel@magicintelligence.com',
    cc: 'joel@magicintelligence.com'    
};

const transporter = nodemailer.createTransport({    
    host: 'mail.magicintelligence.com',
    port: 465,    
    secureConnection: true,    
    auth: {        
        user: 'joel@magicintelligence.com',
        pass: 'Secreta.03'
    },
    tls: {
        ciphers: 'SSLv3'
    }
});

const enviarCorreoTest = (request, response) => {
    const mailData = {
        from: mailOptions.from,
        to: 'joel.rod.roj@hotmail.com',
        subject: 'Test',
        html: "<h3>Test</h3>"
    };
    try {
        transporter.sendMail(mailData, function (error, info) {
            if (error) {
                console.log("Error al enviar correo : " + error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        transporter.close();

        response.status(200).json({ envio: "Ok" });
        console.log("Enviado OK");
    } catch (e) {
        console.log("Error " + e);
    }
};


const notificarReciboPago = (id_alumno, pago, nota, ids_cargos, cat_forma_pago, identificador_factura) => {
    //ir por alumno
    pool.query(
        `
        select 				
            a.nombre as nombre_alumno,		 
            string_agg(fam.nombre,' / ') AS nombres_padres,
            string_agg( fam.correo,',' ) AS correos,
            string_agg(fam.token,' ')as tokens
        from co_alumno_familiar rel inner join co_familiar fam on rel.co_familiar = fam.id
                                    inner join co_parentesco parentesco on parentesco.id = rel.co_parentesco
                                    inner join co_alumno a on a.id = rel.co_alumno
        where co_alumno = $1 --and envio_recibos
            and fam.eliminado = false 
            and rel.eliminado = false
        group by a.nombre            
        `, [id_alumno],
        (error, results) => {
            if (error) {
                return;
            }
            if (results.rowCount > 0) {
                //enviar a otro metord
                let row = results.rows[0];
                enviarReciboComplemento(row.correos, row.nombres_padres, row.nombre_alumno, pago, nota, ids_cargos, cat_forma_pago, identificador_factura);
            }
        });
};

function enviarReciboComplemento(lista_correos, nombres_padres, nombre_alumno, pago, nota, ids_cargos, cat_forma_pago, identificador_factura) {

    pool.query(
        ` 
            select	 	  
              TO_CHAR(pago_cargo.fecha, 'dd-mm-yyyy') as fecha_cargo,               
              cargo.cantidad,
              cat_cargo.nombre as nombre_cargo,	  
              cargo.nota,
              cargo.pagado,
              pago_cargo.pago, 
              cargo.total,
              cargo.total_pagado	  
            from co_pago_cargo_balance_alumno pago_cargo inner join co_cargo_balance_alumno cargo on pago_cargo.co_cargo_balance_alumno = cargo.id
                                    inner join cat_cargo on cargo.cat_cargo =cat_cargo.id
            where cargo.id IN (`+ ids_cargos + ')',
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {
                enviarCorreoReciboPago(
                    lista_correos,
                    "Recibo de pago ",
                    {
                        titulo:"Magic Intelligence",
                        nombre_cliente: nombres_padres,
                        nombre_alumno: nombre_alumno,
                        fecha: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
                        monto: pago,
                        folio_factura: identificador_factura ? identificador_factura : 'N/A',
                        nota: nota,
                        cargos: results.rows
                    });
            }
        });
}



const enviarCorreoReciboPago = (para, asunto, params) => {
    console.log("@enviarCorreoReciboPago");

    loadTemplateReciboPago(params)
        .then((renderHtml) => {
            console.log("Dentro de la promesa resuelta");
            if (renderHtml != null) {

                const mailData = {
                    from: mailOptions.from,
                    to: para,
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
};

function loadTemplateReciboPago(param) {
    var html = null;
    return new Promise((resolve, reject) => {
        try {
            console.log("loadTemplateReciboPago");
            fs.readFile(path.resolve(__dirname, "../templates/recibo_pago.html"), 'utf8', (err, data) => {                
                html = mustache.to_html(data, {
                    titulo: param.titulo,
                    nombre_cliente: param.nombre_cliente,
                    nombre_alumno: param.nombre_alumno,
                    fecha: param.fecha,
                    monto: param.monto,
                    folio_factura: param.folio_factura,
                    cargos: param.cargos
                });
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
                    cc:mailOptions.cc,
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
};



// no se usa aun
const enviarCorreoClaveFamiliar = (para, asunto, params) => {
    console.log("@enviarCorreoClaveFamiliar");

    loadTemplateGenerico(params)
        .then((renderHtml) => {
            console.log("Dentro d");
            if (renderHtml != null) {

                const mailData = {
                    from: mailOptions.from,
                    to: para,
                    cc:mailOptions.cc,
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
};


//mejorar esto param = {titulo:"",subtitulo:"",contenido:""}
function loadTemplateGenerico(params) {
    var html = null;
    return new Promise((resolve, reject) => {
        try {
            console.log("loadTemplateReciboPago");
            fs.readFile(path.resolve(__dirname, "../templates/generico.html"), 'utf8', (err, data) => {                
                html = mustache.to_html(data,params);
                resolve(html);
            });
        } catch (e) {
            reject(e);
        }
    });
}


module.exports = {
    notificarReciboPago,
    enviarCorreoTest,
    enviarCorreoCambioSucursal,
    enviarCorreoClaveFamiliar
    
}