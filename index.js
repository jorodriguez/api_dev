const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./services/usuario');
const alumno = require('./services/alumno');
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
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
})

//usar los queries importados 
app.post('/login', db.login);
app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById);
app.post('/users', db.createUser);
app.put('/users/:id', db.updateUser);
app.delete('/users/:id', db.deleteUser);

//alumno
app.get('/alumnos', alumno.getAlumnos);
app.post('/alumnos', alumno.createAlumno);
app.put('/alumnos/:id', alumno.updateAlumno);
app.delete('/alumnos/:id', alumno.deleteAlumno);

app.get('/', (request, response) => {
	response.json({ info: 'MagicIntelligence API' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port}.`)
});

