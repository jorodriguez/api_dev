const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const db = require('./services/usuario');
const alumno = require('./services/alumno');
const asistencia = require('./services/asistencia');
const grupo = require('./services/grupo');
const authController = require('./auth/AuthController');
const actividad = require('./services/actividad');
const inscripcion = require('./services/inscripcion');
const familiar = require('./services/familiar');
const parentesco = require('./services/parentesco');
const servicio = require('./services/servicio');
const formato_complemento = require('./services/formato_complemento');
const pagos = require('./services/pagos');
const mensajeria = require('./services/mensajesFirebase');
const tareas_programadas = require('./services/tareas_programadas');
const schedule = require('node-schedule');
const formas_pago = require('./services/formas_pago');
const { configuracion } = require('./config/ambiente');
const reporteDeudas = require('./services/reporteDeudas');
const utilerias = require('./services/utilerias');
const datos_facturacion = require('./services/datos_facturacion');
const gastos = require('./services/gastos');
const reporte_gastos = require('./services/reporteGastos');
const actividad_reporte = require('./services/actividad_reporte');
const authClientesController = require('./auth/AuthClientesController');
const correo_service = require('./utils/NotificacionService');
const sucursales = require('./services/sucursal');
const alumnoSucursal = require('./services/alumno_sucursal');
const conf = require('./services/configuracion');
const https = require("https");

const port = process.env.PORT || 5000;

//es un middleware que serializa los cuerpos de las respuestas 
//   para poder invocar response.param
app.use(bodyParser.json())
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

app.use((err, req, res, next) => {
	console.log("==========================================");
	if (res.headersSent) {
		return next(err);
	}
	res.status(500);
	res.render('error', { error: err });
});


//usar los queries importados 
app.post('/auth/login', authController.login);
app.post('/auth/register', authController.createUser);

//app.post('/login', db.login);
app.get('/users/:id_sucursal', db.getUsers);
app.get('/users/:id', db.getUserById);
//app.post('/users', db.createUser);
app.put('/users/:id', db.updateUser);
app.delete('/users/:id', db.deleteUser);

//alumno
app.get('/alumnos/:id_sucursal', alumno.getAlumnos);
app.get('/alumnos/id/:id', alumno.getAlumnoById);
app.post('/alumnos', alumno.createAlumno);
app.put('/alumnos/:id', alumno.updateAlumno);
app.delete('/alumnos/:id', alumno.deleteAlumno);

//asistencia
app.get('/asistencia/alumnos_recibidos/:id_sucursal', asistencia.getAlumnosRecibidos);
app.get('/asistencia/alumnos_por_recibidos/:id_sucursal', asistencia.getAlumnosPorRecibir);
app.post('/asistencia/entradaAlumnos', asistencia.registrarEntradaAlumnos);
app.post('/asistencia/salidaAlumnos', asistencia.registrarSalidaAlumnos);

//grupo
app.get('/grupos', grupo.getGrupos);


//actividades
app.get('/actividad/catalogo_actividad', actividad.getCatalogoActividades);
app.post('/actividad/registrar', actividad.registrarActividad);

//inscripcion
app.get('/inscripcion/:id_alumno', inscripcion.getFormatoInscripcion);
//app.post('/inscripcion/registrar', inscripcion.createFormatoInscripcion);
app.put('/inscripcion/:id', inscripcion.updateInscripcion);
app.delete('/inscripcion/:id', inscripcion.deleteFormatoInscripcion);

//familiar
app.get('/familiar/:id_alumno', familiar.getFamiliaresAlumno);
app.post('/familiar/:id_alumno', familiar.crearFamiliar);
app.put('/familiar/:id_familiar', familiar.modificarFamiliar);
app.put('/familiar/eliminar/:id_relacion', familiar.eliminarFamiliar);
app.get('/familiar/:id_parentesco/:apellidos_alumno/:id_sucursal', familiar.getFamiliareParaRelacionar);

//parentesco
app.get('/parentesco/:id_alumno', parentesco.getCatalogoParentescoAlumno);

//servicios
app.get('/servicios', servicio.getCatalogoServicios);

//complementos del formato de inscripcion
app.get('/valores_esperados/:id_formato', formato_complemento.getCatalogoValoresEsperados);

//pagos
app.post('/pagos/registrar', pagos.registrarPago);
app.post('/pagos/:id_alumno', pagos.registrarPago);
app.get('/pagos/:id_cargo_balance_alumno', pagos.getPagosByCargoId);

app.post('/cargos/registrar', pagos.registrarCargo);
app.get('/cargos', pagos.getCatalogoCargos);
app.get('/cargos/:id_alumno', pagos.getCargosAlumno);
app.get('/balance/:id_alumno', pagos.getBalanceAlumno);

app.get('/formas_pagos', formas_pago.getFormasPago);

//Reporte
app.get('/balance_sucursal', reporteDeudas.getReporteBalancePorSucursal);
app.get('/balance_alumnos_sucursal/:id_sucursal', reporteDeudas.getReporteBalanceAlumnosSucursal);

app.get('/balance_crecimiento', reporteDeudas.getReporteCrecimientoBalancePorSucursal);
app.get('/balance_crecimiento_alumnos/:id_sucursal', reporteDeudas.getReporteCrecimientoBalanceAlumnosSucursal);

app.get('/balance_crecimiento_global', reporteDeudas.getReporteCrecimientoGlobal);
app.get('/balance_crecimiento_mensual/:id_sucursal', reporteDeudas.getReporteCrecimientoMensualSucursal);
app.get('/alumnos_balance_crecimiento_mensual_sucursal/:id_sucursal/:mes_anio', reporteDeudas.getReporteAlumnosMensualCrecimiento);

//
app.get('/meses_activos', utilerias.getMesesActivos);
//app.get('/buscar_correo_padre/:correo', utilerias.findCorreoPadre);

//alumnos crecimiento mes
app.get('/alumnos_crecimiento_mes/:anio/:mes', reporteDeudas.getReporteAlumnosNuevosIngresosGlobal);

//Datos de facturacion
app.post('/datos_facturacion', datos_facturacion.guardarDatosFacturacionAlumno);
app.put('/datos_facturacion', datos_facturacion.actualizarRequiereFacturacionAlumno);

//gastos
app.get('/gastos/:co_sucursal/:anio_mes', gastos.getGastosPorSucursal);
app.get('/historico_gastos/:co_sucursal', gastos.getSumaMesGastosPorSucursal);
app.post('/gastos', gastos.registrarGasto);
app.put('/gastos', gastos.modificarGasto);
app.delete('/gastos/:id', gastos.eliminarGasto);
app.get('/tipos_gasto', gastos.getCatalogoTipoGasto);

//Reporte de gastos
//app.get('/reporte_gastos', reporte_gastos.getReporteGastosSucursalesMensual);
app.get('/reporte_gastos', reporte_gastos.getReporteGastosSucursalesMensualActual);
//app.get('/reporte_gastos/:mes_anio', reporte_gastos.getReporteGastosSucursalesMensual);
app.get('/reporte_gastos/:id_sucursal', reporte_gastos.getReporteGastosMensualesPorSucursalTrend);
app.get('/reporte_gastos/:id_sucursal/:mes_anio', reporte_gastos.getReporteDetalleGastosPorSucursal);
app.get('/reporte_gastos_global', reporte_gastos.getReporteGastosGlobal);
app.get('/reporte_gastos_mes_actual', reporte_gastos.getReporteGastoMensualActual);


//consultas para App
app.get('/actividades/:id_familiar',actividad_reporte.getActividadesRelacionadosFamiliar);

//Para movil
//app.get('/cargos_familiar/:id_familiar',actividad_reporte.getCargosAlumnosFamiliar);
//app.get('/cargos_pagados_familiar/:id_familiar',actividad_reporte.getCargosPagadosAlumnosFamiliar);
app.get('/balance_familiar_alumno/:id_familiar',actividad_reporte.getBalanceFamiliarAlumnos);

// modificar token de cliente
app.post('/cliente/:id_familiar',actividad_reporte.updateTokenMensajeriaFamiliar);
app.put('/cliente/:id_familiar',actividad_reporte.updateDatosFamiliar);

//reset password
app.get('/reset_password/:id_familiar',familiar.resetPasswordFamiliar);

//Login Clientes - Papás
app.post('/auth_cliente/login', authClientesController.loginCliente);
app.put('/auth_cliente/:id_familiar',authClientesController.cambioClaveFamiliar);

//reporte de mensualidades facturadas
app.get('/reporte_mensualidades/:id_sucursal', reporteDeudas.getReporteCargosFacturados);
app.get('/reporte_mensualidades', reporteDeudas.getReporteCargosFacturadosSucursal);

//configuracion
app.get('/configuracion', conf.getConfiguracion);

//Mensajes
app.get('/mensaje', mensajeria.sendMessage);

app.get('/enviar_correo', correo_service.enviarCorreoTest);

//sucursales y cambios
app.get('/sucursal',sucursales.getSucursales);
app.put('/cambio_sucursal/:id_alumno',alumnoSucursal.cambiarSucursalAlumno);

//app.put('/getInfoCorreoAlumnos',correo_service.getAlumnosInfoCorreoAlumnos);
app.put('/enviar_recordatorio_pago/:id_alumno',correo_service.enviarRecordatorioPago); 

//reporte ingresos vs cargos
app.get('/reporte_ingreso_menos_gasto_mensual/:id_sucursal/:mes',reporteDeudas.getReporteGastosIngresosSucursalPorMes);


app.get('/', (request, response) => {
	response.json({ info: 'MagicIntelligence API v1.0.15' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port} v1.0.15`)
});

//app.get('/encriptar/:clave', authController.encriptar);


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
				let todo = '';
				// called when a data chunk is received.
				response.on('data', (chunk) => {
					console.log("Todo bien al accesar al API");
				});
				response.on('end', () => {
					console.log("fin de la llamada  a la API");
				});
			}).on("error", (error) => {
				console.log("Error al acceesar al API: " + error.message);
			});

			https.get('https://aplicacion-ambiente-produccion.herokuapp.com', (response) => {
				let todo = '';
				// called when a data chunk is received.
				response.on('data', (chunk) => {
					console.log("Llamada a la APPLICATION OK");
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

schedule.scheduleJob('0 */31 * * * 1-5', function () { 
	//schedule.scheduleJob('0 */31 * * * 1-5', function () {
	console.log('CALCULANDO CARGOS DE HORAS EXTRAS DE ALUMNOS ' + new Date());
	try {
		tareas_programadas.ejecutarProcesoHorasExtrasAuto();

	} catch (e) {
		console.log("Error al ejecutar el proceso de calculo de horas extras " + e);
	}

});


schedule.scheduleJob('0 */33 * * * 1-5', function () {
//schedule.scheduleJob('0 */3 * * * 1-5', function () {	
	console.log('PROCESO DE REVISION DE SALIDA DE ALUMNOS ' + new Date());
	//FIXME : para pruebas
	try {
		tareas_programadas.ejecutarProcesoNotificacionProximaSalidaAlumno();
	} catch (e) {
		console.log("Error al ejecutar el proceso de revision de salida " + e);
	}
});



schedule.scheduleJob('0 */35 * * * 1-5', function () {
//schedule.scheduleJob('0 */2 * * * 1-5', function () {	
	console.log('PROCESO DE REVISION DE EXPIRACION DE TIEMPO DE ALUMNOS ' + new Date());
	//FIXME : para pruebas
	try {
		tareas_programadas.ejecutarProcesoNotificacionExpiracionTiempoAlumno();

	} catch (e) {
		console.log("Error al ejecutar el proceso de revision de expiración " + e);
	}
});


// Sec,Min,Hor,D,M,Y
schedule.scheduleJob('0 1 0 1 * *', function () {
	console.log('Agregar cargo de mensualidad ' + new Date());
	//tareas.generarBalanceAlumnos();

});

