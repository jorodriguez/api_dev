const Pool = require('pg').Pool
const dotenv = require('dotenv');
dotenv.config();

//Nuevos parametros a la DB
/*
const dbParams = {
   user: 'abrrmwtzwwecjj',
    host: 'ec2-54-174-229-152.compute-1.amazonaws.com',
    database: 'd8q9p1up9bd7b7',
    password: '5fd81b93106ce7208d5456059519a5f3d5c29870600bfc63d820f1616540f295',
    port: 5432,
    ssl: { rejectUnauthorized: false }
};
*/

//production
/*
const dbParams = {
    user: 'rrqxxqgp',
     host: 'batyr.db.elephantsql.com',
     database: 'rrqxxqgp',
     password: 'e8_STv62MOApjO8CGr7ApToTeOg9B8Il',
     port: 5432,
     ssl: { rejectUnauthorized: false }
 };*/

//db desarrollo

const dbParams = {
    user: (process.env.USER_DB || 'pffyesodvpvsrp'),
    host: (process.env.HOST_DB || 'ec2-174-129-242-183.compute-1.amazonaws.com'),
    database: (process.env.DATABASE_NAME || 'd83inhs3bq9ufb'),
    password: (process.env.PASSWORD_DB ||'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019'),
    port: (process.env.PORT_DB ||5432),
    ssl:true
   // ssl: { rejectUnauthorized: false }
};


//const dbParams = dbParamsDev;

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

module.exports = {
    pool
};