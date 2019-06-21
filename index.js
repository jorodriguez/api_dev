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

app.get('/formas_pago', formas_pago.getFormasPago);

//Mensajes
//app.get('/mensaje', mensajeria.sendMessage);

app.get('/', (request, response) => {
	response.json({ info: 'MagicIntelligence API v1.0.10' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port} v1.0.10`)
});



//--- TAREAS PROGRAMADAS ------
//https://www.npmjs.com/package/node-cron

/*schedule.scheduleJob('1 * * * * *', function(){
	console.log('Corriendo el proceso automatico (o__=)');
});*/

//--Calcular horas extras . proceso que corre cada 30 min

schedule.scheduleJob('0 */31 * * * 1-5', function(){
//schedule.scheduleJob('0 */31 * * * 1-5', function () {
	console.log('CALCULANDO CARGOS DE HORAS EXTRAS DE ALUMNOS ' + new Date());
	try {
		tareas_programadas.ejecutarProcesoHorasExtrasAuto();

	} catch (e) {
		console.log("Error al ejecutar el proceso de calculo de horas extras " + e);
	}

});


schedule.scheduleJob('0 */33 * * * 1-5', function () {
	console.log('PROCESO DE REVISION DE SALIDA DE ALUMNOS ' + new Date());
	//FIXME : para pruebas
	try {
		tareas_programadas.ejecutarProcesoNotificacionProximaSalidaAlumno();
	} catch (e) {
		console.log("Error al ejecutar el proceso de revision de salida " + e);
	}
});



schedule.scheduleJob('0 */35 * * * 1-5', function () {
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

