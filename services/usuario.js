
const Pool = require('pg').Pool

const { dbParams } = require('../config/config');

const pool = new Pool({
	user : dbParams.user,
	host: dbParams.host,
	database: dbParams.database,
	password: dbParams.password,
	port: dbParams.port,
	ssl: { rejectUnauthorized: false }	
});


// GET a Login 
const login = (request, response) => {
	const { correo, password } = request.body

	pool.query('SELECT * FROM usuario WHERE correo = $1 AND password = $2 AND eliminado = false',
		[correo, password],
		(error, results) => {
			if (error) {
				throw error
			}
			console.log("===== "+results.rowCount);
			console.log("===== "+results.rows[0]);
			response.status(200).json(results.rows);
		});

};

//GET — /users | getUsers()
const getUsers = (request, response) => {
	pool.query('SELECT * FROM usuario ORDER BY id ASC', (error, results) => {
		if (error) {
			console.log(error);
			throw error
		}
		response.status(200).json(results.rows)
	})
};

//GET — /users/:id | getUserById()
const getUserById = (request, response) => {
	const id = parseInt(request.params.id);

	pool.query('SELECT * FROM usuario WHERE id = $1', [id], (error, results) => {
		if (error) {
			throw error
		}
		response.status(200).json(results.rows)
	})
};


//  POST — users | createUser()
const createUser = (request, response) => {
	const { nombre, correo,password } = request.body;
	
	pool.query('INSERT INTO USUARIO (NOMBRE,CORREO,PASSWORD) VALUES($1,$2,$3)', [nombre, correo, password], (error, results) => {
		if (error) {
			throw error
		}
		response.status(201).send(`User added with ID: ${results.insertId}`)
	})
};


// PUT — /users/:id | updateUser()
const updateUser = (request, response) => {
	const id = parseInt(request.params.id)
	const { nombre, correo } = request.body

	pool.query(
		'UPDATE usuario SET nombre = $1, correo = $2  WHERE id = $3',
		[nombre, correo, id],
		(error, results) => {
			if (error) {
				throw error
			}
			response.status(200).send(`User modified with ID: ${id}`)
		}
	)
};

// DELETE — /users/:id | deleteUser()
const deleteUser = (request, response) => {
	const id = parseInt(request.params.id)

	pool.query('DELETE FROM usuario WHERE id = $1', [id], (error, results) => {
		if (error) {
			throw error
		}
		response.status(200).send(`User deleted with ID: ${id}`)
	})
}


module.exports = {
	login,
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,	
}