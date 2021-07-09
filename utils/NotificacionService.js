
const { pool } = require('../db/conexion');
const mensajeria = require('../services/mensajesFirebase');
const { CARGOS, TEMA_NOTIFICACION } = require('../utils/Constantes');
const { variables } = require('../config/ambiente');
const correoService = require('./CorreoService');
const { TEMPLATES } = require('./CorreoService');
const alumnoService = require('../domain/alumnoService');
const { obtenerEstadoCuentaAlumno } = require('../domain/cargoService');

const notificarCargo = (id_alumno, id_cargos) => {
    console.log("notificarCargo " + id_alumno + "    " + id_cargos);
    //ir por alumno
    alumnoService
        .getCorreosTokenAlumno(id_alumno)
        .then(results => {
            let row = results;
            if (row != null) {
                completarNotificacionCargo(row.correos, row.tokens, row.nombres_padres, row.nombre_alumno, id_cargos, row.co_sucursal);
            } else {
                console.log("No se encontraron registros de padres para el alumno " + id_alumno);
            }
        }).catch(error => console.error(error));
};

function completarNotificacionCargo(lista_correos, lista_tokens, nombres_padres, nombre_alumno, id_cargo, id_sucursal) {
    console.log("completar envio notificacion");
    if (lista_correos == null || lista_correos == undefined || lista_correos.length == []) {
        console.log("No existen correos para notificar el cargo");
        return;
    }

    pool.query(`SELECT cat.nombre as nombre_cargo,		
                    cat.id as id_cat_cargo,
                    cat.precio as cargo,
                    to_char(cargo.fecha,'dd-MM-YYYY') as fecha,
                    cargo.cantidad,
                    cargo.total as cargo, 
                    cargo.nota,
                    cargo.texto_ayuda,
                    cat.notificar
                FROM co_cargo_balance_alumno cargo inner join cat_cargo cat on cat.id = cargo.cat_cargo
                WHERE cargo.id = $1 and cargo.eliminado = false
            `, [id_cargo],
        (error, results) => {
            if (error) {
                console.log("No se envio el correo del recibo");
                return;
            }
            if (results.rowCount > 0) {

                let row = results.rows[0];

                if (row.notificar) {
                    let titulo_mensaje = `${row.nombre_cargo} de ${nombre_alumno}`;
                    let cuerpo_mensaje = `Hola ${nombres_padres}, se realizó un cargo de $${row.cargo} por ${row.nombre_cargo} ${row.texto_ayuda != '' ? '(' + row.texto_ayuda + ')' : ''} ${row.id_cat_cargo == CARGOS.ID_TIEMPO_EXTRA ? row.nota : ''}.`;

                    console.log("Enviando correo a " + JSON.stringify(lista_correos));
                    var params = {
                        fecha: row.fecha,
                        nombre_cliente: nombres_padres,
                        nota_inicial: `Se registró el siguiente cargo en la cuenta de ${nombre_alumno}`,
                        nombre_cargo: row.nombre_cargo,
                        texto_ayuda: row.texto_ayuda,
                        nota: row.nota,
                        cargo: row.cargo,
                        id_sucursal: id_sucursal,
                        nota_pie: ''
                    };
                    enviarNotificacionCargo(lista_correos, titulo_mensaje, params);
                    //enviar mensaje te text
                    enviarMensajeMovil(lista_tokens, titulo_mensaje, cuerpo_mensaje);
                } else { console.log("El cargo no esta configurado para notificar cargo"); }
            }
        });
}

/*Correo de notificacion de nuevo cargo*/
const enviarNotificacionCargo = (para, asunto, params) => {
    console.log("@enviarNotificacionCargo");

    correoService
        .enviarCorreoConCopiaTemaNotificacion(
            asunto,
            para,
            params.id_sucursal,
            TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_PAGOS,
            params,
            TEMPLATES.TEMPLATE_AVISO_CARGO
        );
};



function enviarMensajeMovil(tokens, titulo, cuerpo) {
    console.log("Enviando mensaje a movil");
    if (tokens != null && tokens != [] && tokens.length > 0) {
        console.log("Enviando msj al token " + tokens);
        mensajeria.enviarMensajeToken(tokens, titulo, cuerpo);
    } else {
        console.log("No existen tokens registrados ");
    }

}

const notificarReciboPago = (id_alumno, id_pago, es_reenvio) => {
    console.log("@@notificarReciboPago " + id_alumno + "    " + id_pago);
    //ir por alumno
    return new Promise((resolve, reject) => {
        try {
            alumnoService
                .getCorreosTokenAlumno(id_alumno)
                .then(row => {
                    if (row != null) {
                        enviarReciboComplemento(row.correos, row.tokens, row.nombres_padres, id_pago, es_reenvio);
                        resolve(`Se envio el correo a ${row.correos}.`);
                    } else {
                        console.log("XXXX No se encontraron registros de padres para el alumno " + id_alumno);
                        reject("No se encontró registro de padres para el alumno.");
                    }
                }).catch(err => {
                    console.log("error " + err);
                    reject("Existió un error al enviar el correo de comprobante de pago.");
                });


        } catch (error) {
            reject("Error el intentar enviar la notificación.")
        }

    });
};


function enviarReciboComplemento(lista_correos, lista_tokens, nombres_padres, id_pago, es_reenvio) {

    pool.query(`        
            WITH relacion_cargos AS (
	            SELECT  cargo.id,
			        rel.pago,
                    cat.nombre as nombre_cargo,			
                    cargo.texto_ayuda, --nombre del mes
			        cargo.pagado,
			        cargo.nota as nota_cargo,
			        cargo.cantidad,
			        cargo.cargo,
                    cargo.total,
                    cargo.descuento,
                    (des.id is not null) as descuento_aplicado,
			        des.nombre as nombre_descuento,
                    cargo.total_pagado,
                    cat.es_facturable
		        FROM co_pago_cargo_balance_alumno rel inner join co_cargo_balance_alumno cargo on rel.co_cargo_balance_alumno = cargo.id									
                                                inner join cat_cargo cat on cat.id = cargo.cat_cargo												
                                                left join cat_descuento_cargo des on des.id = cargo .cat_descuento_cargo
 		        WHERE rel.co_pago_balance_alumno = $1 and cargo.eliminado = false
            ) select pago.id,
 		            pago.pago,
                    fpago.nombre as forma_pago,
                    fpago.permite_factura as permite_factura_forma_pago,
                    pago.identificador_factura,
                    pago.identificador_pago,
		            TO_CHAR(pago.fecha, 'dd-mm-yyyy') as fecha,
		            grupo.nombre as nombre_grupo,
		            al.nombre as nombre_alumno,
                    al.apellidos as apellidos_alumno,
                    al.factura, 
                    (select to_json(a.*) from co_datos_facturacion a where a.id = al.co_datos_facturacion and a.eliminado = false) AS datos_factura,
                    suc.id as id_sucursal,
		            suc.nombre as nombre_sucursal,
		            suc.direccion as direccion_sucursal,		
		            count(cargo.id) as count_cargos,		
                    array_to_json(array_agg(to_json(cargo.*))) AS cargos
                from co_pago_balance_alumno pago inner join co_pago_cargo_balance_alumno rel on pago.id = rel.co_pago_balance_alumno
    								inner join relacion_cargos cargo on rel.co_cargo_balance_alumno = cargo.id
									inner join co_forma_pago fpago on fpago.id = pago.co_forma_pago
									inner join co_balance_alumno bal on pago.co_balance_alumno = bal.id
									inner join co_alumno al on al.co_balance_alumno = bal.id
									inner join co_grupo grupo on al.co_grupo = grupo.id
									inner join co_sucursal suc on al.co_sucursal = suc.id									
	            where pago.id = $2
                group by pago.id,fpago.permite_factura,fpago.nombre,al.nombre,al.apellidos,al.factura,al.co_datos_facturacion,grupo.nombre,suc.id,suc.nombre,suc.direccion 
          `, [id_pago, id_pago],
        (error, results) => {
            if (error) {
                console.log("x x x x x x x No se envio el correo del recibo Fallo algo en el query x x x x x x xx ");
                return;
            }

            if (results.rowCount > 0) {

                let row = results.rows[0];
                let tituloCorreo = `Recibo de pago ${es_reenvio ? '(Reenvío)' : ''} ✔`;
                let titulo_mensaje = "Pago realizado ✔";
                let cuerpo_mensaje = `Hola, recibimos un pago correspondiente a ${row.count_cargos} cargo${row.count_cargos > 0 ? '' : 's'} del alumno ${row.nombre_alumno}, enviamos el recibo de pago a su correo.`;
                console.log("Enviando correo a " + JSON.stringify(lista_correos));

                var pago = {
                    fecha: row.fecha,
                    pago: row.pago,
                    forma_pago: row.forma_pago,
                    factura: row.identificador_factura,
                    no_pago: row.identificador_pago,
                    numero_cargos: row.count_cargos,
                    cargos: row.cargos,
                    escribir_folio_factura: (row.identificador_factura != null && row.identificador_factura != '')
                };

                var alumno = {
                    nombre: row.nombre_alumno,
                    apellidos: row.apellidos_alumno,
                    grupo: row.nombre_grupo
                };
                var sucursal = {
                    id: row.id_sucursal,
                    nombre: row.nombre_sucursal,
                    direccion: row.direccion_sucursal
                };
                var params = {
                    titulo: "Magic Intelligence",
                    nombre_empresa: "Magic Intelligence",
                    nombre_cliente: nombres_padres,
                    pago: pago,
                    alumno: alumno,
                    sucursal: sucursal,
                    mensaje_pie: variables.template_mail.mensaje_pie
                };

                enviarCorreoReciboPago(
                    lista_correos,
                    tituloCorreo,
                    params
                );

                enviarMensajeMovil(lista_tokens, titulo_mensaje, cuerpo_mensaje);

                //enviar datos para facturacion
                console.log("Iniciando envio de datos de factura factura " + row.factura + " permite " + row.permite_factura_forma_pago);
                if (row.factura && row.permite_factura_forma_pago) {

                    console.log("CARGOS " + JSON.stringify(row.cargos));

                    var listaCargosFacturables = [];
                    var total_pagado_cargos = 0;

                    for (var item in row.cargos) {
                        let item_row = row.cargos[item];
                        console.log("item " + JSON.stringify(item_row));
                        if (item_row.es_facturable) {
                            listaCargosFacturables.push(item_row);
                            total_pagado_cargos += item_row.total_pagado;
                        }
                        console.log("item " + JSON.stringify(listaCargosFacturables));
                    }

                    const nuevoParams = JSON.parse(JSON.stringify(params));

                    nuevoParams.pago.cargos = listaCargosFacturables;
                    nuevoParams.pago.pago = total_pagado_cargos;
                    nuevoParams.datos_factura = row.datos_factura;
                    console.log(JSON.stringify(nuevoParams));

                    console.log("Cargos para facturar " + JSON.stringify(nuevoParams.pago.cargos));
                    if (listaCargosFacturables.length > 0) {
                        console.log("Enviar correo para facturacion ");
                        correoService.enviarCorreoParaTemaNotificacion(
                            'Registrar Factura - ' + row.nombre_sucursal,
                            params.id_sucursal,
                            TEMA_NOTIFICACION.ID_TEMA_DATOS_FACTURACION,
                            nuevoParams,
                            TEMPLATES.TEMPLATE_DATOS_FACTURACION
                        );
                    }
                }
            }
        });
}

const enviarCorreoReciboPago = (para, asunto, params) => {
    console.log("@enviarCorreoReciboPago");

    params.id_sucursal = params.sucursal.id;

    correoService.enviarCorreoConCopiaTemaNotificacion(
        asunto,
        para,
        params.id_sucursal,
        TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_PAGOS,
        params,
        TEMPLATES.TEMPLATE_RECIBO_PAGO
    );
};

// no se usa aun
const enviarCorreoClaveFamiliar = (para, asunto, params) => {
    console.log("@enviarCorreoClaveFamiliar");

    pool
        .query(`select link_descarga_app_android,
                        link_descarga_app_ios,
                        url_facebook,
                        url_twitter,
                        url_pagina_oficial,
                        url_logo_correo_header,
                        url_logo_correo_footer
                 from configuracion limit 1`)
        .then(res => {
            let row;
            if (res.rowCount > 0) {
                row = res.rows[0];
            }
            params.url_descarga_app_android = row.link_descarga_app_android;
            params.url_descarga_app_ios = row.link_descarga_app_ios;
            params.url_facebook = row.url_facebook;
            params.url_twitter = row.url_facebook;
            params.url_pagina_oficial = row.url_pagina_oficial;
            params.url_logo_correo_header = row.url_logo_correo_header;
            params.url_logo_correo_footer = row.url_logo_correo_footer;

            console.log(JSON.stringify(row));

            correoService.enviarCorreoTemplate(para, '', asunto, params, TEMPLATES.TEMPLATE_GENERICO);

        }).catch((e) => {
            console.log("Excepción en el envio de correo : " + e);
        });
};

const enviarEstadoCuenta = async (idAlumno) => {
   
    const estadoCuenta = await obtenerEstadoCuentaAlumno(idAlumno);

    if (!estadoCuenta) {
        console.log("No hay estado de cuenta");
    } else {

        correoService.enviarCorreoConCopiaTemaNotificacion(
            `Estado de cuenta de ${estadoCuenta.alumno.nombre_alumno}`,
            estadoCuenta.padres.correos || '',
            estadoCuenta.alumno.co_sucursal,
            TEMA_NOTIFICACION.ID_TEMA_NOTIFICACION_PAGOS,
            estadoCuenta,
            TEMPLATES.TEMPLATE_ESTADO_CUENTA
        );
    }
}

module.exports = {
    notificarReciboPago,
    enviarCorreoClaveFamiliar,
    notificarCargo,
    enviarEstadoCuenta
};