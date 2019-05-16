const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const db = require('./services/usuario');
const alumno = require('./services/alumno');
const asistencia = require('./services/asistencia');
const grupo = require('./services/grupo');
const authController = require('./auth/AuthController');

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

app.get('/', (request, response) => {
	response.json({ info: 'MagicIntelligence API v1.0.0' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port} v1.0.`)
});


