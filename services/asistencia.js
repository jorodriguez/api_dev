
const handle = require('../helpers/handlersErrors');
const asistenciaService = require('../dao/asistenciaDao');

const getAlumnosRecibidos = (request, response) => {
    console.log("@getAlumnosRecibidos");
    try {
        console.log("Iniciando consulta de alumno ");

        const id_sucursal = parseInt(request.params.id_sucursal);

        asistenciaService
            .getAlumnosRecibidos(id_sucursal)
            .then(results => {
                //console.log("Alumnos "+JSON.stringify(results));
                response.status(200).json(results);
            }).catch(error => {
                console.log("exepcion al obtener la lisa de alumno "+error);
                handle.callbackError(error, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

const getAlumnosPorRecibir = (request, response) => {
    console.log("@getAlumnosPorRecibir");
    try {

        const id_sucursal = parseInt(request.params.id_sucursal);
        asistenciaService
            .getAlumnosPorRecibir(id_sucursal)
            .then(results => {
                response.status(200).json(results);
            })
            .catch(error => {
                handle.callbackError(error, response);
            })
            ;

       
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};


const registrarEntradaAlumnos = (request, response) => {
    console.log("@registrarEntrada");
    try {

        const params = { ids, genero } = request.body;

        asistenciaService
            .registrarEntradaAlumnos(params)
            .then(results => {
                response.status(200).json(results);
            })
            .catch(error => {
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);

    }
};


const registrarSalidaAlumnos = (request, response) => {
    console.log("@registrarSalidaAlumnos");

    try {
        console.log(" = " + JSON.stringify(request.body));
        const params = { listaSalida =[], listaCalcularHorasExtras =[], genero } = request.body;
        asistenciaService
            .registrarSalidaAlumnos(params)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                handle.callbackError(error, response);
            })

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
};

//lista simple
const getListaAsistenciaPorSucursalFecha = (request, response) => {
    console.log("@getListaAsistenciaPorSucursalFecha");

    try {

        const { id_sucursal, fecha } = request.params;

        console.log("id_suc = " + id_sucursal);
        console.log("fecha = " + fecha);

        asistenciaService
            .getListaAsistenciaPorSucursalFecha(id_sucursal, fecha)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                handle.callbackError(error, response);
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


//lista simple
const getListaAsistenciaMesPorAlumno = (request, response) => {
    console.log("@getListaAsistenciaPorAlumno");

    try {
        const { id_alumno } = request.params;

        console.log("id_alumno = " + id_alumno);

        asistenciaService
            .getListaAsistenciaMesPorAlumno(id_alumno)
            .then(results => {
                response.status(200).json(results);
            }).catch(error => {
                handle.callbackError(error, response);
            })

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

// para componente de calendrio
const getListaMesAsistenciaPorAlumno = (request, response) => {
    console.log("@getListaMeAsistenciaPorAlumno");
    try {

        const { id_alumno } = request.params;

        console.log("id_alumno = " + id_alumno);
        
        asistenciaService
            .getListaMesAsistenciaPorAlumno(id_alumno)
            .then(results=>{
                console.log("resultado lista de asistencia");
                response.status(200).json(results);
            }).catch(error=>{
                handle.callbackError(error, response);
            });
    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}


const ejecutarProcesoSalidaAutomatica = () => {
    try {

        asistenciaService
            .ejecutarProcesoSalidaAutomatica();

      
    } catch (e) {
        console.log("@excepcion " + e);
    }
}


const getListaAsistenciaAlumnoPorSalirConHorasExtras = (request, response) => {
    console.log("@getListaAsistenciaAlumnoPorSalirConHorasExtras");

    try {

        const params = { lista_id_asistencias = [] } = request.params;

        asistenciaService
            .getListaAsistenciaAlumnoPorSalirConHorasExtras(params)
            .then(results=>{
                console.log("resultado lista de asistencia");
                response.status(200).json(results);
            }).catch(error=>{
                handle.callbackError(error, response);  
            });

    } catch (e) {
        handle.callbackErrorNoControlado(e, response);
    }
}

/*
const ejecutarProcedimientoCalculoHorasExtra = (ids_alumnos, id_genero) => {
    console.log("@ejecutarProcedimeintoCalculoHorasExtra");

    try {

        console.log("IDS recibidos " + ids_alumnos);

        pool.query("SELECT generar_horas_extras_alumno('" + ids_alumnos + "'," + id_genero + ");",
            (error, results) => {
                if (error) {
                    console.log("Error al ejecutar el procedimiento calculo extra " + error);
                    return;
                }
                console.log("Se ejecuto el procedimiento de horas extras " + JSON.stringify(results));
            });
    } catch (e) {
        console.log("Error al ejecutar el procedimiento calculo extra " + e);
    }
};*/


/* Lista de asistencias e inasistencias por alumno por mes  */
const getListaMesAsistenciaPorSucursal = (request, response) => {
    console.log("@getListaMesAsistenciaPorSucursal");

    const { id_sucursal } = request.params;

    console.log("id_sucursal = " + id_sucursal);
    
    asistenciaService
        .getListaMesAsistenciaPorSucursal(id_sucursal)
        .then(results =>{
            response.status(200).json(results);
        }).catch(error=>{
            handle.callbackError(error, response);
        });

}


module.exports = {
    getAlumnosRecibidos,
    getAlumnosPorRecibir,
    registrarEntradaAlumnos,
    registrarSalidaAlumnos,
    getListaAsistenciaPorSucursalFecha,
    ejecutarProcesoSalidaAutomatica,
    getListaAsistenciaMesPorAlumno,
    getListaMesAsistenciaPorAlumno,
    getListaAsistenciaAlumnoPorSalirConHorasExtras,
    getListaMesAsistenciaPorSucursal
}
