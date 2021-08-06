
#!/bin/bash
echo "Iniciando copia de Base de datos de produccion a Preproducción" 

heroku pg:copy DATABASE HEROKU_POSTGRESQL_TEAL --app develop1

#copiar base de datos de produccion a bd nueva
#Poner los parametros en variables de produccion
#Host
#    ec2-54-174-229-152.compute-1.amazonaws.com
#Database
#    d8q9p1up9bd7b7
#User
#    abrrmwtzwwecjj
#Port
#    5432
#Password
#    5fd81b93106ce7208d5456059519a5f3d5c29870600bfc63d820f1616540f295
#URI
#    postgres://abrrmwtzwwecjj:5fd81b93106ce7208d5456059519a5f3d5c29870600bfc63d820f1616540f295@ec2-54-174-229-152.compute-1.amazonaws.com:5432/d8q9p1up9bd7b7
#Heroku CLI
#heroku pg:psql postgresql-rigid-77232 --app develop1
#heroku pg:copy DATABASE HEROKU_POSTGRESQL_JADE --app develop1

heroku pg:copy HEROKU_POSTGRESQL_JADE HEROKU_POSTGRESQL_TEAL --app develop1

heroku pg:copy HEROKU_POSTGRESQL_JADE HEROKU_POSTGRESQL_RED --app develop1
