
const { pool } = require('../db/conexion');
const Joi = require('@hapi/joi');
const handle = require('../helpers/handlersErrors');
const { validarToken } = require('../helpers/helperToken');

// GET a Login 
const login = (request, response) => {
	try {
		console.log("En el login ");
		const { correo, password } = request.body;

		pool.query('SELECT * FROM usuario WHERE correo = $1 AND password = $2 AND eliminado = false',
			[correo, password],
			(error, results) => {
				if (error) {
					handle.callbackError(error, response);
					return;
				}
				console.log("results.rowCount " + results.rowCount);
				console.log("results.rowCount " + results.rows);
				if (results.rowCount > 0) {
					response.status(200).json(results.rows[0]);
				} else {
					response.status(200).json({ mensaje: "Usuario no encontrado" });
				}
			});
	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}
};

//GET — /users | getUsers()
const getUsers = (request, response) => {
	try {	
		validarToken(request,response);		

		pool.query('SELECT * FROM usuario ORDER BY id ASC', (error, results) => {
			if (error) {
				handle.callbackError(error, response);
				return;
			}
			response.status(200).json(results.rows)
		});

	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}

};

//GET — /users/:id | getUserById()
const getUserById = (request, response) => {
	try {
		validarToken(request,response);		

		const id = parseInt(request.params.id);

		pool.query('SELECT * FROM usuario WHERE id = $1', [id], (error, results) => {
			if (error) {
				handle.callbackError(error, response);
				return;
			}
			response.status(200).json(results.rows)
		});
	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}
};


//  POST — users | createUser()
const createUser = (request, response) => {
	try {
		validarToken(request,response);		

		const { nombre, correo, password } = request.body;

		pool.query('INSERT INTO USUARIO (NOMBRE,CORREO,PASSWORD) VALUES($1,$2,$3)', [nombre, correo, password], (error, results) => {
			if (error) {
				handle.callbackError(error, response);
				return;
			}
			response.status(201).send(`User added with ID: ${results.insertId}`)
		})

	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}
};


// PUT — /users/:id | updateUser()
const updateUser = (request, response) => {
	try {
		validarToken(request,response);				   

		const id = parseInt(request.params.id)
		const { nombre, correo } = request.body

		pool.query(
			'UPDATE usuario SET nombre = $1, correo = $2  WHERE id = $3',
			[nombre, correo, id],
			(error, results) => {
				if (error) {
					handle.callbackError(error, response);
					return;
				}
				response.status(200).send(`User modified with ID: ${id}`)
			});

	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}
};

// DELETE — /users/:id | deleteUser()
const deleteUser = (request, response) => {
	try {
		validarToken(request,response);		

		const id = parseInt(request.params.id)

		pool.query('DELETE FROM usuario WHERE id = $1', [id], (error, results) => {
			if (error) {
				handle.callbackError(error, response);
				return;
			}
			response.status(200).send(`User deleted with ID: ${id}`)
		});

	} catch (e) {
		handle.callbackErrorNoControlado(e, response);
	}
}


module.exports = {
	login,
	getUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
}