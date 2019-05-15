const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const db = require('./services/usuario');
const alumno = require('./services/alumno');
const asistencia = require('./services/asistencia');

const port = process.env.PORT || 5000;

app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
  });
  

//es un middleware que serializa los cuerpos de las respuestas 
//   para poder invocar response.param
app.use(bodyParser.json())
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);


/*
app.use((req, res, next) => {

	res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE'); // If needed
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type'); // If needed
    res.setHeader('Access-Control-Allow-Credentials', true); // If needed
    next();
});


*/


//usar los queries importados 
app.post('/login', db.login);
app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById);
app.post('/users', db.createUser);
app.put('/users/:id', db.updateUser);
app.delete('/users/:id', db.deleteUser);

//alumno
app.get('/alumnos', alumno.getAlumnos);
app.get('/alumnos/:id', alumno.getAlumnoById);
app.post('/alumnos', alumno.createAlumno);
app.put('/alumnos/:id', alumno.updateAlumno);
app.delete('/alumnos/:id', alumno.deleteAlumno);

//asistencia
app.get('/asistencia/alumnos_recibidos', asistencia.getAlumnosRecibidos);
app.get('/asistencia/alumnos_por_recibidos', asistencia.getAlumnosPorRecibir);
app.post('/asistencia/entradaAlumnos', asistencia.registrarEntradaAlumnos);
app.post('/asistencia/salidaAlumnos', asistencia.registrarSalidaAlumnos);


app.get('/', (request, response) => {
	response.json({ info: 'MagicIntelligence API' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port}.`)
});

app.use(function(error, req, res, next) {
  // Gets called because of `wrapAsync()`
  res.json({ message: error.message });
});
