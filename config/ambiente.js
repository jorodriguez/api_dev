
const vars_dev = require('./vars_develop.json');
const vars_prod = require('./vars_production.json');

//const variables = (process.env.ENV == 'PRODUCTION') ? vars_prod : vars_dev; 

//cambiar a true cuando se actualize produccion
module.exports = {
    configuracion: {
        'secret': 'supersecret',
        env: '"PRODUCTION"',
        enviar_mensajes: true
    }
  //  variables
};

