
const vars_dev = require('./vars_develop.json');
const vars_prod = require('./vars_production.json');

const variables = (process.env.ENV == 'PRODUCTION') ? vars_prod : vars_dev; 
//const variables = vars_prod ; 

//Cambiar atributo enviar_mensajes : true, si se va a produccion
//env : 'PRODUCTION', si se va a produccion
/*
module.exports = {
    configuracion: {
        'secret': 'supersecretDevelop',
        env: '"DEV"',
        enviar_mensajes: false
    }
};
*/


//cambiar a true cuando se actualize produccion
module.exports = {
    configuracion: {
        'secret': 'supersecret',
        env: '"PRODUCTION"',
        enviar_mensajes: true
    },
    variables
};

//psql --set=sslmode=require -h ec2-54-243-197-120.compute-1.amazonaws.com -p 5432 -U vbkxmhcwhsnoxe -d d3cledlk3uuch6