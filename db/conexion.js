const Pool = require('pg').Pool
const dotenv = require('dotenv');
dotenv.config();

//Nuevos parametros a la DB
/*const dbParams = {
   user: 'abrrmwtzwwecjj',
    host: 'ec2-54-174-229-152.compute-1.amazonaws.com',
    database: 'd8q9p1up9bd7b7',
    password: '5fd81b93106ce7208d5456059519a5f3d5c29870600bfc63d820f1616540f295',
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

/*
const dbParams = {
    user: (process.env.USER_DB || 'muvhcrlnhvhfhm'),
    host: (process.env.HOST_DB || 'ec2-34-233-0-64.compute-1.amazonaws.com'),
    database: (process.env.DATABASE_NAME || 'decta401vvp19u'),
    password: (process.env.PASSWORD_DB ||'65c27377175e6d57b498e1d383b0e173ece396c6278bec01ae391cb7f1970f72'),
    port: (process.env.PORT_DB ||5432),
    ssl: { rejectUnauthorized: false }
   // ssl: { rejectUnauthorized: false }
};

*/

//const dbParams = dbParamsDev;

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

/*
const pool = new Pool({
    connectionString:process.env.URL_CONEXION || 'postgres://muvhcrlnhvhfhm:65c27377175e6d57b498e1d383b0e173ece396c6278bec01ae391cb7f1970f72@ec2-34-233-0-64.compute-1.amazonaws.com:5432/decta401vvp19u',
    ssl: { rejectUnauthorized: false }
});
*/
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