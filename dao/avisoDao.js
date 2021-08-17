const genericDao = require('./genericDao');
const { ExceptionDatosFaltantes, ExceptionBD } = require('../exception/exeption');
const { isEmptyOrNull } = require('../utils/Utils');

const enviarAviso = async (avisoData) => {
    console.log("@enviarAviso");
    //const  { fecha,para,titulo,aviso,etiqueta,nota_interna, genero } = avisoData;
    const id = await registrarAviso(avisoData);
    if (avisoData.enviar) {
        //Enviar Correo
        console.log("Enviar correo ......." + id);
    }
};

const registrarAviso = async (avisoData) => {
    console.log("@registrarAviso");
    const { fecha, para, titulo, aviso, etiqueta, nota_interna, genero } = avisoData;
    return await genericDao.execute(`
                        INSERT INTO CO_AVISO(FECHA,CO_EMPRESA,PARA,TITULO,AVISO,ETIQUETAS,NOTA_INTERNA,GENERO)
                        VALUES(current_date,$1,$2,$3,$4,$5,$6) returning ID;
                        `, [para, titulo, aviso, etiqueta, nota_interna, genero]);
};

const modificarAviso = async (avisoData) => {
    console.log("@modificarAviso");
    const  {id, para,titulo,aviso,etiqueta,nota_interna, genero } = avisoData;    
    return await genericDao.execute(`
                UPDATE CO_AVISO
                    SET PARA = $2,
                        TITULO = $3,
                        AVISO = $4,
                        ETIQUETAS = $5,
                        NOTA_INTERNA = $6,
                        FECHA_MODIFICO = CURRENT_TIMESTAMP,
                        MODIFICO = $7
                WHERE ID = $1
                RETURNING ID;
                `, [id,para, titulo, aviso, etiqueta, nota_interna, genero]);    
};
const eliminarAvisos = async (avisoData) => {
    console.log("@eliminarAvisos");

    const { ids, genero } = avisoData;
    var idsAviso = '';
    var first = true;

    ids.forEach(element => {
        if (first) {
            idsAviso += (element + "");
            first = false;
        } else {
            idsAviso += (',' + element);
        }
    });
    return await genericDao.execute(`
                                    UPDATE CO_AVISO     
                                    SET eliminado = true,
                                        fecha_modifico = current_timestamp,
                                        modifico = $2
                                    WHERE id = ANY($1::INT[]);                                    
                                    `, [idsAviso, genero]);
};

const obtenerAvisos = async (idUsuario) => {
    console.log("@obtenerAvisos");

    return await genericDao.findAll(`
                SELECT a.id,
                e.nombre as empresa, 
                to_char(a.fecha,'dd-MM-YYYY') as fecha,
                a.para,
                a.etiquetas,
                a.titulo ,
                a.aviso,		
                a.nota_interna,
                to_char(a.fecha_genero,'dd-MM-YYYY') as fecha_genero,
                u.nombre as usuario_genero		
            FROM CO_AVISO a inner join co_empresa e on e.id = a.co_empresa
                            inner join usuario u on u.id = a.genero
                    where u.id = $1
                    and a.eliminado = false
                    order by a.fecha_genero
            `,
        [idUsuario]);

};


module.exports = {
        obtenerAvisos,
        registrarAviso,
        enviarAviso,
        eliminarAvisos,
        modificarAviso
};