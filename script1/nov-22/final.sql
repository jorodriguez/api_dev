
alter table co_sucursal add column logo text; 

alter table co_sucursal add column color varchar(24); 

update co_sucursal set logo = 'https://magicintelligence.com/wp-content/uploads/2020/09/Logo-Magic.png',color ='#7EC690'  where id in (1,2,3);

update co_sucursal set logo = 'https://res.cloudinary.com/dwttlkcmu/image/upload/v1673368123/magic/Captura_de_pantalla_de_2023-01-10_10-25-28_usuje7.png',color='#21BABF'  where id in (4);

update co_sucursal set nombre = 'Carretera'  where id in (4);

