// config.js
const dotenv = require('dotenv');
dotenv.config();

//endpoint: process.env.API_URL,
//masterKey: process.env.API_KEY,
//port: process.env.PORT

module.exports = {
    dbParams:{
        user: 'vbkxmhcwhsnoxe',
        host: 'ec2-54-243-197-120.compute-1.amazonaws.com',
        database: 'd3cledlk3uuch6',
        password: 'ba3232ca7f43cbd24ae67032e8a29a530e7f2e50b7a68b7d9e63ff545e6d04fb',
        port: 5432,
        ssl: { rejectUnauthorized: false }
    }
};