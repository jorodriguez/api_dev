
const usuarioService = require('../domain/usuarioService');
const handle = require('../helpers/handlersErrors');

const crearUsuario = (request, response) => {

	try {

		const usuarioData = { nombre,co_tipo_usuario, correo, id_sucursal, hora_entrada, hora_salida,sueldo_mensual, genero } = request.body;

		var proceso = null;		

		if (usuarioData.correo != null && usuarioData.correo != undefined && usuarioData.correo != '') {
			console.log("USUARIO CON CORREO " + usuarioData.correo);
			proceso = usuarioService.crearUsuarioConCorreo(usuarioData);
		} else {
			console.log("USUARIO NORMAL (SIN CORREO)");
			proceso = usuarioService.crearUsuario(usuarioData);
		}

		proceso.then(result => {
			//enviar notificacion de alta de usuario
			console.log("nuevo usuario registrado " + JSON.stringify(result));

			//let mensajeRetorno = new MensajeRetorno(true,"Usuario registrado",null);
			//ENVIAR CONTRASEÑA 
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
/*
const crearUsuario = (request, response) => {

	try {

		//const usuarioData = { nombre, co_tipo_usuario, correo, id_sucursal, hora_entrada, hora_salida, genero } = request.body;
		const usuarioData = { nombre, co_tipo_usuario, id_sucursal, hora_entrada, hora_salida, genero } = request.body;

		console.log("USUARIO NORMAL (SIN CORREO)");

		usuarioService.crearUsuario(usuarioData)
			.then(result => {
				console.log("nuevo usuario registrado " + JSON.stringify(result));
				response.status(200).json(result);

			}).catch(error => {
				console.error(error);
				handle.callbackError(error, response);
			});

	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
}*/


const modificarUsuario = (request, response) => {

	try {

		const usuarioData = { id, nombre, correo, hora_entrada, hora_salida,sueldo_mensual, genero } = request.body;

		var proceso = null;
		if (usuarioData.correo != null && usuarioData.correo != undefined && usuarioData.correo != '') {
			console.log("MODIFICAR USUARIO CON CORREO " + usuarioData.correo);
			proceso = usuarioService.modificarUsuarioConCorreo(usuarioData);
		} else {
			console.log("MODIFICAR USUARIO SIN CORREO");
			proceso = usuarioService.modificarUsuario(usuarioData);
		}

		proceso.then(result => {
			console.log(" usuario modificado " + result);
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
		const usuarioData = { motivo_baja, fecha_baja, genero } = request.body;
		//const idUsuario = request.params.id_usuario;

		usuarioService
			.desactivarUsuario(idUsuario, usuarioData)
			.then(result => {

				console.log(" usuario de baja " + result);
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


const getSucursalesUsuario = (request, response) => {

	try {
		const idUsuario = request.params.id_usuario;

		usuarioService
			.getSucursalesUsuario(idUsuario)
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


const desactivarUsuarioReporte = async (request, response) => {

	try {
		const {idUsuario, genero}  = request.params.body;

		const resultado = await usuarioService.desactivarUsuarioReporte({idUsuario,genero});

		response.status(200).json(resultado);
	} catch (e) {
		console.error(e);
		handle.callbackErrorNoControlado(e, response);
	}
};


module.exports = {
	crearUsuario, modificarUsuario, desactivarUsuario, getUsuariosPorSucursal, buscarUsuarioPorId,getSucursalesUsuario,desactivarUsuarioReporte
};