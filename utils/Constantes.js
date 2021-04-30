
const CARGOS = {
      ID_CARGO_MENSUALIDAD : 1,ID_TIEMPO_EXTRA:3,ID_RECARGO_MENSUALIDAD :4
};

const ESTATUS = {
    OK : 200
};

const TIPO_CARGO = {
    PRODUCTO : 1,
    SERVICIO : 2
};

const TEMA_NOTIFICACION ={  ID_TEMA_NOTIFICACION_PAGOS:2,
                            ID_TEMA_DATOS_FACTURACION:5,
                            ID_TEMA_NOTIFICACION_ALTA_FAMILIAR:4,
                            ID_TEMA_REPORTE_RECARGOS : 6
                        };

const ROWS_POR_PAGINACION = 5;

const USUARIO_DEFAULT= 1;

const ENTRADA = 0;
const SALIDA = 1;

const TIPO_USUARIO = {MAESTRA:1};

//quitar despues de crear la funcionalidad de empresa
const ID_EMPRESA_MAGIC = 1;

const MENSAJE_RECARGO_POR_MENSUALIDAD_VENCIDA = " (MENSUALIDAD VENCIDA).";

const SIN_COPIA = '';


//nombre del folder donde se guardan la foto de los alumnos
const FOLDER_PERFILES_CLOUDNARY = "perfiles_alumnos";

module.exports = {
    CARGOS,
    ESTATUS,
    ROWS_POR_PAGINACION,
    TIPO_CARGO,
    USUARIO_DEFAULT,
    ENTRADA,SALIDA,
    TIPO_USUARIO,
    ID_EMPRESA_MAGIC,
    TEMA_NOTIFICACION,
    MENSAJE_RECARGO_POR_MENSUALIDAD_VENCIDA,
    SIN_COPIA,
    FOLDER_PERFILES_CLOUDNARY
};