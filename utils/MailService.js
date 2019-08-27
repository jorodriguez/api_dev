
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


const notificarReciboPago = (id_alumno,id_pago) => {
    console.log("notificarReciboPago "+id_alumno+"    "+id_pago);
    //ir por alumno
    pool.query(
        `
        select 				
            a.nombre as nombre_alumno,		 
            string_agg(fam.nombre,' / ') AS nombres_padres,
            --string_agg( fam.correo,',' ) AS correos,--
            array_to_json(array_agg(to_json(fam.correo))) AS correos, 
            string_agg(fam.token,' ') as tokens
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
                enviarReciboComplemento(row.correos, row.nombres_padres,id_pago);
            }else{
                console.log("No se encontraron registros de padres para el alumno "+id_alumno);
            }
        });
};

function enviarReciboComplemento(lista_correos, nombres_padres,id_pago) {

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
          `,[id_pago,id_pago],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];
                console.log("Enviando correo a "+JSON.stringify(lista_correos));
                //console.log("info "+JSON.stringify(row));
                enviarCorreoReciboPago(
                    lista_correos,
                    "Recibo de pago ",
                    {
                        titulo: "Magic Intelligence",
                        nombre_empresa: "Magic Intelligence",
                        nombre_cliente: nombres_padres,
                        pago : {
                                fecha: row.fecha,
                                pago:row.pago,
                                forma_pago:row.forma_pago,
                                factura: row.identificador_factura,
                                numero_cargos: row.count_cargos,
                                cargos : row.cargos
                            },
                        alumno : {
                            nombre : row.nombre_alumno,
                            apellidos : row.apellidos_alumno,
                            grupo : row.nombre_grupo
                        },
                        sucursal :{
                            nombre: row.nombre_sucursal,
                            direccion : row.direccion_sucursal
                        },
                        mensaje_pie :"Agradecemos tu confianza. Attentamente Magic Intelligence."
                    });
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
                    cc :mailOptions.cc,
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


module.exports = {
    notificarReciboPago,
    enviarCorreoTest,
    enviarCorreoCambioSucursal,
    enviarCorreoClaveFamiliar

}