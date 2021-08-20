const dotenv = require('dotenv').config();

module.exports = {
    ENV: process.env.ENV || 'local_development',    
    PORT: process.env.PORT || 5000,
    USER_DB: process.env.USER_DB || '',
    HOST_DB: process.env.HOST_DB || '',
    DATABASE_NAME:process.env.DATABASE_NAME || '',
    PASSWORD_DB:process.env.PASSWORD_DB ||'',
    PORT_DB : process.env.PORT_DB ||5432,
    EMAIL_CONFIG: process.env.EMAIL_CONFIG && JSON.parse(`${process.env.EMAIL_CONFIG}`),
    MESSAGE_MOVIL_SERVICE_ACTIVE: process.env.MESSAGE_MOVIL_SERVICE_ACTIVE || false,
    TOKEN_SALT: process.env.TOKEN_SALT
};