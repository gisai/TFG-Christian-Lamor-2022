#DROP DATABASE codan_gestion_db;
CREATE DATABASE codan_gestion_db;
USE codan_gestion_db;

#DROP TABLE inicio_tandas;
CREATE TABLE inicio_tandas (
	id INT UNIQUE NOT NULL AUTO_INCREMENT,
    jefe VARCHAR(50) NOT NULL,
    linea VARCHAR(16) NOT NULL,
    producto VARCHAR(25) NOT NULL,
    fechahora_inicio TIMESTAMP NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (id)
);
#INSERT INTO inicio_tandas VALUES ('1','Manuel', 'A01', 'Concha', '2022-04-04 08:00:00');
#INSERT INTO inicio_tandas VALUES ('2','Prueba', 'Prueba', 'Prueba', '2022-04-04 08:00:00');
#INSERT INTO inicio_tandas VALUES ('3','P', 'P', 'P', '2022-04-04 08:00:00');

#DROP TABLE fin_tandas;
CREATE TABLE fin_tandas (
    id_tanda INT UNIQUE NOT NULL,
	id_personalizada VARCHAR(24) UNIQUE,
	fechahora_fin TIMESTAMP NOT NULL DEFAULT current_timestamp,
    kg_teoricos DECIMAL(10,3) NOT NULL,
    kg_reales DECIMAL(10,3) NOT NULL,
    eficiencia DECIMAL(10,3) NOT NULL,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
    PRIMARY KEY (id_tanda)
);
#INSERT INTO fin_tandas VALUES ('1', 'CONCH-T1', '2022-04-04 12:00:00', '21', '21', '100');
#INSERT INTO fin_tandas VALUES ('2', null, '2022-04-04 12:00:00', '21', '21', '100');
#INSERT INTO fin_tandas VALUES ('3', null, '2022-04-04 12:00:00', '21', '21', '100');

#DROP TABLE incidencias;
CREATE TABLE incidencias (
    id_tanda INT NOT NULL,
    id_incidencia INT UNIQUE NOT NULL AUTO_INCREMENT,
	descripcion VARCHAR(140) NOT NULL,
    hora_parada TIME NOT NULL,
    hora_reinicio TIME NOT NULL,
    minutos_perdidos DECIMAL,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
    PRIMARY KEY (id_tanda, id_incidencia)
);

#DROP VIEW tandas;
CREATE VIEW tandas AS (
	SELECT id, id_personalizada, jefe, linea, producto, fechahora_inicio, fechahora_fin, kg_teoricos, kg_reales, eficiencia, 
    (SELECT COUNT(*)
    FROM incidencias
    WHERE incidencias.id_tanda = id) AS num_incidencias
    FROM inicio_tandas 
    INNER JOIN fin_tandas ON inicio_tandas.id = fin_tandas.id_tanda
);

#DROP TABLE datos;
CREATE TABLE datos (
	num_unidades INT NOT NULL,
    peso_bobina_c8086 DECIMAL(4,2) NOT NULL,
    peso_total_bobinas DECIMAL(4,2) NOT NULL,
    peso_cubeta_c8231 DECIMAL(4,2) NOT NULL,
    peso_bobina_cubeta_c8635 DECIMAL(4,2) NOT NULL,
    num_cubetas INT NOT NULL
);
INSERT INTO datos VALUES (5, 0.75, 3.75, 21.05, 2.7, 2);

#DROP TABLE productos;
CREATE TABLE productos (
	codigo_producto VARCHAR(30) UNIQUE NOT NULL
);
INSERT INTO productos VALUES ('miniconchas');

#DROP TABLE pesos;
CREATE TABLE pesos (
    id_tanda INT UNIQUE NOT NULL,
	id_personalizada VARCHAR(24) UNIQUE,
	producto VARCHAR(30) NOT NULL,
	peso_cubeta_neto DECIMAL(4,1) NOT NULL,
    unidad DECIMAL(3,1) NOT NULL,
    hora TIMESTAMP NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
	FOREIGN KEY (producto) REFERENCES productos(codigo_producto),
	FOREIGN KEY (id_personalizada) REFERENCES fin_tandas(id_personalizada),
    PRIMARY KEY (id_tanda)
);