
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');

const pool = new Pool({
    user: dbParams.user,
    host: dbParams.host,
    database: dbParams.database,
    password: dbParams.password,
    port: dbParams.port,
    ssl: { rejectUnauthorized: false }
});


//GET — /alumnos | getAlumnos()
const getAlumnos = (request, response) => {
    pool.query('SELECT * FROM co_alumno WHERE eliminado=false ORDER BY nombre ASC',
        (error, results) => {
            if (error) {
                console.log(error);
                throw error
            }
            response.status(200).json(results.rows);
        })
};

const createAlumno = (request, response) => {

    console.log("creat alumno");
    const { nombre, apellidos, fecha_nacimiento,
        alergias, nota, hora_entrada,
        hora_salida, costo_inscripcion, costo_colegiatura,
        minutos_gracia, foto, fecha_reinscripcion
    } = request.body;

    pool.query("INSERT INTO CO_ALUMNO(" +
        "co_sucursal,co_grupo,co_padre," +
        "nombre,apellidos,fecha_nacimiento," +
        "alergias,nota,hora_entrada," +
        "hora_salida,costo_inscripcion,costo_colegiatura," +
        "minutos_gracia,foto,fecha_reinscripcion," +
        "genero" +
        ")" +
        "VALUES(" +
        "$1,$2,$3," +
        "$4,$5,$6," +
        "$7,$8,$9," +
        "$10,$11,$12," +
        "$13,$14,$15," +
        "$16" +
        ");"
        , [
            1, 1, 1,
            nombre, apellidos, fecha_nacimiento,
            alergias, nota, hora_entrada,
            hora_salida, costo_inscripcion, costo_colegiatura,
            minutos_gracia, foto, fecha_reinscripcion,
            1
        ],
        (error, results) => {
            if (error) {
                console.log(error);
                response.status(404).send("[]");
                return;
            }
            response.status(200).json(results.rows)
        })
};



// PUT — /alumno/:id | updateAlumno()
const updateAlumno = (request, response) => {
    const id = parseInt(request.params.id)
    //const { nombre, correo } = request.body

    const p = getParams(request.body);
    console.log("===== "+p);
    pool.query(
        "UPDATE CO_ALUMNO  " +
        "SET nombre = $2, " +
        "apellidos = $3 ," +
        "fecha_nacimiento = $4," +
        "alergias = $5," +
        "nota = $6," +
        "hora_entrada = $7," +
        "hora_salida=$8," +
        "costo_inscripcion = $9," +
        "costo_colegiatura = $10," +
        "minutos_gracia = $11," +
        "foto= $12," +
        "fecha_reinscripcion = $13" +
        " WHERE id = $1",
        [
            id,
            p.nombre, p.apellidos,p.fecha_nacimiento,p.alergias,p.nota,
            p.hora_entrada,p.hora_salida,p.costo_inscripcion,
            p.costo_colegiatura,p.minutos_gracia,p.foto,p.fecha_reinscripcion
        ],
        (error, results) => {
            if (error) {
                console.log("ERROR "+error);                
                //throw error
                response.status(404).send("[]");
                return;
            }
            response.status(200).send(`User modified with ID: ${id}`)
        }
    )
};

// DELETE — /alumnos/:id | deleteAlumno()
const deleteAlumno = (request, response) => {
	const id = parseInt(request.params.id)

	pool.query('UPDATE CO_ALUMNO SET eliminado = true WHERE id = $1', [id], (error, results) => {
		if (error) {
			throw error
		}
		response.status(200).send(`User deleted with ID: ${id}`)
	})
}

const getParams = (body) => {

    const parametros = {
        nombre, apellidos, fecha_nacimiento,
        alergias, nota, hora_entrada,
        hora_salida, costo_inscripcion, costo_colegiatura,
        minutos_gracia, foto, fecha_inscripcion,
        genero
    } = body;

    return parametros;
};


//GET — /alumnos | getById()
const getAlumnoById = (request, response) => {
    console.log("  getAlumnoById");
    const id = parseInt(request.params.id);
   
    console.log(" Alumno por id = "+id);
    
    pool.query('SELECT * FROM co_alumno WHERE id=$1 AND eliminado=false',
    [id],
        (error, results) => {
            if (error) {
                console.log(error);
                //throw error
                response.status(400).json({});
                return ;
            }
            if(results.rowCount > 0){
                response.status(200).json(results.rows[0]);
            }else{
                response.status(400).json({});
            }
        })
};


module.exports = {
    getAlumnos,
    createAlumno,
    updateAlumno,
    deleteAlumno,
    getAlumnoById
}