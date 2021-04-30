
const request = require('request');

const API_CLOUD = 'http://localhost:5100/imagen';

const guardarImagen = () => {

    return new Promise((resolve, reject) => {       
        request.post(${API_CLOUD}´, {
            json: paramSend
        }, (error, res, body) => {
            if (error) {
                console.log(" x x x x x x ERROR AL SUBIR IMAGEN x x x xx x x ");
                console.error(error);                
                reject(error)
                return;
            }            
            console.log(body);
            resolve(body);            
        })
        
    });
};


//const = 

module.exports = { guardarImagen };