
#!/bin/bash
########   VARIABLES DE CONFIGURACION DE BD - ENV=DESARROLLO  #####
echo "Configuración de variables de ambiente de BD LOCAL"

heroku config:get ENV DATABASE_NAME HOST_BD USER_BD -s PORT_BD PASSWORD_BD SEND_MESSAGE_MOVIL >> .env --app api-ambiente-desarrollo;

 