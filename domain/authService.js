const authDao = require('../dao/authDao');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/configJwt');

class Login {
    constructor(auth, token, usuario, mensaje) {
        this.auth = auth;
        this.token = token;
        this.usuario = usuario;
        this.mensaje = mensaje;
    }
}


const login = (correo, password) => {
    console.log("En el login ");

    return new Promise((resolve, reject) => {
        if (correo == null || correo == undefined || correo == ''
            || password == null || password == undefined || password == ''
        ) {
            reject(new Login(false, null, null, "Validación fallida"));
            return;
        }

        console.log("correo " + correo + " " + password);
        authDao.login(correo)
            .then(result => {

                if (result != null) {

                    var usuario = result;

                    console.log("===> " + JSON.stringify(usuario));

                    var passwordIsValid = bcrypt.compareSync(password, usuario.password);

                    if (!passwordIsValid) {                        
                        reject(new Login(false, null, null, "Password no válido"));
                        return;
                    }

                    var token = jwt.sign({ id: result.id }, config.secret, {
                        // expires in 24 hours
                        expiresIn: 86400
                    });

                    resolve(new Login(true, token, usuario, "Login"));
                    
                } else {
                    reject(new Login(false, null, null, "Password no válido"));                    
                }
            });
    });
};

const obtenerSucursalesUsuario = (id)=>{    
    return authDao.obtenerSucursalesUsuario(id);
};

const cambiarSucursalUsuario = (idUsuario,idSucursal,token)=>{    
    return new Promise((resolve, reject) => {
        authDao
        .cambiarSucursalUsuario(idUsuario,idSucursal)
        .then(result=>{            
            if (result != null) {

                authDao
                .refreshLogin(idUsuario)
                .then(result=>{
                    var usuario = result;

                    console.log("===> " + JSON.stringify(usuario));                      
                    /*
                    var token = jwt.sign({ id: result.id }, config.secret, {
                        // expires in 24 hours
                        expiresIn: 86400
                    });*/
    
                    resolve(new Login(true, token, usuario, "Login"));

                });              
                
            } else {
                reject(new Login(false, null, null, "Sucedió un error"));                    
            }

        }).catch(error=>{
            reject(new Login(false, null, null, "Sucedió un error"));
        });

    });

    //return authDao.cambiarSucursalUsuario(idUsuario,idSucursal);
};


const refreshLogin = (idUsuario)=>{    
    return authDao.refreshLogin(idUsuario);
};


module.exports = {
    login,obtenerSucursalesUsuario,cambiarSucursalUsuario,refreshLogin
};