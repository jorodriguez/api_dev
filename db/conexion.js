
const Pool = require('pg').Pool

//const { dbParams } = require('../config/config');
/*
const dbParams = {
    user: 'vbkxmhcwhsnoxe',
    host: 'ec2-54-243-197-120.compute-1.amazonaws.com',
    database: 'd3cledlk3uuch6',
    password: 'ba3232ca7f43cbd24ae67032e8a29a530e7f2e50b7a68b7d9e63ff545e6d04fb',
    port: 5432,
    ssl: { rejectUnauthorized: false }
}*/


//db desarrollo

const dbParams = {
    user: 'pffyesodvpvsrp',
    host: 'ec2-174-129-242-183.compute-1.amazonaws.com',
    database: 'd83inhs3bq9ufb',
    password: 'f4de35950e23261169a79f8ac3007630aaefc8ff887c147b9283a8f68b165019',
    port: 5432,
    ssl: { rejectUnauthorized: false }
}

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