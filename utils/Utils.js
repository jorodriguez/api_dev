var bcrypt = require('bcryptjs');


function quitarElementosVaciosArray(array){
    if(!Array.isArray(array)){
        console.log("El elemeto para limpiar no es un array.");
        return array;
    }

    return array.filter(Boolean);    
}

function encriptar(texto){

    return  bcrypt.hashSync(texto, 8);
    
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function isEmptyOrNull(...values){
    
    if(values === null ||  values === undefined || values.length === 0 ){
        return true;
    }else{
        for(let index in values){
            let obj = values[index];
            if(obj === null || obj == undefined || obj === null){
                  return true;
            }
        }
    }
    return false; 
}

function existeValorArray(array){
    if(array === null || array === undefined || array == []){
        return false;
    }
    return true;
}


module.exports = {
    quitarElementosVaciosArray,   
    isEmpty , 
    encriptar,
    isEmptyOrNull,
    existeValorArray
};

/*
  var newArray = []; //new Array();
    for( var i = 0; i < actual.length; i++ ){
        if ( actual[ i ] ){
          newArray.push( actual[ i ] );
      }
    }
    return newArray;    
*/