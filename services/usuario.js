
const usuarioService = require('../domain/usuarioService');
const handle = require('../helpers/handlersErrors');
const { MensajeRetorno } = require('../utils/MensajeRetorno');

const crearUsuario = (request, response) => {

	try {

		const usuarioData = { nombre, correo, id_sucursal, hora_entrada, hora_salida, genero } = request.body;

		usuarioService
			.crearUsuario(usuarioData)
			.then(result => {
				//enviar notificacion de alta de usuario
				console.log("nuevao usuario registrado "+result);
				
				//let mensajeRetorno = new MensajeRetorno(true,"Usuario registrado",null);

				response.status(200).json(result.toJson());

			}).catch(error => {
				console.error(error);
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


const modificarUsuario = (request, response) => {

	try {		
		const idUsuario = request.params.id_usuario;
		const usuarioData = { nombre, correo, hora_entrada, hora_salida, genero } = request.body;

		usuarioService
			.modificarUsuario(idUsuario,usuarioData)
			.then(result => {
				
				console.log(" usuario modificado "+result);
				response.status(200).json(result);

			}).catch(error => {
				console.error(error);
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


const desactivarUsuario = (request, response) => {

	try {
		const idUsuario = request.params.id_usuario;
		const usuarioData = {  motivo_baja, fecha_baja, genero } = request.body;
		//const idUsuario = request.params.id_usuario;

		usuarioService
			.desactivarUsuario(idUsuario,usuarioData)
			.then(result => {
				
				console.log(" usuario de baja "+result);
				response.status(200).json(result);

			}).catch(error => {
				console.error(error)
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


const getUsuariosPorSucursal = (request, response) => {

	try {
		const idSucursal = request.params.id_sucursal;
		
		usuarioService
			.getUsuariosPorSucursal(idSucursal)
			.then(results => {
							
				response.status(200).json(results);

			}).catch(error => {
				console.error(error);
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


const buscarUsuarioPorId = (request, response) => {

	try {
		const idUsuario = request.params.id_usuario;
		
		usuarioService
			.buscarPorId(idUsuario)
			.then(results => {
							
				response.status(200).json(results);

			}).catch(error => {
				console.error(error);
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


module.exports = {
		crearUsuario,modificarUsuario,desactivarUsuario,getUsuariosPorSucursal,buscarUsuarioPorId
};