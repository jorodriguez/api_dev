const genericDao = require("./genericDao");
const {
    ExceptionDatosFaltantes,
    ExceptionBD,
} = require("../exception/exeption");
const { isEmptyOrNull } = require("../utils/Utils");
const { TIPO_PUBLICACION } = require("../utils/Constantes");


const registrarAviso = async(avisoData) => {
    console.log("@dao.registrarAviso");
    const { para } = avisoData;
    try {
        const contadorPara = para && para.length;

        let idAviso = null;
        let publicaciones = [];
        if (contadorPara > 0) {

            idAviso = await insertarCoAviso(avisoData);
            console.log("==AVISO GENERADO " + idAviso);
            //const existePublicacionEmpresa = listaPara.filter(e=>e.id_tipo_publicacion == TIPO_PUBLICACION.EMPRESA);   
            ///insertar la publicacion
            console.log("iniciando insercion de publicacion");
            for (let i = 0; i < contadorPara; i++) {
                const publicacion = para[i];
                console.log("insert publicacion " + publicacion);
                const idPublicacion = await insertarAvisoPublicacion(idAviso, publicacion, avisoData.genero);
                publicaciones.push({ coAvisoPublicacion: idPublicacion, ...publicaciones });

            }
        }

        return idAviso;

    } catch (e) {
        console.log("Error al insertar el aviso " + e);
        throw new ExceptionBD("Error");
    }
};


const insertarCoAviso = async(avisoData) => {
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
                   `, [
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

const insertarAvisoPublicacion = async(id_aviso, publicacionData, genero) => {
    console.log("@insertarAvisoPublicacion");
    const {
        tipo,
        id_empresa,
        id_sucursal,
        id_grupo,
        id_familiar
    } = publicacionData;

    console.log(JSON.stringify(publicacionData));

    return await genericDao.execute(
        `INSERT INTO CO_AVISO_PUBLICACION(CO_AVISO, CO_TIPO_PUBLICACION,CO_EMPRESA,CO_SUCURSAL,CO_GRUPO,CO_FAMILIAR,GENERO)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ID;`, [
            id_aviso,
            tipo,
            id_empresa,
            id_sucursal == -1 ? null : id_sucursal,
            id_grupo == -1 ? null : id_grupo,
            id_familiar == -1 ? null : id_familiar,
            genero
        ]
    );


};


const registrarEnvio = async(id, infoEnvio, genero) => {
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
                `, [id, JSON.stringify(infoEnvio), genero]
    );
};

const modificarAviso = async(avisoData) => {
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
                `, [id, JSON.stringify(para), titulo, aviso, JSON.stringify(etiqueta), nota_interna, genero]
    );
};

const eliminarAvisos = async(avisoData) => {
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
                                    `, [idsAviso, genero]
    );
};

const obtenerAvisos = async(idUsuario) => {
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
            `, [idUsuario]
    );
};

const obtenerAvisoId = async(idAviso) => {
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
                  a.co_empresa,                  
                  a.genero            
              FROM CO_AVISO a inner join co_empresa e on e.id = a.co_empresa                             
              where a.id = $1
                      and a.eliminado = false             
              `, [idAviso]
    );
};

const obtenerContactos = async(idsSucursales) => {
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

            `, [idsSucursales]
    );
};

const obtenerContactosIds = async(idsFamiliares) => {
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

            `, [idsFamiliares]
    );
};

const QUERY_CORREOS_AVISO_POR_EMPRESA = `

with avisos AS (
  select distinct co_sucursal 
     from si_usuario_sucursal_rol r 
     where usuario = $1 and r.eliminado = false 
 ) 
 select            
         fam.nombre,
         suc.nombre as sucursal,
         grupo.nombre as grupo,
         fam.correo,
         fam.token,
     'sucursal' as tipo
   from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                 inner join co_alumno al on al.id = af.co_alumno
                 inner join co_grupo grupo on grupo.id = al.co_grupo
                 inner join co_sucursal suc on suc.id = al.co_sucursal
                 inner join co_empresa em on em.id = suc.co_empresa													                          
                 inner join avisos a on a.co_sucursal = suc.id
   where 
       af.co_parentesco in (1,2) --Papa y mama 	   	     
       and af.eliminado = false
       and fam.eliminado = false
       and grupo.eliminado = false
       and suc.eliminado =false  
     and al.eliminado = false
`;

const QUERY_CORREOS_AVISO_POR_CRITERIO = `

with avisos AS (
  select ap.id,
      tipo.id as id_tipo,
      em.id as id_empresa	,			   	
      suc.id as id_sucursal,
      grupo.id as id_grupo,
      fam.id as id_familiar    
  from co_aviso_publicacion ap inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion
                  left join co_empresa em on em.id = ap.co_empresa
                  left join co_sucursal suc on suc.id = ap.co_sucursal
                  left join co_grupo grupo on grupo.id = ap.co_grupo
                  left join co_familiar fam on fam.id = ap.co_familiar
  where ap.co_aviso = $1
     and ap.eliminado = false
     and em.eliminado = false 
) 

select 
    distinct       
        fam.nombre,
        suc.nombre as sucursal,
        grupo.nombre as grupo,
        fam.correo,
        fam.token,
		'sucursal' as tipo
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join co_sucursal suc on suc.id = al.co_sucursal
                inner join co_empresa em on em.id = suc.co_empresa													                          
				inner join avisos a on a.id_sucursal = suc.id																				
  where 
  	  af.co_parentesco in (1,2) --Papa y mama 	   	     
	  and a.id_tipo = 2	  
	  and al.eliminado = false
      and af.eliminado = false
      and fam.eliminado = false
      and grupo.eliminado = false
      and suc.eliminado =false   
union
select 
    distinct       
        fam.nombre,
        suc.nombre as sucursal,
        grupo.nombre as grupo,
        fam.correo,
        fam.token,
		'grupo' as tipo
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join co_sucursal suc on suc.id = al.co_sucursal
                inner join co_empresa em on em.id = suc.co_empresa
				inner join avisos a on a.id_sucursal = suc.id 										
  where 
  	  af.co_parentesco in (1,2) --Papa y mama 	   	 
	  and a.id_grupo = grupo.id				
	  and al.eliminado = false
	  and a.id_tipo = 3
      and af.eliminado = false
      and fam.eliminado = false
      and grupo.eliminado = false
      and suc.eliminado =false  
union
select distinct           
        fam.nombre,
        suc.nombre as sucursal,
        grupo.nombre as grupo,
        fam.correo,
        fam.token,
		'familiar' as tipo
  from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                inner join co_alumno al on al.id = af.co_alumno
                inner join co_grupo grupo on grupo.id = al.co_grupo
                inner join co_sucursal suc on suc.id = al.co_sucursal
                inner join co_empresa em on em.id = suc.co_empresa													                          
				inner join avisos a on a.id_sucursal = suc.id 
										
  where 
  	  af.co_parentesco in (1,2) --Papa y mama 	   	 
	  and a.id_grupo = grupo.id	
	  and al.eliminado = false
	  and a.id_familiar = fam.id
	  and a.id_tipo = 4
      and af.eliminado = false
      and fam.eliminado = false
      and grupo.eliminado = false
      and suc.eliminado =false 
`;

const QUERY_EXISTE_PUBLICACION_EMPRESA = `
 select exists (
  select 1
  from co_aviso_publicacion ap inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion                  
  where ap.co_aviso = $1
  		and ap.co_tipo_publicacion = 1 -- TIPO_EMPRESA
      and ap.eliminado = false
 )
`;

const obtenerCorreosPorAviso = async(aviso) => {
    console.log("@obtenerCorreosPorAviso");

    const existePublicacionTodaEmpresa = await genericDao.findOne(QUERY_EXISTE_PUBLICACION_EMPRESA, [aviso.id]);
    console.log("existePublicacionTodaEmpresa " + JSON.stringify(existePublicacionTodaEmpresa));

    let query = existePublicacionTodaEmpresa.exists ? QUERY_CORREOS_AVISO_POR_EMPRESA : QUERY_CORREOS_AVISO_POR_CRITERIO;
    let params = existePublicacionTodaEmpresa.exists ? [aviso.genero] : [aviso.id];

    return await genericDao.findAll(query, params);

};

const QUERY_TAGS_CONTACTOS = `

with sucursales_usuario as (
    select distinct co_sucursal 
    from si_usuario_sucursal_rol r 
    where usuario = $1 and r.eliminado = false 
), universo as (
  select suc.id, 
  '@'||suc.nombre as nombre,				
  suc.co_empresa as id_empresa,
  suc.id as id_sucursal, 
  suc.nombre as nombre_mostrar,
  (count(fam.*)||' contactos') as descripcion,
  -1 as id_grupo,
-1 as id_familiar,
  2 as tipo,
  count(fam.*) as contador_contactos
  ,(array_to_json(array_agg(row_to_json(fam.*))))::text as contactos
from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
          inner join co_alumno al on al.id = af.co_alumno                
          inner join co_sucursal suc on suc.id = al.co_sucursal				
  inner join sucursales_usuario su on su.co_sucursal = suc.id
where
 af.co_parentesco in (1,2) --Papa y mama 	   	     
and al.eliminado = false
and af.eliminado = false
and fam.eliminado = false      
and suc.eliminado =false  
group by suc.id	
union 
select grupo.id, 
  '@'||grupo.nombre||' - '||suc.nombre as nombre,				
  suc.co_empresa as id_empresa,
  suc.id as id_sucursal, 
  grupo.nombre ||' '||suc.nombre nombre_mostrar,
  (count(fam.*)||' contactos') as descripcion,
  grupo.id as id_grupo,
-1 as id_familiar,
  3 as tipo,
  count(fam.*) as contador_contactos
  ,(array_to_json(array_agg(row_to_json(fam.*))))::text as contactos
from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
          inner join co_alumno al on al.id = af.co_alumno                
          inner join co_sucursal suc on suc.id = al.co_sucursal				
  inner join co_grupo grupo on grupo.id = al.co_grupo
  inner join sucursales_usuario su on su.co_sucursal = suc.id
where   	  
 af.co_parentesco in (1,2) --Papa y mama 	   	     
and al.eliminado = false
and af.eliminado = false
and fam.eliminado = false      
and suc.eliminado =false  
group by grupo.id,suc.id
union
select fam.id, 
  fam.nombre as nombre,				
  suc.co_empresa as id_empresa,
  suc.id as id_sucursal, 
  fam.nombre as nombre_mostrar,
  (pare.nombre|| ' de '||string_agg(al.nombre,',')) as descripcion,
  grupo.id as id_grupo,
fam.id as id_familiar,
  4 as tipo,
   count(fam.*) as contador_contactos
  ,(array_to_json(array_agg(row_to_json(fam.*))))::text as contactos			
from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
          inner join co_alumno al on al.id = af.co_alumno                
          inner join co_sucursal suc on suc.id = al.co_sucursal				
  inner join co_grupo grupo on grupo.id = al.co_grupo
  inner join co_parentesco pare on pare.id = af.co_parentesco
  inner join sucursales_usuario su on su.co_sucursal = suc.id
where   	  
 pare.id in (1,2) --Papa y mama 	   	     
 and al.eliminado = false
and af.eliminado = false
and fam.eliminado = false      
and suc.eliminado =false  
group by fam.id,suc.id,grupo.id,pare.id
) select  u.* 
from universo u 
order by u.tipo, u.nombre
`;

const obtenerTagsContactos = async(idUsuario) => {
    console.log("@obtenerTagsContactos");
    return await genericDao.findAll(QUERY_TAGS_CONTACTOS, [idUsuario]);
};

const QUERY_AVISO_FAMILIAR = `
with familiar AS (  
  select  
      fam.id,
          fam.nombre,	    
          suc.id as id_sucursal,
          grupo.id as id_grupo,
      em.id as id_empresa,
      al.nombre as hijo
    from co_alumno_familiar af inner join co_familiar fam on fam.id = af.co_familiar
                  inner join co_alumno al on al.id = af.co_alumno
                  inner join co_grupo grupo on grupo.id = al.co_grupo
                  inner join co_sucursal suc on suc.id = al.co_sucursal
                  inner join co_empresa em on em.id = suc.co_empresa													                          		
   where 
      fam.id = $1
        and af.co_parentesco in (1,2) --Papa y mama 	   	 	  
      and al.eliminado = false	 
        and af.eliminado = false
        and fam.eliminado = false
        and grupo.eliminado = false
        and suc.eliminado =false 
  )--publicaciones para toda la empresa
  select 
	  aviso.fecha,	 
	  to_char(aviso.fecha,'DD-MM-YYYY') as fecha_format,
	   aviso.fecha_envio,
	  to_char(aviso.fecha_envio,'dd-mm-yyyy HH24:MI') as fecha_envio_format,
	  aviso.titulo,
	  ap.id as id_aviso_publicacion,
      tipo.id as id_tipo,
      em.id as id_empresa,			   	
      -1 as id_sucursal,
      -1 as id_grupo,
      f.id as id_familiar,
	  tipo.nombre as tipo
  from co_aviso aviso 
  				  inner join co_aviso_publicacion ap on ap.co_aviso = aviso.id
				  inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion				  
                  inner join co_empresa em on em.id = ap.co_empresa	
				  inner join familiar f on f.id_empresa = em.id                 
  where 
  	 tipo.id = 1 	 
	 and ap.eliminado = false
     and em.eliminado = false
union --POR SUCURSAL
select 
	  aviso.fecha,
	  to_char(aviso.fecha,'DD-MM-YYYY') as fecha_format,
	  aviso.fecha_envio,
	  to_char(aviso.fecha_envio,'dd-mm-yyyy HH24:MI') as fecha_envio_format,
	  aviso.titulo,
	  ap.id as id_aviso_publicacion,
      tipo.id as id_tipo,
      em.id as id_empresa,			   	
      suc.id as id_sucursal,
      -1 as id_grupo,
      f.id as id_familiar,
	  tipo.nombre as tipo
  from co_aviso aviso 
  				  inner join co_aviso_publicacion ap on ap.co_aviso = aviso.id
				  inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion				  
                  inner join co_empresa em on em.id = ap.co_empresa					  
                  inner join co_sucursal suc on suc.id = ap.co_sucursal
				  inner join familiar f on f.id_empresa = em.id
				  							and f.id_sucursal = suc.id
                  
  where 
  	 tipo.id = 2 
	 and ap.eliminado = false
     and em.eliminado = false
	 and suc.eliminado = false
union --POR GRUPO
select 
	 aviso.fecha,
	  to_char(aviso.fecha,'DD-MM-YYYY') as fecha_format,
	   aviso.fecha_envio,
	  to_char(aviso.fecha_envio,'dd-mm-yyyy HH24:MI') as fecha_envio_format,
	  aviso.titulo,
	  ap.id as id_aviso_publicacion,
      tipo.id as id_tipo,
      em.id as id_empresa,			   	
      suc.id as id_sucursal,
      grupo.id as id_grupo,
      f.id as id_familiar,
	  tipo.nombre as tipo
  from co_aviso aviso 
  				  inner join co_aviso_publicacion ap on ap.co_aviso = aviso.id
				  inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion				  
                  inner join co_empresa em on em.id = ap.co_empresa					  
                  inner join co_sucursal suc on suc.id = ap.co_sucursal
				  inner join co_grupo grupo on grupo.id = ap.co_grupo
				  inner join familiar f on f.id_empresa = em.id
				  							and f.id_sucursal = suc.id
											and f.id_grupo = grupo.id
                
  where 
  	 tipo.id = 3 
	 and ap.eliminado = false
     and em.eliminado = false
	 and suc.eliminado = false
	 and grupo.eliminado = false
union --POR CONTACTO
select 
	 aviso.fecha,
	  to_char(aviso.fecha,'DD-MM-YYYY') as fecha_format,
	   aviso.fecha_envio,
	  to_char(aviso.fecha_envio,'dd-mm-yyyy HH24:MI') as fecha_envio_format,
	  aviso.titulo,
	  ap.id as id_aviso_publicacion,
      tipo.id as id_tipo,
      em.id as id_empresa,			   	
      suc.id as id_sucursal,
      grupo.id as id_grupo,
      f.id as id_familiar,
	  tipo.nombre as tipo
  from co_aviso aviso 
  				  inner join co_aviso_publicacion ap on ap.co_aviso = aviso.id
				  inner join co_tipo_publicacion tipo on tipo.id = ap.co_tipo_publicacion				  
                  inner join co_empresa em on em.id = ap.co_empresa					  
                  inner join co_sucursal suc on suc.id = ap.co_sucursal
				  inner join co_grupo grupo on grupo.id = ap.co_grupo
				  inner join co_familiar fam on fam.id = ap.co_familiar
				  inner join familiar f on f.id_empresa = em.id
				  							and f.id_sucursal = suc.id
											and f.id_grupo = grupo.id 
											and f.id = fam.id
  where 
  	 tipo.id = 4 
	 and ap.eliminado = false
     and em.eliminado = false
	 and suc.eliminado = false
	 and grupo.eliminado = false	 
	 and fam.eliminado = false
	 
`;

const obtenerAvisosPorFamiliar = async(idFamiliar) => {
    return await genericDao.findAll(QUERY_AVISO_FAMILIAR, [idFamiliar]);
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
    obtenerCorreosPorAviso,
    obtenerTagsContactos,
    obtenerAvisosPorFamiliar
};