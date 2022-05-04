DROP DATABASE codan_gestion_db;
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

#DROP TABLE fin_tandas;
CREATE TABLE fin_tandas (
	id_tanda INT,
	id_personalizada VARCHAR(24) UNIQUE,
	fechahora_fin TIMESTAMP NOT NULL DEFAULT current_timestamp,
    kg_teoricos DECIMAL(10,3) NOT NULL,
    kg_reales DECIMAL(10,3) NOT NULL,
    eficiencia DECIMAL(10,3) NOT NULL,
    FOREIGN KEY (id_tanda) REFERENCES inicio_tandas(id),
    PRIMARY KEY (id_tanda)
);

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
	SELECT id, id_personalizada, jefe, linea, producto, fechahora_inicio, fechahora_fin, kg_teoricos, kg_reales, eficiencia
    FROM inicio_tandas 
    INNER JOIN fin_tandas ON inicio_tandas.id = fin_tandas.id_tanda
);

INSERT INTO inicio_tandas (id, jefe, linea, producto, fechahora_inicio) VALUES
	('1', 'Christian Lamor Utrilla', 'A017', 'Concha 100g', '2022-03-23 8:00:00');
INSERT INTO fin_tandas VALUES ('1', 'CONCH-MT-A017', '2022-03-23 20:00:00', '80', '76.4', '95.5');
INSERT INTO incidencias (id_tanda, descripcion, hora_parada, hora_reinicio, minutos_perdidos) VALUES
	('1', 'Horno averiado', '18:00:00', '19:00:00', '60');