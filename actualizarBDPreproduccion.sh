
#!/bin/bash
echo "Iniciando copia de Base de datos de produccion a Preproducción" 

heroku pg:copy DATABASE HEROKU_POSTGRESQL_TEAL --app develop1
