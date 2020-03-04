
const DIAS = [
        {numero:0,es:'Domingo',es_abr:'Dom'},
        {numero:1,es:'Lunes',es_abr:'Lun'},
        {numero:2,es:'Martes',es_abr:'Mar'},
        {numero:3,es:'Miércoles',es_abr:'Mie'},
        {numero:4,es:'Jueves',es_abr:'Jue'},
        {numero:5,es:'Viernes',es_abr:'Vie'},
        {numero:6,es:'Sábado',es_abr:'Sab'}];

const MESES = [
        {numero:1,es:'Enero',es_abr:'Ene'},
        {numero:2,es:'Febrero',es_abr:'Feb'},
        {numero:3,es:'Marzo',es_abr:'Mar'},
        {numero:4,es:'Abril',es_abr:'Abr'},
        {numero:5,es:'Mayo',es_abr:'May'},
        {numero:6,es:'Junio',es_abr:'Jun'},
        {numero:7,es:'Julio',es_abr:'Jul'},
        {numero:8,es:'Agosto',es_abr:'Ago'},
        {numero:9,es:'Septiembre',es_abr:'Sep'},
        {numero:10,es:'Octubre',es_abr:'Oct'},
        {numero:11,es:'Noviembre',es_abr:'Nov'},
        {numero:12,es:'Diciembre',es_abr:'Dic'}];       

function castNumDayToSpanish(num_day){
    if(numeroValido() && (num_day >= 0 && num_day <= 6)){
        return DIAS.find(e=>e.numero == num_day);
    }
    else return num_day;
}

function castNumMonthToSpanish(num_month){
    if(numeroValido() && (num_month >= 1 && num_month <= 12) ){
        return DIAS.find(e=>e.numero == num_month);
    }
    else return num_month;
}

function numeroValido(num){
    return (num != null && num != undefined);
}



module.exports = {
    castNumDayToSpanish,
    castNumMonthToSpanish
};