
#!/bin/bash
echo "Iniciando copia de Base de datos de produccion a Preproducción" 

heroku pg:copy HEROKU_POSTGRESQL_JADE HEROKU_POSTGRESQL_TEAL --app develop1
