
alter table co_sucursal add column logo text; 

alter table co_sucursal add column color varchar(24); 


update co_sucursal set logo = 'https://magicintelligence.com/wp-content/uploads/2020/09/Logo-Magic.png',  where id in (1,2,3);
