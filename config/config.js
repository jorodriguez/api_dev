// config.js
const dotenv = require('dotenv');
dotenv.config();

//endpoint: process.env.API_URL,
//masterKey: process.env.API_KEY,
//port: process.env.PORT
//cinectarme con psql
//heroku pg:psql postgresql-sinuous-19615 --app develop1

//BASE DE DATOS DE DESARROLLO

module.exports = {    
    dbParams:{
        user: 'pffyesodvpvsrp',
        host: 'ec2-174-129-242-183.compute-1.amazonaws.com',
        database: 'd83inhs3bq9ufb',
        password: 'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    },
    'secret': 'supersecret'   
};


//BASE DE DATOS DE PRODUCCION
/*module.exports = {
    dbParams:{
        user: 'vbkxmhcwhsnoxe',
        host: 'ec2-54-243-197-120.compute-1.amazonaws.com',
        database: 'd3cledlk3uuch6',
        password: 'ba3232ca7f43cbd24ae67032e8a29a530e7f2e50b7a68b7d9e63ff545e6d04fb',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    },
    'secret': 'supersecret'
};*/

//conect con psql

//psql --set=sslmode=require -h ec2-54-243-197-120.compute-1.amazonaws.com -p 5432 -U vbkxmhcwhsnoxe -d d3cledlk3uuch6