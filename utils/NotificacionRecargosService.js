
const { CARGOS, TEMA_NOTIFICACION } = require('./Constantes');
const correoService = require('./CorreoService');
const { TEMPLATES } = require('./CorreoService');
const { SIN_COPIA } = require('./Constantes');
const { isEmptyOrNull } = require('../utils/Utils');
const alumnoService = require('../domain/alumnoService');

//Enviar 
function enviarRecordatorioPagoMesualidad(idAlumno, listaCargosMensualidad, fechaLimitePago) {
    console.log("@enviarRecordatorioPagoMesualidad");

    if (isEmptyOrNull(cargoMensualidad) || isEmptyOrNull(idAlumno) || isEmptyOrNull(fechaLimitePago)) {
        console.error("XXX  Faltan valores para enviar el recordatorio de pago");
        return;
    }

    alumnoService
        .getCorreosTokenAlumno(idAlumno)
        .then(result => {

            let params;
            params.nombres_padres = result.nombres_padres;
            params.nota_inicial = `Tu fecha límite de pago de mensualidad se acerca y no queremos que tengas recargos 
                                    por esto te recordamos que tu fecha de límite es el próximo ${fechaLimitePago}.`;
            params.lista_cargos = listaCargosMensualidad;
            params.alumno = result.nombre_alumno;
            //params.fecha_limite = `Fecha Limite ${fechaLimitePago}`;
            params.nota_final = "";

            correoService
                .enviarCorreoFamiliaresAlumno(
                    "Recordatorio de Pago",
                    result.correos,
                    SIN_COPIA,
                    params,
                    TEMPLATES.TEMPLATE_RECORDATORIO_PAGO_MENSUALIDAD
                );

        }).catch(error => console.error(error));

}


function enviarReporteProxRecargos(sucursal, listaCargosMensualidad) {
    console.log("@enviarReporteProxRecargos suc"+sucursal.id_sucursal);

    if (isEmptyOrNull(cargoMensualidad) || isEmptyOrNull(sucursal)) {
        console.error("XXX  Faltan valores para enviar el recordatorio de pago a sucursal");
        return;
    }
      
    //Hoy es fecha limite para pagar mensualidades, te presentamos los alumnos que mañana se le agregará un recargo.
    let params;    
    params.nota_inicial = `Hoy es fecha límite para pagar mensualidades, te presentamos los alumnos que mañana se le agregará un recargo.`;
    params.lista_cargos = listaCargosMensualidad;    
    params.sucursal = sucursal.nombre_sucursal;
    
    params.nota_final = "";

    correoService
        .enviarCorreoParaTemaNotificacion(
            "Recargos para mañana",
            sucursal.id_sucursal,
            TEMA_NOTIFICACION.ID_TEMA_REPORTE_RECARGOS,
            params,
            TEMPLATES.TEMPLATE_REPORTE_PROX_RECARGOS
        );


}


module.exports = { enviarRecordatorioPagoMesualidad,enviarReporteProxRecargos }