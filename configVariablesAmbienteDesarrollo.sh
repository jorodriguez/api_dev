
#!/bin/bash
########   VARIABLES DE CONFIGURACION DE BD - ENV=DESARROLLO  #####
echo "Configuración de variables de ambiente de BD DESARROLLO"
heroku config:set ENV=DEVELOPMENT DATABASE_NAME=d83inhs3bq9ufb HOST_BD=ec2-174-129-242-183.compute-1.amazonaws.com USER_BD=pffyesodvpvsrp PORT_BD=5432 PASSWORD_BD=f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019 SEND_MESSAGE_MOVIL=false MAIL_PARAMS="{
    host: 'mail.magicintelligence.com',
    port: 465,
    secureConnection: false,
    auth: {
        user: 'info@magicintelligence.com',
        pass:'Clave.01'
        //pass: 'Secreta.03'
    },
    tls: {
        ciphers: 'SSLv3'
    }
}" --app api-ambiente-desarrollo;


echo "Configuración de variables de ambiente de APLICACION DESARROLLO"
heroku config:set ENV=DEVELOPMENT  API_URL=https://api-ambiente-desarrollo.herokuapp.com  --app aplicacion-ambiente-desarrollo

echo "Registro de variables en ambientes satisfactorio..."


echo " -----------  "
echo "Configuracion de API DEVELOPMENT"
 