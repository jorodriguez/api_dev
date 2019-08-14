
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');
const { configuracion } = require('../config/ambiente');
const nodemailer = require('nodemailer');
const templete = require('email-templates');

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
    port:465,
    //secure:true,
    secureConnection:true,
    service: 'gmail',
    auth: {
        //user: 'joel@magicintelligence.com',
        user: 'velocirraptor79.1@gmail.com',
        pass: '@@rmincesa'
    }, 
    tls:{
        ciphers:'SSLv3'
    }
});


//enviar correo de pruebas
const enviarCorreoTest = (request, response) => {
    console.log("@enviarCorreoTest");
    try {

        enviarCorreo('joel.rod.roj@hotmail.com','Test node',"<h3>hola esto es un correo desde node</h3>");

    } catch (e) {
        console.log("Error al enviar el correo "+e);
    }
};

const enviarCorreo = (para,asunto,html) => {
    console.log("@enviarCorreo");
    try {
        const mailData = {
            from : mailOptions.from,
            to:para,
            subject : asunto,
            html : html
        };
        
        transporter.sendMail(mailData, function (error, info) {
            if (error) {
                console.log("Error al enviar correo : "+error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        transporter.close();
    } catch (e) {
        console.log("Excepción en el envio de correo : "+e);
    }
};



module.exports = {
    enviarCorreoTest,
   // enviarCorreo
}