
// imporar los queries 
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const db = require('./queries');
//const port = 3000;
const port = process.env.PORT || 5000



//es un middleware que serializa los cuerpos de las respuestas 
//   para poder invocar response.param
app.use(bodyParser.json())
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);


//usar los queries importados 
app.post('/login', db.login);
app.get('/users', db.getUsers);
app.get('/users/:id', db.getUserById);
app.post('/users', db.createUser);
app.put('/users/:id', db.updateUser);
app.delete('/users/:id', db.deleteUser);

app.get('/', (request, response) => {
	response.json({ info: 'Node.js, Express, and Postgres API' })
});

app.listen(port, () => {
	console.log(`App corriendo en el puerto ${port}.`)
});

