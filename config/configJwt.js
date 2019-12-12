// config.js
const dotenv = require('dotenv');
dotenv.config();

// sal para JWT
module.exports = {       
    secret: 'supersecret'   
};

//conect con psql

//psql --set=sslmode=require -h ec2-54-243-197-120.compute-1.amazonaws.com -p 5432 -U vbkxmhcwhsnoxe -d d3cledlk3uuch6