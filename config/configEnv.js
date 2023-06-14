const dotenv = require('dotenv').config();

module.exports = {
    ENV: process.env.ENV || 'local_development',
    PORT: process.env.PORT || 5000,
    USER_DB: process.env.USER_DB || '',
    HOST_DB: process.env.HOST_DB || '',
    DATABASE_NAME: process.env.DATABASE_NAME || '',
    PASSWORD_DB: process.env.PASSWORD_DB || '',
    PORT_DB: process.env.PORT_DB || 5432,
    EMAIL_CONFIG: process.env.EMAIL_CONFIG && JSON.parse(`${process.env.EMAIL_CONFIG}`),
    MESSAGE_MOVIL_SERVICE_ACTIVE: process.env.MESSAGE_MOVIL_SERVICE_ACTIVE || false,
    TOKEN_SALT: process.env.TOKEN_SALT,
    BBC_MAIL_ALL: process.env.BBC_MAIL_ALL || '',

    USE_MAGIC_EMAIL: process.env.USE_MAGIC_EMAIL || false,
    HOST_MAGIC_EMAIL: process.env.HOST_MAGIC_EMAIL || '',
    PORT_MAGIC_EMAIL: process.env.PORT_MAGIC_EMAIL || 465,
    USER_MAGIC_EMAIL: process.env.USER_MAGIC_EMAIL || false,
    PASSWORD_MAGIC_EMAIL: process.env.PASSWORD_MAGIC_EMAIL || '',
    WHATSAPP: process.env.WHATSAPP || '8110208406',

};