
#!/bin/bash
echo "Iniciando configuración de variables de ambiente DEVELOPMENT HEROKU" 
heroku config:set API_URL=https://api-ambiente-desarrollo.herokuapp.com TYPE_SRV=DEVELOPMENT --app aplicacion-ambiente-desarrollo


echo "Iniciando configuración en el ambiente de PRODUCTION HEROKU " 
heroku config:set API_URL=https://api-ambiente-produccion.herokuapp.com TYPE_SRV=PRODUCTION --app aplicacion-ambiente-produccion

echo "Registro de variables en ambientes satisfactorio..."


echo " -----------  "
echo "Configuracion de API DEVELOPMENT"
