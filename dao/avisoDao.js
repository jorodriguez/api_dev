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
    const { fecha, para, titulo, aviso,id_empresa, etiqueta, nota_interna, genero } = avisoData;
    return await genericDao.execute(`
                        INSERT INTO CO_AVISO(FECHA,CO_EMPRESA,PARA,TITULO,AVISO,ETIQUETAS,NOTA_INTERNA,GENERO)
                        VALUES(current_date,$1,$2,$3,$4,$5,$6,$7) returning ID;
                        `, [id_empresa,JSON.stringify(para), titulo,aviso, etiqueta || '', nota_interna, genero]);
};


const registrarEnvio = async (avisoData) => {
    console.log("@registrarEnvio");
    const  {fecha, para, titulo, aviso,id_empresa, etiqueta, nota_interna, genero } = avisoData;    
    return await genericDao.execute(`
                 UPDATE CO_AVISO
                     SET PARA = $2,
                         TITULO = $3,
                         AVISO = $4,
                         ETIQUETAS = $5,
                         NOTA_INTERNA = $6,
                        FECHA_MODIFICO = CURRENT_TIMESTAMP,
                        MODIFICO = $7,
                        ENVIADO = true,
                        FECHA_ENVIO = CURRENT_TIMESTAMP
                     WHERE ID = $1
                        RETURNING ID;
                `, [id,para, titulo,JSON.stringify(aviso), etiqueta, nota_interna, genero]);    
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
                `, [id,JSON.stringify(para), titulo,aviso, etiqueta, nota_interna, genero]);    
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

const obtenerContactos = async (idsSucursales) => {
    console.log("@obtenerContactos");
  

    return await genericDao.findAll(`               
select af.id as id_alumno_familiar,
fam.correo,
fam.token,
fam.nombre as nombre_familiar,
p.nombre as parentesco,
a.nombre_carino,
a.nombre as nombre_alumno,
a.apellidos as apellidos_alumno,
a.costo_inscripcion,
a.costo_colegiatura,
a.foto,
to_char(a.fecha_nacimiento,'dd-MM-YYYY') as fecha_nacimiento,
to_char(a.hora_entrada,'hh:MM') as hora_entrada,
to_char(a.hora_salida,'hh:MM') as hora_salida,	   
balance.total_adeudo,
grupo.id as id_grupo,
grupo.nombre as nombre_grupo,
grupo.color as color_grupo,
suc.id as id_sucursal,
suc.nombre as sucursal,
suc.class_color as color_sucursal,
genero.id as id_genero, 
genero.nombre as genero,
false as seleccionado,
true as visible
from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                     inner join co_alumno a on a.id = af.co_alumno
                     inner join co_sucursal suc on suc.id = a.co_sucursal
                     inner join co_grupo grupo on grupo.id = a.co_grupo
                     inner join cat_genero genero on genero.id = a.cat_genero
                     inner join co_balance_alumno balance on balance.id = a.co_balance_alumno
                     inner join co_parentesco p on p.id = af.co_parentesco
where suc.id = ANY($1::int[])
and af.eliminado = false
and a.eliminado = false
and fam.eliminado = false	  
order by suc.id,fam.nombre,grupo.nombre

            `,
        [idsSucursales]);

};


module.exports = {
        obtenerAvisos,
        registrarAviso,
        enviarAviso,
        eliminarAvisos,
        modificarAviso,
        obtenerContactos,
        registrarEnvio
};