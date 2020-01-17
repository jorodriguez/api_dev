var bcrypt = require('bcryptjs');


function quitarElementosVaciosArray(array){
    if(!Array.isArray(array)){
        console.log("El elemeto para limpiar no es un array.");
        return array;
    }

    return array.filter(Boolean);    
}

function encriptar(texto:string){

    return  bcrypt.hashSync(texto, 8);
    
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


module.exports = {
    quitarElementosVaciosArray,   
    isEmpty , 
    encriptar
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