const Pool = require('pg').Pool
const dotenv = require('dotenv');
dotenv.config();

//const { dbParams } = require('../config/config');

/*const dbParams = {
    user: 'guard_user_dev',
    host: 'siscop.mpg-ihsa.com.mx',
    database: 'guard_dev',
    password: 'ba3232ca7f43cbd24ae67032e8a29a530e7f2e50b7a68b7d9e63ff545e6d04fb',
    port: 5432,
    ssl:  { rejectUnauthorized: false }
}
*/
     
//db desarrollo

const dbParams = {
    user: (process.env.USER_DB || 'pffyesodvpvsrp'),
    host: (process.env.HOST_DB || 'ec2-174-129-242-183.compute-1.amazonaws.com'),
    database: (process.env.DATABASE_NAME || 'd83inhs3bq9ufb'),
    password: (process.env.PASSWORD_DB ||'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019'),
    port: (process.env.PORT_DB ||5432),
    ssl: { rejectUnauthorized: false }
}

/*
const dbParams = {
    user: 'pffyesodvpvsrp',
    host: 'ec2-174-129-242-183.compute-1.amazonaws.com',
    database: 'd83inhs3bq9ufb',
    password: 'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019',
    port:5432,
    ssl: { rejectUnauthorized: false }
}*/

//const dbParams = dbParamsDev;

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: true
});


/*
const pool = new Pool({
    user:process.env.USER_DB,
    host: process.env.HOST_DB,
    database: process.env.DATABASE_NAME,
    password: process.env.PASSWORD_DB,
    port: process.env.PORT_DB,    
    ssl: true
});*/


module.exports = {
    pool
};