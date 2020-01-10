

function quitarElementosVaciosArray(array){
    if(!Array.isArray(array)){
        console.log("El elemeto para limpiar no es un array.");
        return;
    }

    var newArray = []; //new Array();
    for( var i = 0; i < actual.length; i++ ){
        if ( actual[ i ] ){
          newArray.push( actual[ i ] );
      }
    }
    return newArray;    
}

module.exports = {
    quitarElementosVaciosArray,    
};