#DROP DATABASE codan_gestion_db;
CREATE DATABASE codan_gestion_db;
USE codan_gestion_db;

#DROP TABLE productos;
CREATE TABLE productos (
	codigo_producto VARCHAR(30) UNIQUE NOT NULL
);
INSERT INTO productos VALUES ('Miniconchas');

#DROP TABLE inicio_tandas;
CREATE TABLE inicio_tandas (
	id INT UNIQUE NOT NULL AUTO_INCREMENT,
	id_personalizada VARCHAR(40) UNIQUE,
    jefe VARCHAR(50) NOT NULL,
    linea VARCHAR(16) NOT NULL,
    producto VARCHAR(30) NOT NULL,
    fechahora_inicio TIMESTAMP NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (id),
    FOREIGN KEY (producto) REFERENCES productos(codigo_producto)
);

#DROP TABLE fin_tandas;
CREATE TABLE fin_tandas (
    id_tanda INT UNIQUE NOT NULL,
	fechahora_fin TIMESTAMP NOT NULL DEFAULT current_timestamp,
    kg_teoricos DECIMAL(10,3) NOT NULL,
    kg_reales DECIMAL(10,3) NOT NULL,
    eficiencia DECIMAL(12,3) NOT NULL,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
    PRIMARY KEY (id_tanda)
);

#DROP TABLE incidencias;
CREATE TABLE incidencias (
    id_tanda INT NOT NULL,
    id_incidencia INT UNIQUE NOT NULL AUTO_INCREMENT,
	descripcion VARCHAR(180) NOT NULL,
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

#DROP TABLE pesos;
CREATE TABLE pesos (
    id_tanda INT NOT NULL,
	producto VARCHAR(30) NOT NULL,
    peso_cubeta DECIMAL(9,3) NOT NULL,
	peso_cubeta_neto DECIMAL(6,3) NOT NULL,
    unidad DECIMAL(6,3) NOT NULL,
    hora TIMESTAMP NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
	FOREIGN KEY (producto) REFERENCES productos(codigo_producto),
    PRIMARY KEY (id_tanda, hora)
);