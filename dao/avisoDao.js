const genericDao = require("./genericDao");
const {
  ExceptionDatosFaltantes,
  ExceptionBD,
} = require("../exception/exeption");
const { isEmptyOrNull } = require("../utils/Utils");
const { TIPO_PUBLICACION } = require("../utils/Constantes");


const registrarAviso = async (avisoData) => {
  console.log("@registrarAviso");  
  const { listaPara } =  avisoData;
  try{
  const contadorPara = listaPara && listaPara.length;

  if(contadorPara > 0){

    const idAviso = await insertarCoAviso(avisoData);   
   
    //const existePublicacionEmpresa = listaPara.filter(e=>e.id_tipo_publicacion == TIPO_PUBLICACION.EMPRESA);   
   ///insertar la publicacion
    for(let i =0;i< contadorPara;i++){
        
        const publicacion = listaPara[i];

        const idPublicacion = await insertarAvisoPublicacion(idAviso,publicacion);                      
        
      }  
  }     

  return idAviso;

  }catch(e){  
    console.log("Error al insertar el aviso "+e);
    throw new ExceptionBD("Error");
  }
};



const insertarCoAviso = async (avisoData)=>{
  const {
    fecha,
    para,
    titulo,
    aviso,
    id_empresa,
    etiqueta,
    nota_interna,
    genero,
  } = avisoData;
  console.log(JSON.stringify(avisoData));

  return await genericDao.execute(
    `
                        INSERT INTO CO_AVISO(FECHA,CO_EMPRESA,PARA,TITULO,AVISO,ETIQUETAS,NOTA_INTERNA,GENERO)
                        VALUES(current_date,$1,$2,$3,$4,$5,$6,$7) returning ID;
                   `,
    [
      id_empresa,
      JSON.stringify(para),
      titulo,
      aviso,
      JSON.stringify(etiqueta) || "",
      nota_interna,
      genero
    ]
  );
};

const insertarAvisoPublicacion = async (id_aviso,publicacionData) =>{
  console.log("@insertarAvisoPublicacion");
  const {        
    id_tipo_publicacion,    
    id_empresa,     
    id_sucursal,
    id_grupo,
    id_familiar,
    genero,
  } = publicacionData;
  console.log(JSON.stringify(publicacionData));

  return await genericDao.execute(
    `INSERT INTO CO_AVISO_PUBLICACION(CO_AVISO, CO_TIPO_PUBLICACION,CO_EMPRESA,CO_SUCURSAL,CO_GRUPO,CO_FAMILIAR,GENERO)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ID;`,
    [
      id_aviso,
      id_tipo_publicacion,
      id_empresa,
      id_sucursal,
      id_grupo,
      id_familiar,
      genero
    ]
  );


};




const registrarEnvio = async (id,infoEnvio,genero) => {
  console.log("@registrarEnvio");
    
  return await genericDao.execute(
    `
                 UPDATE CO_AVISO
                     SET 
                        FECHA_MODIFICO = CURRENT_TIMESTAMP,
                        INFORMACION_ENVIO = $2,   
                        MODIFICO = $3,                                             
                        ENVIADO = true,
                        FECHA_ENVIO = CURRENT_TIMESTAMP
                     WHERE ID = $1
                        RETURNING ID;
                `,
    [id,JSON.stringify(infoEnvio),genero]
  );
};

const modificarAviso = async (avisoData) => {
  console.log("@modificarAviso");
  const { id, para, titulo, aviso, etiqueta, nota_interna, genero } = avisoData;
  return await genericDao.execute(
    `
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
                `,
    [id, JSON.stringify(para), titulo, aviso, JSON.stringify(etiqueta), nota_interna, genero]
  );
};

const eliminarAvisos = async (avisoData) => {
  console.log("@eliminarAvisos");

  const { ids, genero } = avisoData;
  var idsAviso = "";
  var first = true;

  ids.forEach((element) => {
    if (first) {
      idsAviso += element + "";
      first = false;
    } else {
      idsAviso += "," + element;
    }
  });
  return await genericDao.execute(
    `
                                    UPDATE CO_AVISO     
                                    SET eliminado = true,
                                        fecha_modifico = current_timestamp,
                                        modifico = $2
                                    WHERE id = ANY($1::INT[]);                                    
                                    `,
    [idsAviso, genero]
  );
};

const obtenerAvisos = async (idUsuario) => {
  console.log("@obtenerAvisos");

  return await genericDao.findAll(
    `
                SELECT a.id,
                e.nombre as empresa, 
                to_char(a.fecha,'dd-MM-YYYY') as fecha,
                a.para,
                a.etiquetas,
                a.titulo ,
                a.aviso,		
                a.nota_interna,
                a.enviado,
                to_char(a.fecha_envio,'dd-MM-YYYY HH:MM') as fecha_envio,
                a.informacion_envio,
                to_char(a.fecha_genero,'dd-MM-YYYY') as fecha_genero,
                u.nombre as usuario_genero		
            FROM CO_AVISO a inner join co_empresa e on e.id = a.co_empresa
                            inner join usuario u on u.id = a.genero
                    where u.id = $1
                    and a.eliminado = false
             order by a.fecha_envio desc
            `,
    [idUsuario]
  );
};

const obtenerAvisoId = async (idAviso) => {
    console.log("@obtenerAvisoId");
  
    return await genericDao.findOne(
      `
                  SELECT a.id,
                  e.nombre as empresa, 
                  to_char(a.fecha,'dd-MM-YYYY') as fecha,
                  a.para,
                  a.etiquetas,
                  a.titulo,
                  a.aviso,		
                  a.nota_interna,
                  a.genero            
              FROM CO_AVISO a inner join co_empresa e on e.id = a.co_empresa                             
              where a.id = $1
                      and a.eliminado = false
             order by a.fecha_genero
              `,
      [idAviso]
    );
  };

const obtenerContactos = async (idsSucursales) => {
  console.log("@obtenerContactos");

  return await genericDao.findAll(
    `               
select af.id as id_alumno_familiar,
fam.id as id_familiar,
fam.correo,
fam.token,
fam.token is not null as tiene_app,
fam.nombre as nombre_familiar,
p.nombre as parentesco,
a.nombre_carino,
a.nombre as nombre_alumno,
a.apellidos as apellidos_alumno,
a.foto,
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
    [idsSucursales]
  );
};

const obtenerContactosIds = async (idsFamiliares) => {
  console.log("@obtenerContactosIds");

  return await genericDao.findAll(
    `               
select af.id as id_alumno_familiar,
fam.id as id_familiar,
fam.correo,
fam.token,
fam.token is not null as tiene_app,
fam.nombre as nombre_familiar,
p.nombre as parentesco,
a.nombre_carino,
a.nombre as nombre_alumno,
a.apellidos as apellidos_alumno,
a.foto,
balance.total_adeudo,
grupo.id as id_grupo,
grupo.nombre as nombre_grupo,
grupo.color as color_grupo,
suc.id as id_sucursal,
suc.nombre as sucursal,
suc.class_color as color_sucursal,
genero.id as id_genero, 
genero.nombre as genero
from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                     inner join co_alumno a on a.id = af.co_alumno
                     inner join co_sucursal suc on suc.id = a.co_sucursal
                     inner join co_grupo grupo on grupo.id = a.co_grupo
                     inner join cat_genero genero on genero.id = a.cat_genero
                     inner join co_balance_alumno balance on balance.id = a.co_balance_alumno
                     inner join co_parentesco p on p.id = af.co_parentesco
where fam.id = ANY($1::int[])
and af.eliminado = false
and a.eliminado = false
and fam.eliminado = false	  
order by suc.id,fam.nombre,grupo.nombre

            `,
    [idsFamiliares]
  );
};


module.exports = {
  obtenerAvisos,
  registrarAviso,  
  eliminarAvisos,
  modificarAviso,
  obtenerContactos,
  obtenerContactosIds,
  registrarEnvio,
  obtenerAvisoId,
};
