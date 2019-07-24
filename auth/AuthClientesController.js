
const { dbParams } = require('../config/config');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config/config');
const handle = require('../helpers/handlersErrors');

const Pool = require('pg').Pool;
const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});

// GET a Login 
const loginCliente = (request, response) => {

    console.log("En el login del cliente  ");
    try {
        const { correo, password } = request.body;

        console.log("correo " + correo + " " + password);

        pool.query(
            `
            select 
            f.id,
            f.nombre,
            f.telefono,
            f.fecha_nacimiento,
            f.correo,
            f.celular,
            f.religion,
            f.token as token_mensajeria,
            count(rel.id) as numero_hijos
        FROM co_familiar f left join co_alumno_familiar rel on rel.co_familiar = f.id and co_parentesco in (1,2)  
        where correo =  $1            
            and f.eliminado= false
            and rel.eliminado = false
        group by f.id
            `,
            [correo],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }

                if (results.rowCount > 0) {

                    var usuario = results.rows[0];

                    var passwordIsValid = bcrypt.compareSync(password, usuario.password);

                    if (!passwordIsValid) return response.status(401).send({ auth: false, token: null, usuario: null ,mensaje:"Usuario no encontrado."});

                    var token = jwt.sign({ id: results.id }, config.secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });

                    response.status(200).send({ auth: true, token: token, usuario: usuario });
                } else {

                    response.status(400).send({ auth: false, token: null, usuario: null });
                }
            });

    } catch (e) {
        
        response.status(400).send({ auth: false, token: null });
    }
};


const encriptar = (request, response) => {
    
    var pass = request.params.clave;

    var hashedPassword = bcrypt.hashSync(pass, 8);
/*    var hashedPassword="sin hash";

    console.log("Clave "+pass);

    bcrypt.hash(pass, 8, function(err, hash) {
        // Store hash in your password DB.

        hashedPassword = hash;
        console.log(""+hash);
        console.log("error "+err);
    
    });
*/
    
    response.status(400).send(hashedPassword);
}

module.exports = {
    loginCliente
};