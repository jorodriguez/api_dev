

//Cambiar atributo enviar_mensajes : true, si se va a produccion
//env : 'PRODUCTION', si se va a produccion
/*
module.exports = {
    configuracion: {
        'secret': 'supersecret',
        env: '"DEV"',
        enviar_mensajes: false
    }
};*/


module.exports = {
    configuracion: {
        'secret': 'supersecret',
        env: '"PRODUCTION"',
        enviar_mensajes: true
    }
};

//psql --set=sslmode=require -h ec2-54-243-197-120.compute-1.amazonaws.com -p 5432 -U vbkxmhcwhsnoxe -d d3cledlk3uuch6