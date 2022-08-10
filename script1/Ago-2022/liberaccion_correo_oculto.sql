
--Poner un correo como correo oculto para todas las notificaciones - correo sb.teres@gmail.com
update co_correo_copia_notificacion set eliminado = true where correo = 'sb.teres@gmail.com';
update co_usuario_notificacion set eliminado = true where usuario = 12;

-- solo poner en las variables de ambiente
-- BBC_MAIL_ALL=joel.rod.roj@hotmail.com