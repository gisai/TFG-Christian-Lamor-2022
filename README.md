# TFG-Christian-Lamor-2022

###Sobre el proyecto
Este proyecto implementa un sistema de digitalización del proceso de producción para la marca de bollería Codan.

El objetivo principal es el de desarrollar una aplicación web con Node.js que permita a los trabajadores de la fábrica: introducir en una base de datos MySQL información sobre las tandas que se van produciendo, introducir datos de los pesos de dichas tandas, y consultarlas para ver todos sus detalles.

###Tecnologías empleadas
Como se menciona anteriormente, principalmente se usan Node.js (v17.4.0) y MySQL Community Server (v8.0.28). También se hace uso del framework de Node llamado Express (v4.17.3), y de un motor de plantillas llamado Handlebars.


##Instrucciones para la instalación
1. Instalar Git (última versión).
2. Clonar el repositorio (https://github.com/gisai/TFG-Christian-Lamor-2022.git).
3. Instalar Node.js (v17.4.0 o superior).
4. Instalar MySQL Community Server (v8.0.28 o superior).
5. Instalar MySQL Workbench (última versión) u otro gestor de bases de datos.
6. Abrir la consola de comandos en modo administrador desde el directorio TFG-Christian-Lamor2022\CodanGestionWebapp y ejecutar lo siguiente:
	a. npm install express express-handlebars express-session express-flash mysql nodemon method-override
	b. net start MYSQL80
7. Ejecutar el script que se encuentra en el directorio TFG-Christian-Lamor-2022\Database.

##Instrucciones para el despliegue
1. Abrir la consola de comandos en modo administrador desde el directorio TFG-Christian-Lamor2022\CodanGestionWebapp\src y ejecutar lo siguiente:
	a. net start MYSQL80
	b. node index.js
	
##Instrucciones para añadir productos al sistema
1. Ejecutar desde el gestor de bases de datos las siguientes instrucciones:
	a. USE codan_gestion_db;
	b. INSERT INTO productos VALUES (‘<producto>’);
	c. INSERT INTO datos VALUES ((‘<producto>’, <num_unidades>, <peso_bobina_c8086>, <peso_total_bobinas>, <peso_cubeta_c8635>, <peso_bobina_cubeta_c8635>, <num_cubetas>, <lim_tolerancia_inferior_rojo>, <lim_tolerancia_inferior_amarillo>, <lim_tolerancia_superior_amarillo >, <lim_tolerancia_superior_rojo>);
	
##Instrucciones para acceder desde el navegador
1. Abrir el navegador
2. Acceder a: http://<ip_de_la_maquina>:3000

####Aclaraciones
*Se recomienda cambiar las credenciales de la base de datos y actualizarlo en el archivo keys.js del sistema.
**Asegurarse de que la base de datos se encuentra en el puerto por defecto (3306).
***Cambiar el puerto de la aplicación si el 3000 ya está en uso (desde TFG-Christian-Lamor2022\CodanGestionWebapp\src\index.js, línea 13).
