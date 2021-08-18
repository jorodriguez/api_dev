const Pool = require('pg').Pool
const dotenv = require('dotenv');
dotenv.config();
const configEnv = require('../config/configEnv');

//Nuevos parametros a la DB
/*
const dbParams = {
   user: 'orvjgdhm',
    host: 'chunee.db.elephantsql.com',
    database: 'orvjgdhm',
    password: 'pWTDM9e0GbSBYRVLU8JOussSx6OB3u-8',
    port: 5432,
    ssl: { rejectUnauthorized: false }
};*/


//dev
/*
const dbParams = {
    user: 'steifvljsbjelz',
     host: 'ec2-52-72-125-94.compute-1.amazonaws.com',
     database: 'ddouqvi1mtviob',
     password: '5b1387564423855725fa5fa33c91696d5baf3f4362876a2dc329dcc80e46ebed',
     port: 5432,
     ssl: { rejectUnauthorized: false }
 }
 ;*/

//db desarrollo
/*
const dbParams = {
    user: (process.env.USER_DB || 'pffyesodvpvsrp'),
    host: (process.env.HOST_DB || 'ec2-174-129-242-183.compute-1.amazonaws.com'),
    database: (process.env.DATABASE_NAME || 'd83inhs3bq9ufb'),
    password: (process.env.PASSWORD_DB ||'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019'),
    port: (process.env.PORT_DB ||5432),
    ssl:true
   // ssl: { rejectUnauthorized: false }
};*/



//const dbParams = dbParamsDev;

const pool = new Pool({
    user: configEnv.USER_DB,
    host: configEnv.HOST_DB,
    database: configEnv.DATABASE_NAME,
    password: configEnv.PASSWORD_DB,
    port: configEnv.PORT_DB,
    max: 5,
    /*idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,*/
    ssl: { rejectUnauthorized: false }
});

module.exports = {
    pool
};