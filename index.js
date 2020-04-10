const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { pool } = require('./db/conexion');

//const usuario = require('./services/usuario');
const alumno = require('./services/alumno');
const asistencia = require('./services/asistencia');
const authController = require('./auth/AuthController');
const actividad = require('./services/actividad');
const inscripcion = require('./services/inscripcion');
const familiar = require('./services/familiar');
const parentesco = require('./services/parentesco');
const formato_complemento = require('./services/formato_complemento');
const pagos = require('./services/pagos');
const cargos = require('./services/cargos');
const mensajeria = require('./services/mensajesFirebase');
//const tareas_programadas = require('./services/tareas_programadas');
const schedule = require('node-schedule');
const { configuracion } = require('./config/ambiente');
const reporteDeudas = require('./services/reporteDeudas');
const reporte_mensualidades = require('./services/reporte_mensualidades');
const utilerias = require('./services/utilerias');
const datos_facturacion = require('./services/datos_facturacion');
const gastos = require('./services/gastos');
const reporte_gastos = require('./services/reporteGastos');
const actividad_reporte = require('./services/actividad_reporte');
const authClientesController = require('./auth/AuthClientesController');
const sucursales = require('./services/sucursal');
const alumnoSucursal = require('./services/alumno_sucursal');
const usuarioService = require('./services/usuario');
const catagolos = require('./services/catalogos');
const conf = require('./services/configuracion');
const https = require("https");
const { validarTokenCompleto } = require('./helpers/helperToken');
const asistenciaUsuario = require('./services/asistencia_usuario');
//const tiendaService = require('./services/tiendaService');
const recargoService = require('./services/recargos');
const catalogoRecursos = require('./services/catalogo_recursos');
const reporteContabilidad = require('./services/reporteContabilidad');

const catalogoDescuento = require('./services/cat_descuento');

const port = process.env.PORT || 5000;

//es un middleware que serializa los cuerpos de las respuestas 
//   para poder invocar response.param
app.use(bodyParser.json());
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

app.use((req, res, next) => {	
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,x-access-token'); // If needed	
	res.setHeader('Access-Control-Allow-Credentials', true); // If needed
	next();
});

/*
app.use((err, req, res, next) => {
	console.log("==========================================");
	if (res.headersSent) {
		return next(err);
	}
	res.status(500);
	res.render('error', { error: err });
});
*/

const POST = (url, metodo) => {
	console.log("Registrando post");
	app.post(url, (request, response) => {
		let respuesta = validarTokenCompleto(request, response);

		if (!respuesta.tokenValido) {
			console.log(" ((((( Token invalido  )))))");
			return response.status(respuesta.status).send(respuesta);
		} else {
			console.log(" PASA EL TOKEN ");
			metodo(request, response);
		}		
	});
};

const GET = (url, metodo) => {
	console.log("registrando get");
	app.get(url, (request, response) => {
		let respuesta = validarTokenCompleto(request, response);

		if (!respuesta.tokenValido) {
			console.log(" ((((( Token invalido  )))))");
			return response.status(respuesta.status).send(respuesta);
		} else {
			console.log(" PASA EL TOKEN ");
			metodo(request, response);
		}		
	});
};


const PUT = (url, metodo) => {
	console.log("registrando put");
	app.put(url, (request, response) => {
		let respuesta = validarTokenCompleto(request, response);

		if (!respuesta.tokenValido) {
			console.log(" ((((( Token invalido  )))))");
			return response.status(respuesta.status).send(respuesta);
		} else {
			console.log(" PASA EL TOKEN ");
			metodo(request, response);
		}		
	});
};

const DELETE = (url, metodo) => {
	console.log("registrando DELETE");
	app.delete(url, (request, response) => {
		let respuesta = validarTokenCompleto(request, response);

		if (!respuesta.tokenValido) {
			console.log(" ((((( Token invalido  )))))");
			return response.status(respuesta.status).send(respuesta);
		} else {
			console.log(" PASA EL TOKEN ");
			metodo(request, response);
		}		
	});
};


//usar los queries importados 
app.post('/auth/login', authController.login);
//app.post('/auth/register', authController.createUser);

//POST('/login', usuario.login);
/*GET('/users/:id_sucursal', usuario.getUsers);
GET('/users/:id', usuario.getUserById);
//POST('/users', usuario.createUser);
PUT('/users/:id', usuario.updateUser);
DELETE('/users/:id', usuario.deleteUser);
*/

//Cambio de sucursal
GET('/sucursal_usuario/:id',authController.obtenerSucursalesUsuario);
PUT('/sucursal_usuario',authController.cambiarSucursalUsuario);

//alumno
GET('/alumnos/:id_sucursal', alumno.getAlumnos);
GET('/alumnos/id/:id', alumno.getAlumnoById);
POST('/alumnos', alumno.createAlumno);
PUT('/alumnos/:id', alumno.updateAlumno);
PUT('/alumnos/fecha_limite_pago/:id', alumno.modificarFechaLimitePagoMensualidad);
DELETE('/alumnos/:id', alumno.deleteAlumno);


//asistencia
GET('/asistencia/alumnos_recibidos/:id_sucursal', asistencia.getAlumnosRecibidos);
GET('/asistencia/alumnos_por_recibidos/:id_sucursal', asistencia.getAlumnosPorRecibir);
POST('/asistencia/entradaAlumnos', asistencia.registrarEntradaAlumnos);
POST('/asistencia/salidaAlumnos', asistencia.registrarSalidaAlumnos);
GET('/asistencia/salidaAlumnos/alumno_tiempo_extra/:lista_id_asistencias',asistencia.getListaAsistenciaAlumnoPorSalirConHorasExtras);
// Reporte de asistencias
GET('/asistencia/reporte/:id_sucursal/:fecha',asistencia.getListaAsistenciaPorSucursalFecha);
GET('/asistencia/reporte_por_alumno/:id_alumno',asistencia.getListaAsistenciaPorAlumno);
GET('/asistencia/reporte_mes_alumno/:id_alumno',asistencia.getListaMesAsistenciaPorAlumno);
GET('/asistencia/reporte_mes_sucursal/:id_sucursal',asistencia.getListaMesAsistenciaPorSucursal);
GET('/asistencia/mensual/:id_alumno',asistencia.getListaAsistenciaMesPorAlumno);


//Asistencia Usuarios
GET('/asistencia_usuarios/por_entrar/:id_sucursal',asistenciaUsuario.getListaUsuarioPorEntrar);
GET('/asistencia_usuarios/por_salir/:id_sucursal',asistenciaUsuario.getListaUsuarioPorSalir);
POST('/asistencia_usuarios/entrada', asistenciaUsuario.registrarEntradaUsuario);
POST('/asistencia_usuarios/salida', asistenciaUsuario.registrarSalidaUsuario);

GET('/asistencia_usuarios/reporte_mes/:id_sucursal/:fecha_inicio/:fecha_fin',asistenciaUsuario.getListaFaltasUsuariosSucursalRangoFecha);
GET('/asistencia_usuarios/usuario/:id_usuario/:fecha_inicio/:fecha_fin',asistenciaUsuario.getDetalleFaltasUsuariosRangoFecha);


//grupo
GET('/grupos', catagolos.getGrupos);

//actividades
GET('/actividad/catalogo_actividad', actividad.getCatalogoActividades);
POST('/actividad/registrar', actividad.registrarActividad);

//inscripcion
GET('/inscripcion/:id_alumno', inscripcion.getFormatoInscripcion);
//POST('/inscripcion/registrar', inscripcion.createFormatoInscripcion);
PUT('/inscripcion/:id', inscripcion.updateInscripcion);
DELETE('/inscripcion/:id', inscripcion.deleteFormatoInscripcion);

//familiar
GET('/familiar/:id_alumno', familiar.getFamiliaresAlumno);
POST('/familiar/:id_alumno', familiar.crearFamiliar);
PUT('/familiar/:id_familiar', familiar.modificarFamiliar);
PUT('/familiar/eliminar/:id_relacion', familiar.eliminarFamiliar);
GET('/familiar/:id_parentesco/:apellidos_alumno/:id_sucursal', familiar.getFamiliareParaRelacionar);

//parentesco
GET('/parentesco/:id_alumno', parentesco.getCatalogoParentescoAlumno);

//genero
GET('/genero', catagolos.getCatGenero);

//servicios
GET('/servicios', catagolos.getServicios);

//complementos del formato de inscripcion
GET('/valores_esperados/:id_formato', formato_complemento.getCatalogoValoresEsperados);

//pagos
POST('/pagos/registrar', pagos.registrarPago);
POST('/pagos/:id_alumno', pagos.registrarPago);
GET('/pagos/:id_cargo_balance_alumno', pagos.getPagosByCargoId);

POST('/cargos/registrar', cargos.registrarCargo);
GET('/cargos', cargos.getCatalogoCargos);
GET('/cargos/:id_alumno', cargos.getCargosAlumno);
GET('/balance/:id_alumno', cargos.getBalanceAlumno);
PUT('/cargos/:id_alumno', cargos.eliminarCargos);

// descuentos - catalogo
GET('/descuento/:id_empresa',catalogoDescuento.getDescuentos);

//GET('/cargos/meses_adeuda/:id_alumno', pagos.obtenerMesesAdeudaMensualidad);
app.get('/cargos/meses_adeuda/:id_alumno', cargos.obtenerMesesAdeudaMensualidad);

//recargos proximos
GET('/mensualidad/vence_semana_actual/:id_sucursal', recargoService.obtenerPagosVencenSemanaActual);

GET('/formas_pagos', catagolos.getFormasPago);

//Reporte
GET('/balance_sucursal/:id_usuario', reporteDeudas.getReporteBalancePorSucursal);
GET('/balance_alumnos_sucursal/:id_sucursal/:id_tipo_cargo', reporteDeudas.getReporteBalanceAlumnosSucursal);

GET('/balance_crecimiento/:id_usuario', reporteDeudas.getReporteCrecimientoBalancePorSucursal);
GET('/balance_crecimiento_alumnos/:id_sucursal', reporteDeudas.getReporteCrecimientoBalanceAlumnosSucursal);

GET('/balance_crecimiento_global/:id_usuario', reporteDeudas.getReporteCrecimientoGlobal);
GET('/balance_crecimiento_mensual/:id_sucursal', reporteDeudas.getReporteCrecimientoMensualSucursal);
GET('/alumnos_balance_crecimiento_mensual_sucursal/:id_sucursal/:mes_anio', reporteDeudas.getReporteAlumnosMensualCrecimiento);


GET('/meses_activos', utilerias.getMesesActivos);
//GET('/buscar_correo_padre/:correo', utilerias.findCorreoPadre);

//alumnos crecimiento mes
GET('/alumnos_crecimiento_mes/:anio/:mes/:id_usuario', reporteDeudas.getReporteAlumnosNuevosIngresosGlobal);

//Datos de facturacion
POST('/datos_facturacion', datos_facturacion.guardarDatosFacturacionAlumno);
PUT('/datos_facturacion', datos_facturacion.actualizarRequiereFacturacionAlumno);

//gastos
GET('/gastos/:co_sucursal/:anio_mes', gastos.getGastosPorSucursal);
GET('/historico_gastos/:co_sucursal', gastos.getSumaMesGastosPorSucursal);
POST('/gastos', gastos.registrarGasto);
PUT('/gastos', gastos.modificarGasto);
DELETE('/gastos/:id', gastos.eliminarGasto);
GET('/tipos_gasto', gastos.getCatalogoTipoGasto);

//Reporte de gastos
//GET('/reporte_gastos', reporte_gastos.getReporteGastosSucursalesMensual);
GET('/reporte_gastos_sucursales/:id_usuario', reporte_gastos.getReporteGastosSucursalesMensualActual);
//GET('/reporte_gastos/:mes_anio', reporte_gastos.getReporteGastosSucursalesMensual);
GET('/reporte_gastos/:id_sucursal', reporte_gastos.getReporteGastosMensualesPorSucursalTrend);
GET('/reporte_gastos/:id_sucursal/:mes_anio', reporte_gastos.getReporteDetalleGastosPorSucursal);
GET('/reporte_gastos_global/:id_usuario', reporte_gastos.getReporteGastosGlobal);
GET('/reporte_gastos_mes_actual/:id_usuario', reporte_gastos.getReporteGastoMensualActual);


//catalogo de maestros
GET('/usuario/:id_sucursal', usuarioService.getUsuariosPorSucursal);
POST('/usuario', usuarioService.crearUsuario);
PUT('/usuario', usuarioService.modificarUsuario);
PUT('/usuario/:id_usuario', usuarioService.desactivarUsuario);


//Para movil
//Login Clientes - Papás
//consultas para App
app.get('/actividades/:id_familiar', actividad_reporte.getActividadesRelacionadosFamiliar);
app.post('/auth_cliente/login', authClientesController.loginCliente);
app.put('/auth_cliente/:id_familiar', authClientesController.cambioClaveFamiliar);
app.get('/balance_familiar_alumno/:id_familiar', actividad_reporte.getBalanceFamiliarAlumnos);

//catalogo de recursos
app.get('/recurso_familiar/:id_familiar', catalogoRecursos.getAlumnosPorFamiliar);  
app.get('/recurso_grupo/:id_grupo/:id_sucursal', catalogoRecursos.getRecursosPorGrupo);  

app.post('/emocion', actividad_reporte.registrarToqueEmocion);

// modificar token de cliente
app.post('/cliente/:id_familiar', actividad_reporte.updateTokenMensajeriaFamiliar);
app.put('/cliente/:id_familiar', actividad_reporte.updateDatosFamiliar);


//app.get('/productos/:pagina',tiendaService.getProductos);

//reset password
GET('/reset_password/:id_familiar', familiar.resetPasswordFamiliar);

//reporte de mensualidades facturadas
GET('/sucursal_usuario/sucursales_asignadas/:id_usuario',usuarioService.getSucursalesUsuario);
GET('/reporte_mensualidades/:id_sucursal/:anio', reporte_mensualidades.getMensualidadesAlumnosSucursal);
GET('/cargos/filtro_anios/:id_sucursal', cargos.obtenerFiltroAniosCargosSucursal);

GET('/reporte_mensualidades_mes_actual/:id_usuario', reporte_mensualidades.getReporteContadoresSucursalesMesActual);
GET('/reporte_mensualidades/:id_sucursal/:id_usuario', reporte_mensualidades.getReporteContadoresMesesPorSucursal);
GET('/reporte_mensualidades/:id_sucursal/:mes', reporte_mensualidades.getReporteMensualidadesPorSucursalMes);

//configuracion
GET('/configuracion', conf.getConfiguracion);

//Mensajes
GET('/mensaje', mensajeria.sendMessage);

//GET('/enviar_correo', correo_service.enviarCorreoTest);

//sucursales y cambios
GET('/sucursal', sucursales.getSucursales);
PUT('/cambio_sucursal/:id_alumno', alumnoSucursal.cambiarSucursalAlumno);

//PUT('/getInfoCorreoAlumnos',correo_service.getAlumnosInfoCorreoAlumnos);
//PUT('/enviar_recordatorio_pago/:id_alumno', correo_service.enviarRecordatorioPago);

//reporte ingresos vs cargos
GET('/reporte_ingreso_menos_gasto_mensual/:id_sucursal/:mes', reporteDeudas.getReporteGastosIngresosSucursalPorMes);

// Reporte de cobranza - para la contadora
//GET('/reporte_cobranza/:id_usuario/:fecha_inicio/:fecha_fin',reporteContabilidad.getReporteCobranzaPorFechas) ;
PUT('/reporte_cobranza',reporteContabilidad.getReporteCobranzaPorFechas) ;

//Cargos, eliminacion y consulta
//GET('/sucursal/:id_sucursal/cargos',reporteDeudas.getAllAlumnosCargos);


app.get('/', (request, response) => {
	console.log(process.env);
	console.log("=====================");
	console.log(JSON.stringify(pool));
	response.json({ info: `MagicIntelligence API v1.0.30 (env:${process.env.ENV}) CATA-VIDEOS`})
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port} v1.0.30 - CATA-VIDEOS (env:${process.env.ENV})`);
});

//GET('/encriptar/:clave', authController.encriptar);


//--- TAREAS PROGRAMADAS ------
//https://www.npmjs.com/package/node-cron

/*schedule.scheduleJob('1 * * * * *', function(){
	console.log('Corriendo el proceso automatico (o__=)');
});*/

//--Calcular horas extras . proceso que corre cada 30 min

schedule.scheduleJob('0 */10 12-24 * * 1-5', function () {
	//schedule.scheduleJob('0 */2 * * * 1-5', function () {
	console.log("========== MANTENIENDO VIVA LA APP ==================");
	try {
		if (configuracion.env != 'DEV') {

			https.get('https://api-ambiente-produccion.herokuapp.com', (response) => {				
				// called when a data chunk is received.
				response.on('data', (chunk) => {
					console.log("Todo bien al accesar al API "+chunk);
				});
				response.on('end', () => {
					console.log("fin de la llamada  a la API");
				});
			}).on("error", (error) => {
				console.log("Error al acceesar al API: " + error.message);
			});

			https.get('https://aplicacion-ambiente-produccion.herokuapp.com', (response) => {				
				// called when a data chunk is received.
				response.on('data', (chunk) => {
					console.log("Llamada a la APPLICATION OK "+chunk);
				});
				response.on('end', () => {
					console.log("Fin de llamada APPLICATION");
				});
			}).on("error", (error) => {
				console.log("Error en llamada a la APPLICATION: " + error.message);
			});
		}

	} catch (e) {
		console.log("Excepcion al hacer ping" + e);
	}
});

//schedule.scheduleJob('0 */31 * * * 1-5', function () {
	//schedule.scheduleJob('0 */31 * * * 1-5', function () {
	//console.log('CALCULANDO CARGOS DE HORAS EXTRAS DE ALUMNOS ' + new Date());
	//try {
	//	//tareas_programadas.ejecutarProcesoHorasExtrasAuto(); desabilitado
	//} catch (e) {
//		console.log("Error al ejecutar el proceso de calculo de horas extras " + e);
//	}
//});


//schedule.scheduleJob('0 */33 * * * 1-5', function () {
schedule.scheduleJob('0 */33 * * * 1-5', function () {	
	console.log('PROCESO DE REVISION DE SALIDA DE ALUMNOS ' + new Date());	
	try {
		//tareas_programadas.ejecutarProcesoNotificacionProximaSalidaAlumno();
	} catch (e) {
		console.log("Error al ejecutar el proceso de revision de salida " + e);
	}
});



schedule.scheduleJob('0 */35 * * * 1-5', function () {
	//schedule.scheduleJob('0 */2 * * * 1-5', function () {	
	console.log('PROCESO DE REVISION DE EXPIRACION DE TIEMPO DE ALUMNOS ' + new Date());
	//FIXME : para pruebas
	try {
//		tareas_programadas.ejecutarProcesoNotificacionExpiracionTiempoAlumno();

	} catch (e) {
		console.log("Error al ejecutar el proceso de revision de expiración " + e);
	}
});


// Sec,Min,Hor,D,M,Y
schedule.scheduleJob('0 1 0 1 * *', function () {
	console.log('Agregar cargo de mensualidad ' + new Date());
	//tareas.generarBalanceAlumnos();
});

/********* Calcular Recargos de mensualidades *********/
//schedule.scheduleJob('0 1 0 1 * *', function () {
//schedule.scheduleJob('0 48 16 * * *', function () {
schedule.scheduleJob({hour: 17, minute:47,second:20}, function () {
	console.log('Agregar recargos de mensualidad ' + new Date());
	try{
			//recargoService.procesoRecargosMensualidad();
	}catch(error){
		console.error("[index] Error al ejecutar el proceso de recargos "+error);
	}
	
});
/********* Calcular Recargos de mensualidades *********/

///Enviar reportes de recargos
schedule.scheduleJob({hour: 9, minute:3,second:20}, function () {
	console.log('Enviando reporte y recordatorios  de recargos de mensualidad ' + new Date());
try{
		recargoService.ejecutarEnvioRecordatorioPagoMensualidadPadres();

}catch(error){
	console.error("[index] Error al ejecutar el proceso de recargos "+error);
}

});

/*
var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [0, new schedule.Range(1, 5)];
rule.hour = 20;
rule.minute = 0;*/
schedule.scheduleJob({hour: 20, minute: 0}, function () {	
		console.log('PROCESO DE SALIDA ALUMNOS ' + new Date());	
		try {
			asistencia.ejecutarProcesoSalidaAutomatica();
		} catch (e) {
			console.log("Error al ejecutar el proceso de revision de salida " + e);
		}
});
	

