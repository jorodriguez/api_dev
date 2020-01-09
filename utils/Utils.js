

function quitarElementosVaciosArray(array){
    if(!Array.isArray(array)){
        console.log("El elemeto para limpiar no es un array.");
        return;
    }
    return array.filter(Boolean);    
}

module.exports = {
    quitarElementosVaciosArray,    
};