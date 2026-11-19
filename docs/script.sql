-- ============================================================
-- ACOMPAÑA — Script completo PostgreSQL
-- Borra todo si existe y recrea de cero
-- Base de datos: acompana (ya creada por Docker)
--No puedo usar USE master - DROP DATABASE acampana -> en SQLserver si se podia
--En PostgreSQL borro las tablas en orden inverso -> siendo este el equivalente
-- ============================================================

-- PASO 1: Borrar tablas en orden inverso de dependencia
DROP TABLE IF EXISTS Solicitudes;
DROP TABLE IF EXISTS Apuntes;
DROP TABLE IF EXISTS ALUMNOSxCARRERAS;
DROP TABLE IF EXISTS ALUMNOSxMATERIAS;
DROP TABLE IF EXISTS Materias;
DROP TABLE IF EXISTS Carreras;
DROP TABLE IF EXISTS Administradores;
DROP TABLE IF EXISTS Alumnos;
DROP TABLE IF EXISTS Personas;

-- ============================================================
-- PASO 2: Crear tablas (orden de dependencia)
-- Tablas maestras (sin dependencias entre sí)
-- 1. Carreras
-- 2. Materias          ← depende de Carreras, ya creada

-- Tablas TPT (herencia)
-- 3. Personas          ← sin dependencias
-- 4. Alumnos           ← depende de Personas
-- 5. Administradores   ← depende de Personas

-- Tablas de unión/aux (muchos a muchos)
-- 6. ALUMNOSxMATERIAS  ← depende de Alumnos + Materias
-- 7. ALUMNOSxCARRERAS  ← depende de Alumnos + Carreras

-- Tablas de movimiento (transacciones)
-- 8. Apuntes           ← depende de Alumnos + Materias
-- 9. Solicitudes       ← depende de Alumnos + Materias
-- ============================================================

-- Tabla maestra
-- Nombre_Ca en VARCHAR(100): hay nombres de carrera de más de 50
-- caracteres (p. ej. "Tecnicatura Universitaria en Gestión de la
-- Industria Automotriz").
CREATE TABLE Carreras (
    IdCarrera_Ca   SERIAL PRIMARY KEY,
    Nombre_Ca      VARCHAR(100) NOT NULL,
    Estado_Ca      BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla maestra: Materias (depende de Carreras)
-- Nombre_Ma en VARCHAR(100): algunas materias (electivas con
-- aclaración incluida) superan los 50 caracteres.
CREATE TABLE Materias (
    IdMateria_Ma      SERIAL PRIMARY KEY,
    IdCarrera_Ca_Ma   INTEGER NOT NULL REFERENCES Carreras(IdCarrera_Ca),
    Nombre_Ma         VARCHAR(100) NOT NULL,
    Estado_Ma         BOOLEAN NOT NULL DEFAULT TRUE
);
 
-- Tabla padre TPT (login vive acá)
CREATE TABLE Personas (
    Dni_P                   VARCHAR(8) PRIMARY KEY,
    Nombre_P                VARCHAR(50) NOT NULL,
    Apellido_P              VARCHAR(50) NOT NULL,
    Sexo_P                  CHAR(1) NOT NULL,
    Direccion_P             VARCHAR(100) NOT NULL,
    Telefono_P              VARCHAR(50) NOT NULL,
    CorreoInstitucional_P   VARCHAR(50) NOT NULL UNIQUE,
    Contrasena_P            VARCHAR(100) NOT NULL,
    Estado_P                BOOLEAN NOT NULL DEFAULT TRUE
);

-- Hija TPT: Alumnos
CREATE TABLE Alumnos (
    Dni_P_A         VARCHAR(8) PRIMARY KEY REFERENCES Personas(Dni_P),
    Legajo_A        VARCHAR(10) NOT NULL UNIQUE,
    Descripcion_A   VARCHAR(50),
    FotoPerfil_A    TEXT
);

-- Hija TPT: Administradores
CREATE TABLE Administradores (
    Dni_P_Ad VARCHAR(8) PRIMARY KEY REFERENCES Personas(Dni_P)
);

-- Tabla de unión: Alumnos x Materias (PK compuesta)
CREATE TABLE ALUMNOSxMATERIAS (
    Dni_A_AxM              VARCHAR(8) NOT NULL REFERENCES Alumnos(Dni_P_A),
    IdMateria_Ma_AxM       INTEGER NOT NULL REFERENCES Materias(IdMateria_Ma),
    EsAprobada_AxM         BOOLEAN NOT NULL DEFAULT FALSE,
    EsTutor_AxM            BOOLEAN NOT NULL DEFAULT FALSE,
    DescripcionTutor_AxM   VARCHAR(200),
    PRIMARY KEY (Dni_A_AxM, IdMateria_Ma_AxM)
);

-- Tabla de unión: Alumnos x Carreras (PK compuesta)
CREATE TABLE ALUMNOSxCARRERAS (
    Dni_A_AxC          VARCHAR(8) NOT NULL REFERENCES Alumnos(Dni_P_A),
    IdCarrera_Ca_AxC   INTEGER NOT NULL REFERENCES Carreras(IdCarrera_Ca),
    EsTerminada_AxC    BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (Dni_A_AxC, IdCarrera_Ca_AxC)
);

-- Tabla de movimiento: Apuntes (PK propia)
CREATE TABLE Apuntes (
    IdApuntes_Ap       SERIAL PRIMARY KEY,
    Dni_A_Ap           VARCHAR(8) NOT NULL REFERENCES Alumnos(Dni_P_A),
    IdMateria_Ma_Ap    INTEGER NOT NULL REFERENCES Materias(IdMateria_Ma),
    Nombre_Ap          VARCHAR(50) NOT NULL,
    Descripcion_Ap     VARCHAR(50),
    RutaArchivo_Ap     TEXT NOT NULL,
    Estado_Ap          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Tabla de movimiento: Solicitudes (PK propia, doble FK a Alumnos)
-- Se mantiene 'Pendiente' como estado válido y por defecto porque la
-- aplicación lo usa al crear nuevas solicitudes; simplemente los
-- datos de prueba ya no traen ninguna pendiente.
CREATE TABLE Solicitudes (
    IdSolicitudes_So       SERIAL PRIMARY KEY,
    DniSolicitante_A_So    VARCHAR(8) NOT NULL REFERENCES Alumnos(Dni_P_A),
    DniTutor_A_So          VARCHAR(8) NOT NULL REFERENCES Alumnos(Dni_P_A),
    IdMateria_Ma_So        INTEGER NOT NULL REFERENCES Materias(IdMateria_Ma),
    Estado_So              VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
                           CHECK (Estado_So IN ('Pendiente', 'Aceptada', 'Rechazada')),
    FechaPedido_So         DATE NOT NULL DEFAULT CURRENT_DATE,
    FechaRespuesta_So      DATE,
    Mensaje_So             TEXT NOT NULL
);

-- ============================================================
-- PASO 3: Cargar datos de prueba
-- ============================================================

-- 3.1 y 3.2 CARRERAS Y MATERIAS
-- 9 carreras completas, cargadas en secciones independientes.
-- La Tecnicatura Universitaria en Programación va primera:
-- sus materias mantienen IdMateria_Ma = 1 a 18,
-- que son los IDs que usan los datos de prueba de más abajo
-- (ALUMNOSxMATERIAS, Apuntes, Solicitudes).
-- ============================================================

-- ============================================================
-- 1) TECNICATURA UNIVERSITARIA EN PROGRAMACIÓN
--    IdCarrera_Ca = 1 | 18 materias | IdMateria_Ma = 1 a 18
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Tecnicatura Universitaria en Programación');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer cuatrimestre
    ('Programación I'),
    ('Arquitectura y Sistemas Operativos'),
    ('Matemática'),
    ('Organización Empresarial'),
    -- Segundo cuatrimestre
    ('Programación II'),
    ('Probabilidad y Estadística'),
    ('Base de Datos I'),
    ('Inglés I'),
    -- Tercer cuatrimestre
    ('Programación III'),
    ('Base de Datos II'),
    ('Metodología de Sistemas I'),
    ('Inglés II'),
    -- Cuarto cuatrimestre
    ('Programación IV'),
    ('Metodología de Sistemas II'),
    ('Introducción al Análisis de Datos'),
    ('Legislación'),
    ('Gestión de Desarrollo de Software'),
    ('Trabajo Final Integrador')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Tecnicatura Universitaria en Programación';


-- ============================================================
-- 2) INGENIERÍA CIVIL
--    IdCarrera_Ca = 2 | 41 materias | IdMateria_Ma = 19 a 59
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Ingeniería Civil');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer nivel
    ('Análisis Matemático I'),
    ('Álgebra y Geometría Analítica'),
    ('Ingeniería y Sociedad'),
    ('Ingeniería Civil I'),
    ('Sistemas de Representación'),
    ('Química General'),
    ('Física I'),
    ('Fundamentos de Informática'),
    -- Segundo nivel
    ('Análisis Matemático II'),
    ('Estabilidad'),
    ('Ingeniería Civil II'),
    ('Tecnología de los Materiales'),
    ('Física II'),
    ('Probabilidad y Estadística'),
    ('Inglés I'),
    -- Tercer nivel
    ('Resistencia de Materiales'),
    ('Tecnología del Hormigón'),
    ('Tecnología de la Construcción'),
    ('Geotopografía'),
    ('Hidráulica General y Aplicada'),
    ('Cálculo Avanzado'),
    ('Instalaciones Eléctricas Acústicas'),
    ('Instalaciones Termomecánicas'),
    ('Economía'),
    ('Inglés II'),
    -- Cuarto nivel
    ('Geotecnia'),
    ('Instalaciones Sanitarias y de Gas'),
    ('Diseño Arquitectónico, Planeamiento y Urbanismo'),
    ('Análisis Estructural I'),
    ('Estructuras de Hormigón'),
    ('Hidrología y Obras Hidráulicas'),
    ('Ingeniería Legal'),
    -- Quinto nivel
    ('Construcciones Metálicas y de Madera'),
    ('Cimentaciones'),
    ('Ingeniería Sanitaria'),
    ('Organización y Conducción de Obras'),
    ('Vías de Comunicación I'),
    ('Análisis Estructural II'),
    ('Vías de Comunicación II'),
    ('Gestión Ambiental y Desarrollo Sustentable'),
    -- Sexto nivel
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Ingeniería Civil';


-- ============================================================
-- 3) TECNICATURA UNIVERSITARIA EN MOLDES, MATRICES Y DISPOSITIVOS
--    IdCarrera_Ca = 3 | 21 materias | IdMateria_Ma = 60 a 80
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Tecnicatura Universitaria en Moldes, Matrices y Dispositivos');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    ('Tecnología en Medios de Producción I'),
    ('Dispositivos y Utilajes'),
    ('Matemática'),
    ('Física'),
    ('Relaciones Industriales'),
    ('Informática I'),
    ('Mecánica I'),
    ('Sistemas de Representación'),
    ('Conocimiento de Materiales'),
    ('Inglés'),
    ('Tecnología en Medios de Producción II'),
    ('Informática II'),
    ('Mantenimiento'),
    ('Mecánica II'),
    ('Gestión de la Calidad y Metrología'),
    ('Inyección y Fundición'),
    ('Mecanizado'),
    ('Tecnología del Estampado'),
    ('Automación Industrial'),
    ('Seguridad, Higiene y Protección Ambiental'),
    ('Práctica Supervisada')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Tecnicatura Universitaria en Moldes, Matrices y Dispositivos';


-- ============================================================
-- 4) TECNICATURA UNIVERSITARIA EN ADMINISTRACIÓN
--    IdCarrera_Ca = 4 | 20 materias | IdMateria_Ma = 81 a 100
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Tecnicatura Universitaria en Administración');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer nivel
    ('Administración General I'),
    ('Matemática General'),
    ('Informática I'),
    ('Problemática Social Contemporánea'),
    ('Economía I'),
    ('Psicología de las Organizaciones'),
    ('Ambiente, Economía y Sociedad'),
    ('Legislación I'),
    ('Estado y Sociedad'),
    ('Seminario'),
    -- Segundo nivel
    ('Administración General II'),
    ('Informática II'),
    ('Comportamiento Organizacional'),
    ('Estadística'),
    ('Economía II'),
    ('Legislación II'),
    ('Administración Estatal'),
    ('Gestión de Recursos Humanos'),
    ('Finanzas y Técnicas Contables'),
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Tecnicatura Universitaria en Administración';


-- ============================================================
-- 5) TECNICATURA UNIVERSITARIA EN GESTIÓN DE LA INDUSTRIA AUTOMOTRIZ
--    IdCarrera_Ca = 5 | 30 materias | IdMateria_Ma = 101 a 130
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Tecnicatura Universitaria en Gestión de la Industria Automotriz');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer año
    ('Matemática I'),
    ('Industria Automotriz y Sociedad'),
    ('Taller de Sistema de Representación'),
    ('Química'),
    ('Organización y Administración de la Industria'),
    ('Matemática II'),
    ('Desarrollo de Recursos Humanos'),
    ('Física I'),
    ('Probabilidad y Estadística'),
    ('Taller de Utilitarios de PC'),
    -- Segundo año
    ('Calidad'),
    ('Física II'),
    ('Sistemas del Automóvil'),
    ('Finanzas y Comercialización de la Industria'),
    ('Informática Aplicada'),
    ('Tecnología de los Materiales'),
    ('Manufactura I'),
    ('Seguridad del Trabajo y Ambiental'),
    ('Taller de Idiomas I'),
    -- Tercer año
    ('Sistemas Metrológicos'),
    ('Manufactura II'),
    ('Formulación y Evaluación de Proyectos'),
    ('Legislación de la Industria Automotriz'),
    ('Taller de Idiomas II'),
    ('Fuentes Proveedoras de la Industria Automotriz'),
    ('Planificación y Control de la Producción'),
    ('Mantenimiento de Plantas Automotrices'),
    ('Ensayos'),
    ('Taller de Idiomas III'),
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Tecnicatura Universitaria en Gestión de la Industria Automotriz';

-- ============================================================
-- 6) INGENIERÍA EN ENERGÍA ELÉCTRICA
--    IdCarrera_Ca = 6 | 41 materias | IdMateria_Ma = 131 a 171
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Ingeniería en Energía Eléctrica');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer nivel
    ('Análisis Matemático I'),
    ('Álgebra y Geometría Analítica'),
    ('Ingeniería y Sociedad'),
    ('Sistemas de Representación'),
    ('Física I'),
    ('Química General'),
    ('Integración Eléctrica I'),
    ('Fundamentos de Informática'),
    -- Segundo nivel
    ('Física II'),
    ('Probabilidad y Estadística'),
    ('Electrotecnia I'),
    ('Estabilidad'),
    ('Mecánica Técnica'),
    ('Integración Eléctrica II'),
    ('Inglés I'),
    ('Análisis Matemático II'),
    ('Cálculo Numérico'),
    -- Tercer nivel
    ('Tecnologías y Ensayos de Materiales Eléctricos'),
    ('Instrumentos y Mediciones Eléctricas'),
    ('Teoría de los Campos'),
    ('Física III'),
    ('Máquinas Eléctricas I'),
    ('Electrotecnia II'),
    ('Termodinámica'),
    ('Fundamentos para el Análisis de Señales'),
    ('Taller Interdisciplinario'),
    -- Cuarto nivel
    ('Inglés II'),
    ('Economía'),
    ('Electrónica I'),
    ('Máquinas Eléctricas II'),
    ('Seguridad, Riesgo Eléctrico y Medio Ambiente'),
    ('Instalaciones Eléctricas y Luminotecnia'),
    ('Control Automático'),
    ('Máquinas Térmicas, Hidráulicas y de Fluido'),
    ('Legislación'),
    -- Quinto nivel
    ('Electrónica II'),
    ('Generación, Transmisión y Distribución de la Energía Eléctrica'),
    ('Sistemas de Potencia'),
    ('Accionamientos y Controles Eléctricos'),
    ('Organización y Administración de Empresas'),
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Ingeniería en Energía Eléctrica';

-- ============================================================
-- 7) INGENIERÍA EN INDUSTRIA AUTOMOTRIZ
--    IdCarrera_Ca = 7 | 42 materias | IdMateria_Ma = 172 a 213
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Ingeniería en Industria Automotriz');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer nivel
    ('Análisis Matemático I'),
    ('Química General'),
    ('Sistemas de Representación'),
    ('Ingeniería y Sociedad'),
    ('Informática I'),
    ('Ingeniería en la Industria Automotriz I'),
    ('Física I'),
    ('Álgebra y Geometría Analítica'),
    -- Segundo nivel
    ('Análisis Matemático II'),
    ('Probabilidad y Estadística'),
    ('Ciencia de los Materiales'),
    ('Física II'),
    ('Economía General'),
    ('Informática Aplicada'),
    ('Ingeniería en la Industria Automotriz II'),
    ('Inglés I'),
    -- Tercer nivel
    ('Análisis Numérico y Cálculo Avanzado'),
    ('Termodinámica y Máquinas Térmicas'),
    ('Mecánica de los Fluidos'),
    ('Estática y Resistencia de los Materiales'),
    ('Economía de la Industria Automotriz'),
    ('Sistemas Eléctricos y Electrónicos'),
    ('Estudio del Trabajo'),
    ('Investigación Operativa'),
    ('Legislación de la Industria Automotriz'),
    ('Taller Interdisciplinario'),
    -- Cuarto nivel
    ('Instalaciones y Plantas Industriales'),
    ('Seguridad, Higiene e Ingeniería Ambiental'),
    ('Procesos Industriales y de Manufactura'),
    ('Mecánica Automotriz'),
    ('Ingeniería en Calidad'),
    ('Planificación y Control de la Producción'),
    ('Diseño de Producto'),
    ('Formulación y Evaluación de Proyectos'),
    ('Organización y Administración de Empresas'),
    ('Comercialización'),
    ('Inglés II'),
    -- Quinto nivel
    ('Mantenimiento'),
    ('Control de Gestión'),
    ('Gerenciamiento de Recursos Humanos'),
    ('Logística'),
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Ingeniería en Industria Automotriz';


-- ============================================================
-- 8) INGENIERÍA MECÁNICA
--    IdCarrera_Ca = 8 | 51 materias | IdMateria_Ma = 214 a 264
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Ingeniería Mecánica');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer año
    ('Álgebra y Geometría Analítica'),
    ('Análisis Matemático I'),
    ('Física I'),
    ('Fundamentos de Informática'),
    ('Ingeniería Mecánica I'),
    ('Ingeniería y Sociedad'),
    ('Química General'),
    ('Sistemas de Representación'),
    -- Segundo año
    ('Análisis Matemático II'),
    ('Estabilidad I'),
    ('Física II'),
    ('Ingeniería Mecánica II'),
    ('Inglés Técnico Nivel I'),
    ('Materiales Metálicos'),
    ('Probabilidad y Estadística'),
    ('Materiales No Metálicos'),
    -- Tercer año
    ('Cálculo Avanzado'),
    ('Diseño Mecánico'),
    ('Estabilidad II'),
    ('Ingeniería Ambiental y Seguridad Industrial'),
    ('Ingeniería Mecánica III'),
    ('Inglés Técnico Nivel II'),
    ('Mecánica Racional'),
    ('Mediciones y Ensayos Industriales'),
    ('Metodología para el Desarrollo de la Creatividad (Electiva)'),
    ('Termodinámica'),
    ('Energías Renovables (Electiva)'),
    -- Cuarto año
    ('Diseño Mecánico II (Electiva)'),
    ('Economía'),
    ('Electrónica y Sistemas de Control'),
    ('Electrotecnia y Máquinas Eléctricas'),
    ('Elementos de Máquinas'),
    ('Estabilidad III'),
    ('Física III (Electiva)'),
    ('Legislación'),
    ('Mecánica de los Fluidos'),
    ('Introducción a la Investigación Científica (Electiva)'),
    ('Metrología e Ingeniería de Calidad'),
    ('Selección de Materiales para Diseño Mecánico (Electiva)'),
    ('Tecnología del Calor'),
    ('Introducción al Método de Elementos Finitos (Electiva)'),
    -- Quinto año
    ('Innovación y Emprendedorismo Tecnológico (Electiva)'),
    ('Gestión de Calidad (Electiva)'),
    ('Instalaciones Industriales'),
    ('Mantenimiento'),
    ('Máquinas Alternativas y Turbo Máquinas'),
    ('Mecatrónica (Electiva)'),
    ('Organización Industrial'),
    ('Proyecto Final'),
    ('Tecnología de Fabricación'),
    ('Práctica Supervisada')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Ingeniería Mecánica';


-- ============================================================
-- 9) LICENCIATURA EN ORGANIZACIÓN INDUSTRIAL
--    IdCarrera_Ca = 9 | 39 materias | IdMateria_Ma = 265 a 303
-- ============================================================
INSERT INTO Carreras (Nombre_Ca) VALUES
('Licenciatura en Organización Industrial');

INSERT INTO Materias (IdCarrera_Ca_Ma, Nombre_Ma)
SELECT c.IdCarrera_Ca, v.Nombre
FROM Carreras c
CROSS JOIN (VALUES
    -- Primer año
    ('Análisis Matemático'),
    ('Química'),
    ('Álgebra'),
    ('Física'),
    ('Organización Industrial I'),
    ('Economía General'),
    ('Informática I'),
    ('Sistemas de Representación'),
    -- Segundo año
    ('Probabilidad y Estadística'),
    ('Conocimiento de Materiales'),
    ('Costos'),
    ('Informática II'),
    ('Legislación'),
    ('Investigación Operativa'),
    ('Procesos Industriales'),
    ('Estudio del Trabajo'),
    ('Comercialización'),
    ('Organización Industrial II'),
    ('Inglés Técnico Nivel I'),
    ('Simulación de Diseño Industrial'),
    -- Tercer año
    ('Economía de la Empresa'),
    ('Ingeniería de Calidad'),
    ('Sistemas y Métodos Administrativos'),
    ('Análisis de Estados Contables'),
    ('Planificación y Control de la Producción'),
    ('Organización Industrial III'),
    ('Seguridad, Higiene e Ingeniería Ambiental'),
    ('Inglés Técnico Nivel II'),
    -- Cuarto año
    ('Evaluación de Proyectos'),
    ('Comercio Exterior'),
    ('Logística Integral'),
    ('Control de Gestión'),
    ('Relaciones Industriales'),
    ('Administración Financiera'),
    ('Administración Estratégica'),
    ('Tecnología Aplicada a los Procesos Industriales'),
    ('Mejora Continua'),
    ('Innovación y Emprendedorismo Tecnológico'),
    ('Proyecto Final')
) AS v(Nombre)
WHERE c.Nombre_Ca = 'Licenciatura en Organización Industrial';

-- ============================================================
-- 3.3 PERSONAS — 3 admins + 30 alumnos = 33 personas

-- con hash generado con bf' significa Blowfish, el algoritmo interno que usa bcrypt
-- crypt('contraseña', gen_salt('bf', 10)) genera un hash bcrypt real con costo 10 y con salt hago que dos pass iguales tengan != hash. 
-- Admins: correo @docentes.frgp.utn.edu.ar y  Alumnos: correo @alumnos.frgp.utn.edu.ar
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ===== ADMINISTRADORES (3) =====
INSERT INTO Personas (Dni_P, Nombre_P, Apellido_P, Sexo_P, Direccion_P, Telefono_P, CorreoInstitucional_P, Contrasena_P) VALUES
('10000001', 'Laura', 'Palermo', 'F', 'Av. Constituyentes 900', '1140001001', 'admin@docentes.frgp.utn.edu.ar', crypt('1', gen_salt('bf', 10))),
('10000002', 'Roberto', 'Sanchez', 'M', 'Mitre 450', '1140002002', 'rsanchez@docentes.frgp.utn.edu.ar', crypt('admin2', gen_salt('bf', 10))),
('10000003', 'Graciela', 'Mendez', 'F', 'Saavedra 120', '1140003003', 'gmendez@docentes.frgp.utn.edu.ar', crypt('admin3', gen_salt('bf', 10)));

-- ===== ALUMNOS (30) =====
-- Originales (8)
INSERT INTO Personas (Dni_P, Nombre_P, Apellido_P, Sexo_P, Direccion_P, Telefono_P, CorreoInstitucional_P, Contrasena_P) VALUES
('33626855', 'Miguel', 'Lardo', 'M', 'Calle Falsa 123', '1155667788', 'alumno@alumnos.frgp.utn.edu.ar', crypt('1', gen_salt('bf', 10))),
('30000002', 'Lourdes', 'Garcia', 'F', 'Belgrano 321', '1133445566', 'lgarcia@alumnos.frgp.utn.edu.ar', crypt('lourdes1', gen_salt('bf', 10))),
('30000003', 'Ella', 'Lo Re Mansilla', 'F', 'San Martin 100', '1144556677', 'elore@alumnos.frgp.utn.edu.ar', crypt('ella1', gen_salt('bf', 10))),
('30000004', 'Lautaro', 'Rodriguez', 'M', 'Sarmiento 750', '1155887799', 'lrodriguez@alumnos.frgp.utn.edu.ar', crypt('lautaro1', gen_salt('bf', 10))),
('30000005', 'Natalia', 'Mucci', 'F', 'Rivadavia 1234', '1166778899', 'nmucci@alumnos.frgp.utn.edu.ar', crypt('natalia1', gen_salt('bf', 10))),
('30000006', 'Carlos', 'Vega', 'M', 'Moreno 450', '1177889900', 'cvega@alumnos.frgp.utn.edu.ar', crypt('carlos1', gen_salt('bf', 10))),
('30000007', 'Sandra', 'Molina', 'F', 'Urquiza 890', '1188990011', 'smolina@alumnos.frgp.utn.edu.ar', crypt('sandra1', gen_salt('bf', 10))),
('30000008', 'Raul', 'Benitez', 'M', 'Alem 234', '1199001122', 'rbenitez@alumnos.frgp.utn.edu.ar', crypt('raul1', gen_salt('bf', 10)));

-- Nuevos (22)
INSERT INTO Personas (Dni_P, Nombre_P, Apellido_P, Sexo_P, Direccion_P, Telefono_P, CorreoInstitucional_P, Contrasena_P) VALUES
('30000009', 'Valentina', 'Torres', 'F', 'Av. Mitre 560', '1122334455', 'vtorres@alumnos.frgp.utn.edu.ar', crypt('Vtorres2026', gen_salt('bf', 10))),
('30000010', 'Facundo', 'Gomez', 'M', 'Jujuy 234', '1122445566', 'fgomez@alumnos.frgp.utn.edu.ar', crypt('Fgomez2026', gen_salt('bf', 10))),
('30000011', 'Camila', 'Fernandez', 'F', 'Tucuman 890', '1122556677', 'cfernandez@alumnos.frgp.utn.edu.ar', crypt('Cfernandez2026', gen_salt('bf', 10))),
('30000012', 'Tomas', 'Diaz', 'M', 'Corrientes 1100', '1122667788', 'tdiaz@alumnos.frgp.utn.edu.ar', crypt('Tdiaz2026', gen_salt('bf', 10))),
('30000013', 'Martina', 'Lopez', 'F', 'Entre Rios 340', '1122778899', 'mlopez@alumnos.frgp.utn.edu.ar', crypt('Mlopez2026', gen_salt('bf', 10))),
('30000014', 'Agustin', 'Martinez', 'M', 'Santa Fe 670', '1122889900', 'amartinez@alumnos.frgp.utn.edu.ar', crypt('Amartinez2026', gen_salt('bf', 10))),
('30000015', 'Julieta', 'Perez', 'F', 'Catamarca 120', '1122990011', 'jperez@alumnos.frgp.utn.edu.ar', crypt('Jperez2026', gen_salt('bf', 10))),
('30000016', 'Nicolas', 'Romero', 'M', 'La Rioja 450', '1123001122', 'nromero@alumnos.frgp.utn.edu.ar', crypt('Nromero2026', gen_salt('bf', 10))),
('30000017', 'Sofia', 'Alvarez', 'F', 'Mendoza 780', '1123112233', 'salvarez@alumnos.frgp.utn.edu.ar', crypt('Salvarez2026', gen_salt('bf', 10))),
('30000018', 'Matias', 'Gutierrez', 'M', 'San Juan 900', '1123223344', 'mgutierrez@alumnos.frgp.utn.edu.ar', crypt('Mgutierrez2026', gen_salt('bf', 10))),
('30000019', 'Rocio', 'Castro', 'F', 'San Luis 230', '1123334455', 'rcastro@alumnos.frgp.utn.edu.ar', crypt('Rcastro2026', gen_salt('bf', 10))),
('30000020', 'Gonzalo', 'Herrera', 'M', 'Formosa 560', '1123445566', 'gherrera@alumnos.frgp.utn.edu.ar', crypt('Gherrera2026', gen_salt('bf', 10))),
('30000021', 'Luciana', 'Acosta', 'F', 'Chaco 120', '1123556677', 'lacosta@alumnos.frgp.utn.edu.ar', crypt('Lacosta2026', gen_salt('bf', 10))),
('30000022', 'Federico', 'Rojas', 'M', 'Misiones 340', '1123667788', 'frojas@alumnos.frgp.utn.edu.ar', crypt('Frojas2026', gen_salt('bf', 10))),
('30000023', 'Aldana', 'Navarro', 'F', 'Neuquen 670', '1123778899', 'anavarro@alumnos.frgp.utn.edu.ar', crypt('Anavarro2026', gen_salt('bf', 10))),
('30000024', 'Ignacio', 'Medina', 'M', 'Rio Negro 890', '1123889900', 'imedina@alumnos.frgp.utn.edu.ar', crypt('Imedina2026', gen_salt('bf', 10))),
('30000025', 'Florencia', 'Sosa', 'F', 'Chubut 120', '1123990011', 'fsosa@alumnos.frgp.utn.edu.ar', crypt('Fsosa2026', gen_salt('bf', 10))),
('30000026', 'Ezequiel', 'Ruiz', 'M', 'Santa Cruz 450', '1124001122', 'eruiz@alumnos.frgp.utn.edu.ar', crypt('Eruiz2026', gen_salt('bf', 10))),
('30000027', 'Micaela', 'Flores', 'F', 'Tierra del Fuego 230', '1124112233', 'mflores@alumnos.frgp.utn.edu.ar', crypt('Mflores2026', gen_salt('bf', 10))),
('30000028', 'Santiago', 'Pereyra', 'M', 'Av. Libertador 1500', '1124223344', 'spereyra@alumnos.frgp.utn.edu.ar', crypt('Spereyra2026', gen_salt('bf', 10))),
('30000029', 'Abril', 'Dominguez', 'F', 'Av. San Martin 2100', '1124334455', 'adominguez@alumnos.frgp.utn.edu.ar', crypt('Adominguez2026', gen_salt('bf', 10))),
('30000030', 'Bruno', 'Cabrera', 'M', 'Av. Rivadavia 3400', '1124445566', 'bcabrera@alumnos.frgp.utn.edu.ar', crypt('Bcabrera2026', gen_salt('bf', 10)));

-- 3.4 ADMINISTRADORES (3)
INSERT INTO Administradores (Dni_P_Ad) VALUES
('10000001'),
('10000002'),
('10000003');

-- 3.5 ALUMNOS (30)
INSERT INTO Alumnos (Dni_P_A, Legajo_A, Descripcion_A) VALUES
('33626855', '00001', 'Alumno de prueba principal'),
('30000002', '00002', 'Alumna y tutora'),
('30000003', '00003', NULL),
('30000004', '00004', NULL),
('30000005', '00005', 'Sube muchos apuntes'),
('30000006', '00006', NULL),
('30000007', '00007', NULL),
('30000008', '00008', NULL),
('30000009', '00009', 'Estudiante de segundo año'),
('30000010', '00010', NULL),
('30000011', '00011', 'Interesada en tutorías de matemática'),
('30000012', '00012', NULL),
('30000013', '00013', 'Delegada del curso'),
('30000014', '00014', NULL),
('30000015', '00015', 'Busca tutores para parciales'),
('30000016', '00016', NULL),
('30000017', '00017', 'Compartir apuntes de programación'),
('30000018', '00018', NULL),
('30000019', '00019', NULL),
('30000020', '00020', 'Tutor de arquitectura'),
('30000021', '00021', NULL),
('30000022', '00022', NULL),
('30000023', '00023', 'Ingresante 2026'),
('30000024', '00024', NULL),
('30000025', '00025', 'Busca grupo de estudio'),
('30000026', '00026', NULL),
('30000027', '00027', NULL),
('30000028', '00028', 'Estudiante avanzado'),
('30000029', '00029', NULL),
('30000030', '00030', NULL);

-- 3.6 ALUMNOSxCARRERAS (todos en TUP)
INSERT INTO ALUMNOSxCARRERAS (Dni_A_AxC, IdCarrera_Ca_AxC) VALUES
('33626855', 1), ('30000002', 1), ('30000003', 1), ('30000004', 1),
('30000005', 1), ('30000006', 1), ('30000007', 1), ('30000008', 1),
('30000009', 1), ('30000010', 1), ('30000011', 1), ('30000012', 1),
('30000013', 1), ('30000014', 1), ('30000015', 1), ('30000016', 1),
('30000017', 1), ('30000018', 1), ('30000019', 1), ('30000020', 1),
('30000021', 1), ('30000022', 1), ('30000023', 1), ('30000024', 1),
('30000025', 1), ('30000026', 1), ('30000027', 1), ('30000028', 1),
('30000029', 1), ('30000030', 1);

-- 3.7 ALUMNOSxMATERIAS
-- Se amplió la cantidad de tutores: ahora todas las materias del
-- primer cuatrimestre (1 a 4) tienen varios tutores, y también hay
-- tutores para materias del segundo cuatrimestre (5 a 8).
-- [NUEVO TUTOR] marca las filas que antes no eran tutoría o que se agregaron.

-- Originales
INSERT INTO ALUMNOSxMATERIAS (Dni_A_AxM, IdMateria_Ma_AxM, EsAprobada_AxM, EsTutor_AxM, DescripcionTutor_AxM) VALUES
('33626855', 1, TRUE, TRUE,  'Disponible sábados por la mañana'),
('33626855', 2, TRUE, FALSE, NULL),
('33626855', 3, TRUE, TRUE,  'Puedo ayudar con práctica y teoría'),
('33626855', 4, TRUE, FALSE, NULL),
('33626855', 5, TRUE, TRUE,  'Programación orientada a objetos, martes y jueves'),        -- [NUEVO TUTOR]
('30000002', 1, TRUE, TRUE,  'Repaso de ejercicios tipo parcial'),                        -- [NUEVO TUTOR]
('30000002', 2, TRUE, TRUE,  'Disponible tardes entre semana'),
('30000002', 3, TRUE, FALSE, NULL),
('30000002', 6, TRUE, TRUE,  'Ejercicios guiados de probabilidad'),                       -- [NUEVO TUTOR]
('30000003', 1, TRUE, FALSE, NULL),
('30000003', 4, TRUE, TRUE,  'Resúmenes y casos prácticos'),                              -- [NUEVO TUTOR]
('30000004', 1, TRUE, FALSE, NULL),
('30000005', 1, TRUE, TRUE,  'Comparto mis apuntes y explico dudas'),                     -- [NUEVO TUTOR]
('30000005', 2, TRUE, FALSE, NULL),
('30000005', 3, TRUE, TRUE,  'Matrices y álgebra, lunes y miércoles'),                    -- [NUEVO TUTOR]
('30000006', 1, TRUE, FALSE, NULL),
('30000006', 3, TRUE, TRUE,  'Práctica online por videollamada'),                         -- [NUEVO TUTOR]
('30000007', 2, TRUE, FALSE, NULL),
('30000008', 1, TRUE, FALSE, NULL),
('30000008', 4, TRUE, TRUE,  'Disponible jueves por la tarde');                           -- [NUEVO TUTOR]

-- Nuevos alumnos con materias variadas
INSERT INTO ALUMNOSxMATERIAS (Dni_A_AxM, IdMateria_Ma_AxM, EsAprobada_AxM, EsTutor_AxM, DescripcionTutor_AxM) VALUES
('30000009', 1, TRUE, FALSE, NULL),
('30000009', 2, TRUE, TRUE,  'Ayudo con ejercicios prácticos'),
('30000009', 3, TRUE, FALSE, NULL),
('30000010', 1, TRUE, FALSE, NULL),
('30000010', 4, TRUE, TRUE,  'Preparación de finales'),                                   -- [NUEVO TUTOR]
('30000011', 1, TRUE, FALSE, NULL),
('30000011', 3, TRUE, TRUE,  'Clases por videollamada'),
('30000012', 1, TRUE, FALSE, NULL),
('30000012', 2, TRUE, FALSE, NULL),
('30000013', 1, TRUE, FALSE, NULL),
('30000013', 2, TRUE, FALSE, NULL),
('30000013', 3, TRUE, TRUE,  'Formulario y repaso para parciales'),                       -- [NUEVO TUTOR]
('30000013', 4, TRUE, TRUE,  'Organizo grupos de estudio presenciales'),                  -- [NUEVO TUTOR]
('30000014', 1, TRUE, TRUE,  'Fines de semana por la tarde'),
('30000014', 2, TRUE, FALSE, NULL),
('30000015', 1, TRUE, FALSE, NULL),
('30000016', 1, TRUE, FALSE, NULL),
('30000016', 2, TRUE, FALSE, NULL),
('30000017', 1, TRUE, TRUE,  'Punteros, arreglos y memoria dinámica'),                    -- [NUEVO TUTOR]
('30000017', 3, TRUE, FALSE, NULL),
('30000018', 2, TRUE, FALSE, NULL),
('30000019', 1, TRUE, FALSE, NULL),
('30000019', 4, TRUE, FALSE, NULL),
('30000020', 1, TRUE, FALSE, NULL),
('30000020', 2, TRUE, TRUE,  'Preparo para parciales de arquitectura'),
('30000020', 3, TRUE, FALSE, NULL),
('30000020', 4, TRUE, TRUE,  'Consultas por videollamada'),                               -- [NUEVO TUTOR]
('30000021', 1, TRUE, FALSE, NULL),
('30000022', 3, TRUE, FALSE, NULL),
('30000023', 1, TRUE, FALSE, NULL),
('30000024', 1, TRUE, FALSE, NULL),
('30000024', 2, TRUE, TRUE,  'Procesos, hilos y concurrencia'),                           -- [NUEVO TUTOR]
('30000025', 1, TRUE, FALSE, NULL),
('30000025', 3, TRUE, FALSE, NULL),
('30000026', 4, TRUE, FALSE, NULL),
('30000027', 1, TRUE, FALSE, NULL),
('30000027', 2, TRUE, FALSE, NULL),
('30000028', 1, TRUE, TRUE,  'Consultas por mail o presencial'),
('30000028', 2, TRUE, TRUE,  'Horarios flexibles'),
('30000028', 3, TRUE, TRUE,  'Repaso integral antes del final'),                          -- [NUEVO TUTOR]
('30000028', 4, TRUE, FALSE, NULL),
('30000028', 5, TRUE, TRUE,  'POO y colecciones'),                                        -- [NUEVO TUTOR]
('30000028', 6, TRUE, FALSE, NULL),
('30000028', 7, TRUE, TRUE,  'SQL, normalización y modelado'),                            -- [NUEVO TUTOR]
('30000028', 8, TRUE, TRUE,  'Inglés técnico, lectura de documentación'),                 -- [NUEVO TUTOR]
('30000029', 1, TRUE, FALSE, NULL),
('30000030', 1, TRUE, FALSE, NULL),
('30000030', 2, TRUE, FALSE, NULL);

-- 3.8 APUNTES (variados)
INSERT INTO Apuntes (Dni_A_Ap, IdMateria_Ma_Ap, Nombre_Ap, Descripcion_Ap, RutaArchivo_Ap) VALUES
('33626855', 1, 'Resumen Prog1 - Variables', 'Tipos de datos y variables', 'https://res.cloudinary.com/demo/raw/upload/resumen_prog1_variables.pdf'),
('33626855', 3, 'Ejercicios Matemática', 'Práctica de álgebra', 'https://res.cloudinary.com/demo/raw/upload/ejercicios_matematica.pdf'),
('30000005', 1, 'Apunte Prog1 - Funciones', 'Funciones y procedimientos', 'https://res.cloudinary.com/demo/raw/upload/prog1_funciones.pdf'),
('30000005', 1, 'Parcial Prog1 resuelto', 'Primer parcial 2025', 'https://res.cloudinary.com/demo/raw/upload/parcial_prog1.pdf'),
('30000005', 2, 'Resumen Arq - CPU', 'Arquitectura del procesador', 'https://res.cloudinary.com/demo/raw/upload/arq_cpu.pdf'),
('30000005', 2, 'Apunte Arq - Memoria', 'Tipos de memoria', 'https://res.cloudinary.com/demo/raw/upload/arq_memoria.pdf'),
('30000005', 3, 'Guía Matemática - Matrices', 'Operaciones con matrices', 'https://res.cloudinary.com/demo/raw/upload/mat_matrices.pdf'),
('30000005', 3, 'Parcial Matemática resuelto', 'Segundo parcial 2025', 'https://res.cloudinary.com/demo/raw/upload/parcial_mat.pdf'),
('30000009', 2, 'Apunte Arq - Procesos', 'Hilos y concurrencia', 'https://res.cloudinary.com/demo/raw/upload/arq_procesos.pdf'),
('30000013', 1, 'Resumen Prog1 - Arreglos', 'Arrays y matrices en C', 'https://res.cloudinary.com/demo/raw/upload/prog1_arreglos.pdf'),
('30000013', 3, 'Formulario Matemática', 'Fórmulas para el parcial', 'https://res.cloudinary.com/demo/raw/upload/mat_formulario.pdf'),
('30000017', 1, 'Guía Prog1 - Punteros', 'Punteros y memoria dinámica', 'https://res.cloudinary.com/demo/raw/upload/prog1_punteros.pdf'),
('30000020', 2, 'Resumen Arq - Cache', 'Memoria cache y jerarquía', 'https://res.cloudinary.com/demo/raw/upload/arq_cache.pdf'),
('30000028', 1, 'Parcial Prog1 2do resuelto', 'Segundo parcial 2025 resuelto', 'https://res.cloudinary.com/demo/raw/upload/parcial_prog1_2do.pdf'),
('30000028', 4, 'Resumen Org Empresarial', 'Estructuras organizacionales', 'https://res.cloudinary.com/demo/raw/upload/org_resumen.pdf'),
('30000009', 19, 'Resumen Análisis Matemático I', 'Límites y derivadas', 'https://res.cloudinary.com/demo/raw/upload/civil_analisis1.pdf'),
('30000013', 20, 'Apunte Álgebra - Matrices', 'Matrices y determinantes', 'https://res.cloudinary.com/demo/raw/upload/civil_algebra.pdf'),
('30000020', 21, 'Guía Ingeniería y Sociedad', 'Resumen para el parcial', 'https://res.cloudinary.com/demo/raw/upload/civil_ing_sociedad.pdf');

-- 3.9 SOLICITUDES
-- La tabla queda vacía a propósito: no se cargan solicitudes de prueba
-- (ni pendientes, ni aceptadas, ni rechazadas). Se crean desde la app.

-- ============================================================
-- PASO 4: Verificaciones
-- ============================================================

-- 4.1 Todas las personas con su rol
SELECT
    p.Dni_P,
    p.Nombre_P || ' ' || p.Apellido_P AS NombreCompleto,
    p.CorreoInstitucional_P,
    CASE
        WHEN ad.Dni_P_Ad IS NOT NULL THEN 'Administrador'
        WHEN a.Dni_P_A IS NOT NULL THEN 'Alumno'
    END AS Rol
FROM Personas p
LEFT JOIN Administradores ad ON p.Dni_P = ad.Dni_P_Ad
LEFT JOIN Alumnos a ON p.Dni_P = a.Dni_P_A
ORDER BY Rol, p.Apellido_P;

-- 4.2 Materias aprobadas y tutorías por alumno
SELECT
    p.Nombre_P || ' ' || p.Apellido_P AS Alumno,
    m.Nombre_Ma AS Materia,
    am.EsAprobada_AxM AS Aprobada,
    am.EsTutor_AxM AS EsTutor,
    am.DescripcionTutor_AxM AS DisponibilidadTutor
FROM ALUMNOSxMATERIAS am
JOIN Alumnos a ON am.Dni_A_AxM = a.Dni_P_A
JOIN Personas p ON a.Dni_P_A = p.Dni_P
JOIN Materias m ON am.IdMateria_Ma_AxM = m.IdMateria_Ma
ORDER BY p.Apellido_P, m.Nombre_Ma;

-- 4.3 Apuntes por alumno y materia
SELECT
    p.Nombre_P || ' ' || p.Apellido_P AS Autor,
    m.Nombre_Ma AS Materia,
    ap.Nombre_Ap AS Apunte,
    ap.Estado_Ap AS Activo
FROM Apuntes ap
JOIN Alumnos a ON ap.Dni_A_Ap = a.Dni_P_A
JOIN Personas p ON a.Dni_P_A = p.Dni_P
JOIN Materias m ON ap.IdMateria_Ma_Ap = m.IdMateria_Ma
ORDER BY p.Apellido_P, m.Nombre_Ma;

-- 4.4 Solicitudes con nombres y estados
SELECT
    ps.Nombre_P || ' ' || ps.Apellido_P AS Solicitante,
    pt.Nombre_P || ' ' || pt.Apellido_P AS Tutor,
    m.Nombre_Ma AS Materia,
    s.Estado_So,
    s.FechaPedido_So,
    s.FechaRespuesta_So
FROM Solicitudes s
JOIN Personas ps ON s.DniSolicitante_A_So = ps.Dni_P
JOIN Personas pt ON s.DniTutor_A_So = pt.Dni_P
JOIN Materias m ON s.IdMateria_Ma_So = m.IdMateria_Ma
ORDER BY s.FechaPedido_So;

-- 4.5 Verificar bcrypt
SELECT 
    Dni_P, 
    CorreoInstitucional_P,
    LEFT(Contrasena_P, 4) AS prefijo_hash,
    LENGTH(Contrasena_P) AS largo_hash
FROM Personas;

--4.6 Test sobre persona prueba
SELECT 
    p.dni_p, 
    p.nombre_p, 
    p.apellido_p,
    p.telefono_p, 
    p.direccion_p, 
    p.estado_p,
    a.legajo_a,
    a.descripcion_a
FROM personas p
JOIN alumnos a ON p.dni_p = a.dni_p_a
WHERE p.dni_p = '33626855';

-- 4.7 Test siendo Admin (DNI de admin real cargado arriba)
SELECT dni_p, nombre_p, apellido_p, estado_p
FROM personas
WHERE dni_p = '10000001';

-- 4.8 Verificar carreras y materias cargadas
SELECT c.IdCarrera_Ca, c.Nombre_Ca, COUNT(m.IdMateria_Ma) AS CantidadMaterias
FROM Carreras c
LEFT JOIN Materias m ON m.IdCarrera_Ca_Ma = c.IdCarrera_Ca
GROUP BY c.IdCarrera_Ca, c.Nombre_Ca
ORDER BY c.IdCarrera_Ca;

-- 4.9 Cantidad de tutores por materia
SELECT
    m.IdMateria_Ma,
    m.Nombre_Ma,
    COUNT(*) AS CantidadTutores
FROM ALUMNOSxMATERIAS am
JOIN Materias m ON am.IdMateria_Ma_AxM = m.IdMateria_Ma
WHERE am.EsTutor_AxM = TRUE
GROUP BY m.IdMateria_Ma, m.Nombre_Ma
ORDER BY m.IdMateria_Ma;

-- 4.10 Control: la tabla Solicitudes debe estar vacía (esperado: 0)
SELECT COUNT(*) AS CantidadSolicitudes
FROM Solicitudes;
