
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
    from: 'velocirraptor79.1@gmail.com',
    to: 'myfriend@yahoo.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    //host:'smtp.magicintelligence.com',
    port: 465,
    //secure:true,
    secureConnection: true,
    service: 'gmail',
    auth: {
        //user: 'joel@magicintelligence.com',
        user: 'velocirraptor79.1@gmail.com',
        pass: '@@rmincesa'
    },
    tls: {
        ciphers: 'SSLv3'
    }
});


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
                enviarReciboComplemento(row.correos, row.nombres_padres,row.nombre_alumno, pago, nota, ids_cargos, cat_forma_pago, identificador_factura);
            }
        });
};

function enviarReciboComplemento(lista_correos, nombres_padres,nombre_alumno, pago, nota, ids_cargos, cat_forma_pago, identificador_factura) {

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
                        nombre_cliente: nombres_padres,
                        nombre_alumno : nombre_alumno,
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
                //console.log(data);
                //html = mustache.render(data, {
                html = mustache.to_html(data, {
                    titulo: "Magic Intelligence",
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


module.exports = {    
    notificarReciboPago
    // enviarCorreo
}