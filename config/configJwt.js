const configEnv = require('./configEnv');
module.exports = {       
    secret: configEnv.TOKEN_SALT || 'supersecret'
};
