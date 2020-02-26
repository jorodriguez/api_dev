
const { pool } = require('../db/conexion');
const handle = require('../helpers/handlersErrors');

const getCatalogoParentescoAlumno = (request, response) => {
    console.log("@getParentesco");
    try {
       // validarToken(request,response);
        
        var id_alumno = request.params.id_alumno;

        pool.query(" SELECT * " +
            "   FROM co_parentesco p" +
            "   WHERE p.id not in (" +
            "       select p.id" +
            "        from co_alumno_familiar f inner join co_parentesco p on f.co_parentesco = p.id" +
            "           and p.sistema" +
            "        where f.co_alumno = $1 and f.eliminado = false 							" +
            ") and p.eliminado = false"+
            " order by p.id",
            [id_alumno],
            (error, results) => {
                if (error) {
                    handle.callbackError(error, response);
                    return;
                }
                response.status(200).json(results.rows);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

module.exports = {
    getCatalogoParentescoAlumno
};