
const gastoDao = require("../dao/gastoDao");

const registrarGasto = (gastoData) =>{

    return new Promise((resolve,reject)=>{
            gastoDao.registrarGasto(gastoData)
            .then(result => {
                resolve(result.id);
            }).catch(error =>{
                reject(error);
            });
    })    
}


const modificarGasto = (gastoData) => {
    console.log("@modificarGasto");   

    return new Promise((resolve,reject)=>{
            gastoDao.modificarGasto(gastoData)
            .then(result =>{
                    resolve(result.id);
            }).catch(error=>{
                reject(error);
            })
     });
         
};


const eliminarGasto = (idGasto,genero) => {
    console.log("@eliminarGasto");   

    return new Promise((resolve,reject)=>{
            gastoDao.eliminarGasto(idGasto,genero)
            .then(result =>{
                    resolve(result.id);
            }).catch(error=>{
                reject(error);
            })
     });
         
};

const getCatalogoTipoGasto = (request, response) => {
   -
};


module.exports={registrarGasto,modificarGasto,eliminarGasto}