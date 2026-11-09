-- =============================================================================
-- Migración 0009 · Catálogo de 22 áreas, temas, sinónimos, niveles de
-- conocimiento, objetivos, perfiles ampliados y privacidad por apartado.
-- Sustituye el catálogo plano de 18 intereses.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Catálogo: áreas → temas (→ etiquetas en publicaciones)
-- -----------------------------------------------------------------------------
create table public.interest_areas (
  slug        text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  name        text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 400),
  position    smallint not null default 0
);

create type public.topic_status as enum ('approved', 'pending', 'rejected');

create table public.topics (
  id          bigint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 60),
  name        text not null check (char_length(name) between 2 and 60),
  area_slug   text not null references public.interest_areas (slug) on delete cascade,
  status      public.topic_status not null default 'approved',
  proposed_by uuid references public.profiles (id) on delete set null,
  merged_into bigint references public.topics (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index topics_area_idx on public.topics (area_slug, name);
create index topics_name_trgm_idx on public.topics using gin (public.immutable_unaccent(lower(name)) extensions.gin_trgm_ops);

-- Temas que pertenecen también a otras áreas (p. ej. UAP en Cosmos y en Anomalías)
create table public.topic_areas (
  topic_id  bigint not null references public.topics (id) on delete cascade,
  area_slug text not null references public.interest_areas (slug) on delete cascade,
  primary key (topic_id, area_slug)
);

create table public.topic_synonyms (
  topic_id bigint not null references public.topics (id) on delete cascade,
  term     text not null check (char_length(term) between 2 and 60),
  primary key (topic_id, term)
);
create unique index topic_synonyms_term_idx on public.topic_synonyms (public.immutable_unaccent(lower(term)));

insert into public.interest_areas (slug, name, position) values
  ('cosmos', 'Cosmos y astronomía', 1),
  ('fisica', 'Física y ciencias fundamentales', 2),
  ('biologia', 'Biología y origen de la vida', 3),
  ('mente', 'Mente, conciencia y psicología', 4),
  ('filosofia', 'Filosofía y pensamiento', 5),
  ('historia', 'Historia y civilizaciones', 6),
  ('arqueologia', 'Arqueología y culturas antiguas', 7),
  ('anomalias', 'Fenómenos inexplicados y anomalías', 8),
  ('tradiciones', 'Espiritualidad y tradiciones ancestrales', 9),
  ('tecnologia', 'Tecnología e inteligencia artificial', 10),
  ('naturaleza', 'Naturaleza y medioambiente', 11),
  ('agricultura', 'Agricultura y autosuficiencia', 12),
  ('arquitectura', 'Arquitectura y construcción sostenible', 13),
  ('exploracion', 'Exploración y actividades al aire libre', 14),
  ('arte', 'Arte, diseño y expresión creativa', 15),
  ('sociedad', 'Sociedad, cultura y geopolítica', 16),
  ('ingenieria', 'Ingeniería, mecánica y oficios', 17),
  ('emprendimiento', 'Creatividad empresarial y proyectos independientes', 18),
  ('bienestar', 'Bienestar, deporte y desarrollo personal', 19),
  ('literatura', 'Literatura, aprendizaje y conocimiento', 20),
  ('relaciones', 'Relaciones humanas y comunidades', 21),
  ('agora', 'Ágora y temas abiertos', 22);

insert into public.topics (slug, name, area_slug) values
  ('astronomia', 'Astronomía', 'cosmos'),
  ('astrofisica', 'Astrofísica', 'cosmos'),
  ('cosmologia', 'Cosmología', 'cosmos'),
  ('agujeros-negros', 'Agujeros negros', 'cosmos'),
  ('estrellas', 'Estrellas', 'cosmos'),
  ('galaxias', 'Galaxias', 'cosmos'),
  ('exoplanetas', 'Exoplanetas', 'cosmos'),
  ('sistema-solar', 'Sistema solar', 'cosmos'),
  ('exploracion-espacial', 'Exploración espacial', 'cosmos'),
  ('astrobiologia', 'Astrobiología', 'cosmos'),
  ('materia-oscura', 'Materia oscura', 'cosmos'),
  ('energia-oscura', 'Energía oscura', 'cosmos'),
  ('origen-del-universo', 'Origen del universo', 'cosmos'),
  ('evolucion-estelar', 'Evolución estelar', 'cosmos'),
  ('meteoritos', 'Meteoritos', 'cosmos'),
  ('cometas', 'Cometas', 'cosmos'),
  ('vida-extraterrestre', 'Vida extraterrestre', 'cosmos'),
  ('uap', 'UAP', 'cosmos'),
  ('mecanica-celeste', 'Mecánica celeste', 'cosmos'),
  ('relatividad', 'Relatividad', 'cosmos'),
  ('modelos-cosmologicos', 'Modelos cosmológicos', 'cosmos'),
  ('fisica-cuantica', 'Física cuántica', 'fisica'),
  ('mecanica-cuantica', 'Mecánica cuántica', 'fisica'),
  ('fisica-teorica', 'Física teórica', 'fisica'),
  ('fisica-de-particulas', 'Física de partículas', 'fisica'),
  ('fisica-nuclear', 'Física nuclear', 'fisica'),
  ('relatividad-general', 'Relatividad general', 'fisica'),
  ('teoria-de-cuerdas', 'Teoría de cuerdas', 'fisica'),
  ('termodinamica', 'Termodinámica', 'fisica'),
  ('entropia', 'Entropía', 'fisica'),
  ('electromagnetismo', 'Electromagnetismo', 'fisica'),
  ('optica', 'Óptica', 'fisica'),
  ('mecanica-clasica', 'Mecánica clásica', 'fisica'),
  ('teoria-del-caos', 'Teoría del caos', 'fisica'),
  ('sistemas-complejos', 'Sistemas complejos', 'fisica'),
  ('matematicas', 'Matemáticas', 'fisica'),
  ('geometria', 'Geometría', 'fisica'),
  ('quimica', 'Química', 'fisica'),
  ('quimica-cuantica', 'Química cuántica', 'fisica'),
  ('bioquimica', 'Bioquímica', 'fisica'),
  ('nanociencia', 'Nanociencia', 'fisica'),
  ('biologia', 'Biología', 'biologia'),
  ('biologia-molecular', 'Biología molecular', 'biologia'),
  ('genetica', 'Genética', 'biologia'),
  ('evolucion', 'Evolución', 'biologia'),
  ('microbiologia', 'Microbiología', 'biologia'),
  ('neurobiologia', 'Neurobiología', 'biologia'),
  ('biotecnologia', 'Biotecnología', 'biologia'),
  ('biologia-sintetica', 'Biología sintética', 'biologia'),
  ('origen-de-la-vida', 'Origen de la vida', 'biologia'),
  ('evolucion-humana', 'Evolución humana', 'biologia'),
  ('paleontologia', 'Paleontología', 'biologia'),
  ('anatomia', 'Anatomía', 'biologia'),
  ('ecologia-evolutiva', 'Ecología evolutiva', 'biologia'),
  ('inmunologia', 'Inmunología', 'biologia'),
  ('epigenetica', 'Epigenética', 'biologia'),
  ('biologia-marina', 'Biología marina', 'biologia'),
  ('biodiversidad', 'Biodiversidad', 'biologia'),
  ('comportamiento-animal', 'Comportamiento animal', 'biologia'),
  ('conciencia', 'Conciencia', 'mente'),
  ('filosofia-de-la-mente', 'Filosofía de la mente', 'mente'),
  ('psicologia', 'Psicología', 'mente'),
  ('neurociencia-cognitiva', 'Neurociencia cognitiva', 'mente'),
  ('percepcion', 'Percepción', 'mente'),
  ('memoria', 'Memoria', 'mente'),
  ('suenos', 'Sueños', 'mente'),
  ('suenos-lucidos', 'Sueños lúcidos', 'mente'),
  ('subconsciente', 'Subconsciente', 'mente'),
  ('cognicion', 'Cognición', 'mente'),
  ('inteligencia', 'Inteligencia', 'mente'),
  ('psicologia-evolutiva', 'Psicología evolutiva', 'mente'),
  ('psicologia-social', 'Psicología social', 'mente'),
  ('identidad', 'Identidad', 'mente'),
  ('libre-albedrio', 'Libre albedrío', 'mente'),
  ('estados-alterados-de-conciencia', 'Estados alterados de conciencia', 'mente'),
  ('experiencias-cercanas-a-la-muerte', 'Experiencias cercanas a la muerte', 'mente'),
  ('neuroplasticidad', 'Neuroplasticidad', 'mente'),
  ('comportamiento-humano', 'Comportamiento humano', 'mente'),
  ('metafisica', 'Metafísica', 'filosofia'),
  ('epistemologia', 'Epistemología', 'filosofia'),
  ('existencialismo', 'Existencialismo', 'filosofia'),
  ('filosofia-antigua', 'Filosofía antigua', 'filosofia'),
  ('filosofia-moderna', 'Filosofía moderna', 'filosofia'),
  ('filosofia-oriental', 'Filosofía oriental', 'filosofia'),
  ('estoicismo', 'Estoicismo', 'filosofia'),
  ('filosofia-de-la-ciencia', 'Filosofía de la ciencia', 'filosofia'),
  ('etica', 'Ética', 'filosofia'),
  ('logica', 'Lógica', 'filosofia'),
  ('ontologia', 'Ontología', 'filosofia'),
  ('filosofia-politica', 'Filosofía política', 'filosofia'),
  ('filosofia-de-la-tecnologia', 'Filosofía de la tecnología', 'filosofia'),
  ('pensamiento-critico', 'Pensamiento crítico', 'filosofia'),
  ('escepticismo-filosofico', 'Escepticismo filosófico', 'filosofia'),
  ('teoria-del-conocimiento', 'Teoría del conocimiento', 'filosofia'),
  ('determinismo', 'Determinismo', 'filosofia'),
  ('nihilismo', 'Nihilismo', 'filosofia'),
  ('humanismo', 'Humanismo', 'filosofia'),
  ('civilizaciones-antiguas', 'Civilizaciones antiguas', 'historia'),
  ('egipto', 'Egipto', 'historia'),
  ('mesopotamia', 'Mesopotamia', 'historia'),
  ('sumeria', 'Sumeria', 'historia'),
  ('babilonia', 'Babilonia', 'historia'),
  ('grecia-antigua', 'Grecia antigua', 'historia'),
  ('roma', 'Roma', 'historia'),
  ('mayas', 'Mayas', 'historia'),
  ('aztecas', 'Aztecas', 'historia'),
  ('incas', 'Incas', 'historia'),
  ('rapa-nui', 'Rapa Nui', 'historia'),
  ('civilizacion-del-indo', 'Civilización del Indo', 'historia'),
  ('prehistoria', 'Prehistoria', 'historia'),
  ('historia-medieval', 'Historia medieval', 'historia'),
  ('historia-moderna', 'Historia moderna', 'historia'),
  ('historia-contemporanea', 'Historia contemporánea', 'historia'),
  ('mitologia', 'Mitología', 'historia'),
  ('historia-militar', 'Historia militar', 'historia'),
  ('historia-de-la-ciencia', 'Historia de la ciencia', 'historia'),
  ('religiones', 'Religiones', 'historia'),
  ('escrituras-antiguas', 'Escrituras antiguas', 'historia'),
  ('lenguas-desaparecidas', 'Lenguas desaparecidas', 'historia'),
  ('arqueologia', 'Arqueología', 'arqueologia'),
  ('arqueologia-subacuatica', 'Arqueología subacuática', 'arqueologia'),
  ('arqueologia-experimental', 'Arqueología experimental', 'arqueologia'),
  ('megalitismo', 'Megalitismo', 'arqueologia'),
  ('egiptologia', 'Egiptología', 'arqueologia'),
  ('asiriologia', 'Asiriología', 'arqueologia'),
  ('paleoantropologia', 'Paleoantropología', 'arqueologia'),
  ('antropologia-cultural', 'Antropología cultural', 'arqueologia'),
  ('arte-rupestre', 'Arte rupestre', 'arqueologia'),
  ('petroglifos', 'Petroglifos', 'arqueologia'),
  ('monumentos-antiguos', 'Monumentos antiguos', 'arqueologia'),
  ('arquitectura-ancestral', 'Arquitectura ancestral', 'arqueologia'),
  ('artefactos-arqueologicos', 'Artefactos arqueológicos', 'arqueologia'),
  ('ciudades-desaparecidas', 'Ciudades desaparecidas', 'arqueologia'),
  ('culturas-precolombinas', 'Culturas precolombinas', 'arqueologia'),
  ('tecnicas-constructivas-antiguas', 'Técnicas constructivas antiguas', 'arqueologia'),
  ('escrituras', 'Escrituras', 'arqueologia'),
  ('patrimonio-historico', 'Patrimonio histórico', 'arqueologia'),
  ('ovni', 'OVNI', 'anomalias'),
  ('avistamientos', 'Avistamientos', 'anomalias'),
  ('fenomenos-aereos-anomalos', 'Fenómenos aéreos anómalos', 'anomalias'),
  ('casos-historicos-sin-resolver', 'Casos históricos sin resolver', 'anomalias'),
  ('fenomenos-paranormales', 'Fenómenos paranormales', 'anomalias'),
  ('criptozoologia', 'Criptozoología', 'anomalias'),
  ('anomalias-arqueologicas', 'Anomalías arqueológicas', 'anomalias'),
  ('desapariciones-misteriosas', 'Desapariciones misteriosas', 'anomalias'),
  ('fenomenos-atmosfericos-inusuales', 'Fenómenos atmosféricos inusuales', 'anomalias'),
  ('experiencias-anomalas', 'Experiencias anómalas', 'anomalias'),
  ('documentacion-desclasificada', 'Documentación desclasificada', 'anomalias'),
  ('paradojas', 'Paradojas', 'anomalias'),
  ('enigmas-historicos', 'Enigmas históricos', 'anomalias'),
  ('misterios-oceanicos', 'Misterios oceánicos', 'anomalias'),
  ('testimonios', 'Testimonios', 'anomalias'),
  ('espiritualidad', 'Espiritualidad', 'tradiciones'),
  ('tradiciones-ancestrales', 'Tradiciones ancestrales', 'tradiciones'),
  ('chamanismo', 'Chamanismo', 'tradiciones'),
  ('hermetismo', 'Hermetismo', 'tradiciones'),
  ('alquimia-historica', 'Alquimia histórica', 'tradiciones'),
  ('misticismo', 'Misticismo', 'tradiciones'),
  ('budismo', 'Budismo', 'tradiciones'),
  ('taoismo', 'Taoísmo', 'tradiciones'),
  ('hinduismo', 'Hinduismo', 'tradiciones'),
  ('tradiciones-indigenas', 'Tradiciones indígenas', 'tradiciones'),
  ('mitologia-comparada', 'Mitología comparada', 'tradiciones'),
  ('historia-de-las-religiones', 'Historia de las religiones', 'tradiciones'),
  ('simbolismo-espiritual', 'Simbolismo espiritual', 'tradiciones'),
  ('geometria-sagrada', 'Geometría sagrada', 'tradiciones'),
  ('arquetipos', 'Arquetipos', 'tradiciones'),
  ('textos-sagrados', 'Textos sagrados', 'tradiciones'),
  ('meditacion-contemplativa', 'Meditación contemplativa', 'tradiciones'),
  ('cosmologias-tradicionales', 'Cosmologías tradicionales', 'tradiciones'),
  ('inteligencia-artificial', 'Inteligencia artificial', 'tecnologia'),
  ('ia-generativa', 'IA generativa', 'tecnologia'),
  ('aprendizaje-automatico', 'Aprendizaje automático', 'tecnologia'),
  ('robotica', 'Robótica', 'tecnologia'),
  ('automatizacion', 'Automatización', 'tecnologia'),
  ('programacion', 'Programación', 'tecnologia'),
  ('desarrollo-de-software', 'Desarrollo de software', 'tecnologia'),
  ('desarrollo-web', 'Desarrollo web', 'tecnologia'),
  ('ciberseguridad', 'Ciberseguridad', 'tecnologia'),
  ('computacion-cuantica', 'Computación cuántica', 'tecnologia'),
  ('blockchain', 'Blockchain', 'tecnologia'),
  ('realidad-virtual', 'Realidad virtual', 'tecnologia'),
  ('realidad-aumentada', 'Realidad aumentada', 'tecnologia'),
  ('impresion-3d', 'Impresión 3D', 'tecnologia'),
  ('interfaces-cerebro-maquina', 'Interfaces cerebro-máquina', 'tecnologia'),
  ('transhumanismo', 'Transhumanismo', 'tecnologia'),
  ('ingenieria-de-datos', 'Ingeniería de datos', 'tecnologia'),
  ('hardware', 'Hardware', 'tecnologia'),
  ('software-libre', 'Software libre', 'tecnologia'),
  ('etica-tecnologica', 'Ética tecnológica', 'tecnologia'),
  ('tecnologias-emergentes', 'Tecnologías emergentes', 'tecnologia'),
  ('ecologia', 'Ecología', 'naturaleza'),
  ('conservacion', 'Conservación', 'naturaleza'),
  ('botanica', 'Botánica', 'naturaleza'),
  ('micologia', 'Micología', 'naturaleza'),
  ('zoologia', 'Zoología', 'naturaleza'),
  ('etologia', 'Etología', 'naturaleza'),
  ('fauna-salvaje', 'Fauna salvaje', 'naturaleza'),
  ('flora', 'Flora', 'naturaleza'),
  ('geologia', 'Geología', 'naturaleza'),
  ('oceanografia', 'Oceanografía', 'naturaleza'),
  ('bosques', 'Bosques', 'naturaleza'),
  ('ecosistemas', 'Ecosistemas', 'naturaleza'),
  ('reforestacion', 'Reforestación', 'naturaleza'),
  ('cambio-climatico', 'Cambio climático', 'naturaleza'),
  ('proteccion-animal', 'Protección animal', 'naturaleza'),
  ('observacion-de-aves', 'Observación de aves', 'naturaleza'),
  ('fotografia-de-naturaleza', 'Fotografía de naturaleza', 'naturaleza'),
  ('geografia-fisica', 'Geografía física', 'naturaleza'),
  ('restauracion-ecologica', 'Restauración ecológica', 'naturaleza'),
  ('permacultura', 'Permacultura', 'agricultura'),
  ('agricultura-ecologica', 'Agricultura ecológica', 'agricultura'),
  ('agroecologia', 'Agroecología', 'agricultura'),
  ('huertos', 'Huertos', 'agricultura'),
  ('horticultura', 'Horticultura', 'agricultura'),
  ('fruticultura', 'Fruticultura', 'agricultura'),
  ('ganaderia', 'Ganadería', 'agricultura'),
  ('apicultura', 'Apicultura', 'agricultura'),
  ('avicultura', 'Avicultura', 'agricultura'),
  ('silvicultura', 'Silvicultura', 'agricultura'),
  ('agroforesteria', 'Agroforestería', 'agricultura'),
  ('compostaje', 'Compostaje', 'agricultura'),
  ('conservacion-de-semillas', 'Conservación de semillas', 'agricultura'),
  ('soberania-alimentaria', 'Soberanía alimentaria', 'agricultura'),
  ('produccion-artesanal', 'Producción artesanal', 'agricultura'),
  ('elaboracion-de-queso', 'Elaboración de queso', 'agricultura'),
  ('fermentacion', 'Fermentación', 'agricultura'),
  ('conservas', 'Conservas', 'agricultura'),
  ('gestion-del-agua', 'Gestión del agua', 'agricultura'),
  ('captacion-de-lluvia', 'Captación de lluvia', 'agricultura'),
  ('autosuficiencia-alimentaria', 'Autosuficiencia alimentaria', 'agricultura'),
  ('vida-off-grid', 'Vida off-grid', 'agricultura'),
  ('recursos-rurales', 'Recursos rurales', 'agricultura'),
  ('arquitectura', 'Arquitectura', 'arquitectura'),
  ('bioconstruccion', 'Bioconstrucción', 'arquitectura'),
  ('arquitectura-bioclimatica', 'Arquitectura bioclimática', 'arquitectura'),
  ('construccion-con-tierra', 'Construcción con tierra', 'arquitectura'),
  ('construccion-con-piedra', 'Construcción con piedra', 'arquitectura'),
  ('construccion-con-madera', 'Construcción con madera', 'arquitectura'),
  ('casas-naturales', 'Casas naturales', 'arquitectura'),
  ('arquitectura-vernacula', 'Arquitectura vernácula', 'arquitectura'),
  ('rehabilitacion-rural', 'Rehabilitación rural', 'arquitectura'),
  ('diseno-sostenible', 'Diseño sostenible', 'arquitectura'),
  ('eficiencia-energetica', 'Eficiencia energética', 'arquitectura'),
  ('energia-solar', 'Energía solar', 'arquitectura'),
  ('energia-eolica', 'Energía eólica', 'arquitectura'),
  ('almacenamiento-energetico', 'Almacenamiento energético', 'arquitectura'),
  ('aislamiento-natural', 'Aislamiento natural', 'arquitectura'),
  ('captacion-de-agua', 'Captación de agua', 'arquitectura'),
  ('saneamiento-ecologico', 'Saneamiento ecológico', 'arquitectura'),
  ('vivienda-autosuficiente', 'Vivienda autosuficiente', 'arquitectura'),
  ('urbanismo-sostenible', 'Urbanismo sostenible', 'arquitectura'),
  ('exploracion', 'Exploración', 'exploracion'),
  ('senderismo', 'Senderismo', 'exploracion'),
  ('montanismo', 'Montañismo', 'exploracion'),
  ('escalada', 'Escalada', 'exploracion'),
  ('espeleologia', 'Espeleología', 'exploracion'),
  ('bushcraft', 'Bushcraft', 'exploracion'),
  ('supervivencia', 'Supervivencia', 'exploracion'),
  ('orientacion', 'Orientación', 'exploracion'),
  ('cartografia', 'Cartografía', 'exploracion'),
  ('navegacion', 'Navegación', 'exploracion'),
  ('acampada', 'Acampada', 'exploracion'),
  ('vivac', 'Vivac', 'exploracion'),
  ('expediciones', 'Expediciones', 'exploracion'),
  ('trekking', 'Trekking', 'exploracion'),
  ('fotografia-de-aventura', 'Fotografía de aventura', 'exploracion'),
  ('rastreo-animal', 'Rastreo animal', 'exploracion'),
  ('observacion-astronomica', 'Observación astronómica', 'exploracion'),
  ('meteorologia', 'Meteorología', 'exploracion'),
  ('geocaching', 'Geocaching', 'exploracion'),
  ('viajes-de-naturaleza', 'Viajes de naturaleza', 'exploracion'),
  ('arte-contemporaneo', 'Arte contemporáneo', 'arte'),
  ('pintura', 'Pintura', 'arte'),
  ('dibujo', 'Dibujo', 'arte'),
  ('ilustracion', 'Ilustración', 'arte'),
  ('escultura', 'Escultura', 'arte'),
  ('fotografia', 'Fotografía', 'arte'),
  ('cine', 'Cine', 'arte'),
  ('documentales', 'Documentales', 'arte'),
  ('diseno-grafico', 'Diseño gráfico', 'arte'),
  ('diseno-industrial', 'Diseño industrial', 'arte'),
  ('diseno-de-moda', 'Diseño de moda', 'arte'),
  ('arte-digital', 'Arte digital', 'arte'),
  ('modelado-3d', 'Modelado 3D', 'arte'),
  ('animacion', 'Animación', 'arte'),
  ('surrealismo', 'Surrealismo', 'arte'),
  ('collage', 'Collage', 'arte'),
  ('fotomontaje', 'Fotomontaje', 'arte'),
  ('tipografia', 'Tipografía', 'arte'),
  ('musica', 'Música', 'arte'),
  ('produccion-musical', 'Producción musical', 'arte'),
  ('composicion', 'Composición', 'arte'),
  ('escritura-creativa', 'Escritura creativa', 'arte'),
  ('poesia', 'Poesía', 'arte'),
  ('artesania', 'Artesanía', 'arte'),
  ('sociologia', 'Sociología', 'sociedad'),
  ('antropologia-social', 'Antropología social', 'sociedad'),
  ('geopolitica', 'Geopolítica', 'sociedad'),
  ('relaciones-internacionales', 'Relaciones internacionales', 'sociedad'),
  ('economia', 'Economía', 'sociedad'),
  ('demografia', 'Demografía', 'sociedad'),
  ('globalizacion', 'Globalización', 'sociedad'),
  ('historia-politica', 'Historia política', 'sociedad'),
  ('sistemas-sociales', 'Sistemas sociales', 'sociedad'),
  ('cultura', 'Cultura', 'sociedad'),
  ('educacion', 'Educación', 'sociedad'),
  ('comunicacion', 'Comunicación', 'sociedad'),
  ('medios-de-comunicacion', 'Medios de comunicación', 'sociedad'),
  ('propaganda', 'Propaganda', 'sociedad'),
  ('desinformacion', 'Desinformación', 'sociedad'),
  ('alfabetizacion-mediatica', 'Alfabetización mediática', 'sociedad'),
  ('comportamiento-colectivo', 'Comportamiento colectivo', 'sociedad'),
  ('movimientos-sociales', 'Movimientos sociales', 'sociedad'),
  ('cooperativismo', 'Cooperativismo', 'sociedad'),
  ('organizacion-comunitaria', 'Organización comunitaria', 'sociedad'),
  ('modelos-economicos', 'Modelos económicos', 'sociedad'),
  ('ingenieria-mecanica', 'Ingeniería mecánica', 'ingenieria'),
  ('ingenieria-electrica', 'Ingeniería eléctrica', 'ingenieria'),
  ('ingenieria-civil', 'Ingeniería civil', 'ingenieria'),
  ('mecanica-industrial', 'Mecánica industrial', 'ingenieria'),
  ('automocion', 'Automoción', 'ingenieria'),
  ('electronica', 'Electrónica', 'ingenieria'),
  ('electricidad', 'Electricidad', 'ingenieria'),
  ('metalurgia', 'Metalurgia', 'ingenieria'),
  ('soldadura', 'Soldadura', 'ingenieria'),
  ('carpinteria', 'Carpintería', 'ingenieria'),
  ('fontaneria', 'Fontanería', 'ingenieria'),
  ('construccion', 'Construcción', 'ingenieria'),
  ('mantenimiento-industrial', 'Mantenimiento industrial', 'ingenieria'),
  ('robotica-industrial', 'Robótica industrial', 'ingenieria'),
  ('fabricacion-digital', 'Fabricación digital', 'ingenieria'),
  ('diseno-mecanico', 'Diseño mecánico', 'ingenieria'),
  ('prototipado', 'Prototipado', 'ingenieria'),
  ('bricolaje', 'Bricolaje', 'ingenieria'),
  ('restauracion-de-vehiculos', 'Restauración de vehículos', 'ingenieria'),
  ('oficios-tradicionales', 'Oficios tradicionales', 'ingenieria'),
  ('maquinaria', 'Maquinaria', 'ingenieria'),
  ('emprendimiento', 'Emprendimiento', 'emprendimiento'),
  ('startups', 'Startups', 'emprendimiento'),
  ('negocios-digitales', 'Negocios digitales', 'emprendimiento'),
  ('comercio-electronico', 'Comercio electrónico', 'emprendimiento'),
  ('marcas-independientes', 'Marcas independientes', 'emprendimiento'),
  ('diseno-de-producto', 'Diseño de producto', 'emprendimiento'),
  ('marketing', 'Marketing', 'emprendimiento'),
  ('comunicacion-de-marca', 'Comunicación de marca', 'emprendimiento'),
  ('finanzas-personales', 'Finanzas personales', 'emprendimiento'),
  ('inversion', 'Inversión', 'emprendimiento'),
  ('gestion-empresarial', 'Gestión empresarial', 'emprendimiento'),
  ('gestion-de-proyectos', 'Gestión de proyectos', 'emprendimiento'),
  ('economia-circular', 'Economía circular', 'emprendimiento'),
  ('economia-colaborativa', 'Economía colaborativa', 'emprendimiento'),
  ('cooperativas', 'Cooperativas', 'emprendimiento'),
  ('innovacion-social', 'Innovación social', 'emprendimiento'),
  ('trabajo-independiente', 'Trabajo independiente', 'emprendimiento'),
  ('investigacion-de-mercado', 'Investigación de mercado', 'emprendimiento'),
  ('desarrollo-profesional', 'Desarrollo profesional', 'emprendimiento'),
  ('proyectos-colectivos', 'Proyectos colectivos', 'emprendimiento'),
  ('nutricion', 'Nutrición', 'bienestar'),
  ('cocina', 'Cocina', 'bienestar'),
  ('entrenamiento-de-fuerza', 'Entrenamiento de fuerza', 'bienestar'),
  ('hipertrofia', 'Hipertrofia', 'bienestar'),
  ('calistenia', 'Calistenia', 'bienestar'),
  ('artes-marciales', 'Artes marciales', 'bienestar'),
  ('movilidad', 'Movilidad', 'bienestar'),
  ('yoga', 'Yoga', 'bienestar'),
  ('respiracion', 'Respiración', 'bienestar'),
  ('sueno-y-descanso', 'Sueño y descanso', 'bienestar'),
  ('psicologia-del-deporte', 'Psicología del deporte', 'bienestar'),
  ('ciclismo', 'Ciclismo', 'bienestar'),
  ('atletismo', 'Atletismo', 'bienestar'),
  ('deportes-de-montana', 'Deportes de montaña', 'bienestar'),
  ('salud-preventiva', 'Salud preventiva', 'bienestar'),
  ('ergonomia', 'Ergonomía', 'bienestar'),
  ('habitos-saludables', 'Hábitos saludables', 'bienestar'),
  ('desarrollo-personal', 'Desarrollo personal', 'bienestar'),
  ('gestion-del-tiempo', 'Gestión del tiempo', 'bienestar'),
  ('disciplina', 'Disciplina', 'bienestar'),
  ('literatura', 'Literatura', 'literatura'),
  ('ensayo', 'Ensayo', 'literatura'),
  ('divulgacion-cientifica', 'Divulgación científica', 'literatura'),
  ('ciencia-ficcion', 'Ciencia ficción', 'literatura'),
  ('novela-historica', 'Novela histórica', 'literatura'),
  ('filosofia-clasica', 'Filosofía clásica', 'literatura'),
  ('historia-de-las-ideas', 'Historia de las ideas', 'literatura'),
  ('investigacion-independiente', 'Investigación independiente', 'literatura'),
  ('aprendizaje-autodidacta', 'Aprendizaje autodidacta', 'literatura'),
  ('educacion-alternativa', 'Educación alternativa', 'literatura'),
  ('linguistica', 'Lingüística', 'literatura'),
  ('idiomas', 'Idiomas', 'literatura'),
  ('retorica', 'Retórica', 'literatura'),
  ('bibliotecas', 'Bibliotecas', 'literatura'),
  ('archivos-historicos', 'Archivos históricos', 'literatura'),
  ('lectura-critica', 'Lectura crítica', 'literatura'),
  ('escritura', 'Escritura', 'literatura'),
  ('publicacion-independiente', 'Publicación independiente', 'literatura'),
  ('formacion-interdisciplinar', 'Formación interdisciplinar', 'literatura'),
  ('amistad', 'Amistad', 'relaciones'),
  ('relaciones-humanas', 'Relaciones humanas', 'relaciones'),
  ('comunicacion-interpersonal', 'Comunicación interpersonal', 'relaciones'),
  ('empatia', 'Empatía', 'relaciones'),
  ('convivencia', 'Convivencia', 'relaciones'),
  ('trabajo-en-equipo', 'Trabajo en equipo', 'relaciones'),
  ('colaboracion', 'Colaboración', 'relaciones'),
  ('voluntariado', 'Voluntariado', 'relaciones'),
  ('mentoria', 'Mentoría', 'relaciones'),
  ('aprendizaje-colectivo', 'Aprendizaje colectivo', 'relaciones'),
  ('intercambio-de-conocimientos', 'Intercambio de conocimientos', 'relaciones'),
  ('resolucion-de-conflictos', 'Resolución de conflictos', 'relaciones'),
  ('comunidades-locales', 'Comunidades locales', 'relaciones'),
  ('encuentros-presenciales', 'Encuentros presenciales', 'relaciones'),
  ('redes-de-apoyo', 'Redes de apoyo', 'relaciones'),
  ('cooperacion-vecinal', 'Cooperación vecinal', 'relaciones'),
  ('cultura-participativa', 'Cultura participativa', 'relaciones'),
  ('conversaciones-libres', 'Conversaciones libres', 'agora'),
  ('reflexiones-personales', 'Reflexiones personales', 'agora'),
  ('preguntas-abiertas', 'Preguntas abiertas', 'agora'),
  ('experiencias', 'Experiencias', 'agora'),
  ('observaciones', 'Observaciones', 'agora'),
  ('descubrimientos', 'Descubrimientos', 'agora'),
  ('debates', 'Debates', 'agora'),
  ('actualidad', 'Actualidad', 'agora'),
  ('recomendaciones', 'Recomendaciones', 'agora'),
  ('historias-personales', 'Historias personales', 'agora'),
  ('ideas-espontaneas', 'Ideas espontáneas', 'agora'),
  ('encuestas', 'Encuestas', 'agora'),
  ('propuestas', 'Propuestas', 'agora'),
  ('temas-cotidianos', 'Temas cotidianos', 'agora'),
  ('intereses-no-catalogados', 'Intereses no catalogados', 'agora');

insert into public.topic_areas (topic_id, area_slug)
select t.id, v.area from (values
  ('astrobiologia', 'biologia'),
  ('uap', 'anomalias'),
  ('biologia-marina', 'naturaleza'),
  ('biodiversidad', 'naturaleza'),
  ('psicologia-social', 'relaciones'),
  ('logica', 'literatura'),
  ('automatizacion', 'ingenieria'),
  ('arquitectura', 'arte')
) as v(slug, area) join public.topics t on t.slug = v.slug;

insert into public.topic_synonyms (topic_id, term)
select t.id, v.term from (values
  ('uap', 'fenómenos aéreos no identificados'),
  ('inteligencia-artificial', 'ia'),
  ('inteligencia-artificial', 'ai'),
  ('aprendizaje-automatico', 'machine learning'),
  ('aprendizaje-automatico', 'ml'),
  ('fisica-cuantica', 'cuántica'),
  ('fisica-cuantica', 'quantum'),
  ('permacultura', 'permacultura doméstica'),
  ('bioconstruccion', 'construcción natural'),
  ('bioconstruccion', 'bio construcción'),
  ('vida-off-grid', 'off grid'),
  ('vida-off-grid', 'vida fuera de la red'),
  ('huertos', 'huerto'),
  ('huertos', 'huerta'),
  ('energia-solar', 'fotovoltaica'),
  ('energia-solar', 'placas solares'),
  ('realidad-virtual', 'vr'),
  ('realidad-aumentada', 'ar'),
  ('impresion-3d', '3d printing'),
  ('blockchain', 'cadena de bloques'),
  ('egiptologia', 'antiguo egipto'),
  ('suenos-lucidos', 'sueño lúcido'),
  ('meditacion-contemplativa', 'meditación'),
  ('meditacion-contemplativa', 'mindfulness'),
  ('astronomia', 'astro'),
  ('programacion', 'código'),
  ('programacion', 'coding'),
  ('desarrollo-web', 'web'),
  ('ciberseguridad', 'seguridad informática')
) as v(slug, term) join public.topics t on t.slug = v.slug;

update public.interest_areas set description = d.description from (values
  ('cosmos', 'Del sistema solar a los modelos cosmológicos.'),
  ('fisica', 'Las leyes de la materia, la energía y las matemáticas.'),
  ('biologia', 'La vida: de las moléculas a los ecosistemas.'),
  ('mente', 'Percepción, conciencia y comportamiento humano.'),
  ('filosofia', 'Preguntas fundamentales y pensamiento crítico.'),
  ('historia', 'Civilizaciones, épocas y fuentes.'),
  ('arqueologia', 'Lo que dejaron las culturas antiguas.'),
  ('anomalias', 'Lo inexplicado, estudiado con método.'),
  ('tradiciones', 'Espiritualidad, símbolos y cosmologías.'),
  ('tecnologia', 'IA, software, hardware y su ética.'),
  ('naturaleza', 'Ecología, especies y paisajes.'),
  ('agricultura', 'Producir alimento y vivir con autonomía.'),
  ('arquitectura', 'Construir de forma sana y sostenible.'),
  ('exploracion', 'Montaña, rutas, cielo y aventura.'),
  ('arte', 'Crear con imagen, sonido y palabra.'),
  ('sociedad', 'Cómo nos organizamos y nos contamos.'),
  ('ingenieria', 'Máquinas, materiales y oficios.'),
  ('emprendimiento', 'Iniciativas, marcas y proyectos propios.'),
  ('bienestar', 'Cuerpo, hábitos y desarrollo personal.'),
  ('literatura', 'Leer, escribir y aprender por cuenta propia.'),
  ('relaciones', 'Personas, comunidades y cooperación.'),
  ('agora', 'Todo lo que no cabe en otra parte.')
) as d(slug, description) where interest_areas.slug = d.slug;

-- -----------------------------------------------------------------------------
-- Relación de cada persona con cada tema y objetivos
-- -----------------------------------------------------------------------------
create type public.topic_relation as enum (
  'interested', 'learning', 'knowledgeable', 'experienced', 'can_teach', 'seeking_collaborators'
);

create table public.profile_topics (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  topic_id   bigint not null references public.topics (id) on delete cascade,
  relation   public.topic_relation not null default 'interested',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (profile_id, topic_id)
);
create index profile_topics_topic_idx on public.profile_topics (topic_id, relation);

create type public.user_goal as enum (
  'learn', 'research', 'debate', 'share', 'meet_people', 'friendship', 'find_collaborators',
  'join_projects', 'create_circles', 'join_communities', 'organize_meetups', 'share_experiences'
);

create table public.profile_goals (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  goal       public.user_goal not null,
  primary key (profile_id, goal)
);

-- -----------------------------------------------------------------------------
-- Perfil ampliado
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column cover_path   text check (cover_path is null or cover_path ~ '^[0-9a-f-]{36}/[\w.-]+$'),
  add column exploring    text not null default '' check (char_length(exploring) <= 600),
  add column can_offer    text not null default '' check (char_length(can_offer) <= 600),
  add column skills       text[] not null default '{}' check (cardinality(skills) <= 30),
  add column last_seen_at timestamptz;
-- La portada solo puede ser un archivo de la carpeta propia (bucket «covers»).
alter table public.profiles add constraint profiles_cover_owner
  check (cover_path is null or split_part(cover_path, '/', 1) = id::text);

-- -----------------------------------------------------------------------------
-- Privacidad por apartado y ajustes personales
-- «public» = cualquier miembro registrado (la plataforma es solo para miembros)
-- -----------------------------------------------------------------------------
create type public.visibility as enum ('public', 'connections', 'private');

create table public.profile_privacy (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  location   public.visibility not null default 'public',
  about      public.visibility not null default 'public',
  interests  public.visibility not null default 'public',
  activity   public.visibility not null default 'public',
  network    public.visibility not null default 'public',
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  profile_id      uuid primary key references public.profiles (id) on delete cascade,
  who_can_message text not null default 'everyone' check (who_can_message in ('everyone', 'connections')),
  read_receipts   boolean not null default true,
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Migración de datos del catálogo anterior
-- -----------------------------------------------------------------------------
insert into public.profile_topics (profile_id, topic_id, is_primary)
select pi.profile_id, t.id, pi.is_favorite
from public.profile_interests pi
join (values
  ('fisica-cuantica', 'fisica-cuantica'), ('astronomia', 'astronomia'), ('conciencia', 'conciencia'),
  ('civilizaciones', 'civilizaciones-antiguas'), ('historia', 'arqueologia'), ('sociedades-discretas', 'simbolismo-espiritual'),
  ('misterios', 'enigmas-historicos'), ('uap', 'uap'), ('ia-tecnologia', 'inteligencia-artificial'),
  ('autosuficiencia', 'vida-off-grid'), ('bioconstruccion', 'bioconstruccion'), ('agricultura', 'agricultura-ecologica'),
  ('energias-alternativas', 'energia-solar'), ('vida-rural', 'recursos-rurales'), ('psicologia', 'psicologia'),
  ('debate', 'debates'), ('proyectos', 'proyectos-colectivos'), ('amistad', 'amistad')
) as m(old_slug, topic_slug) on m.old_slug = pi.interest_slug
join public.topics t on t.slug = m.topic_slug
on conflict do nothing;

-- Proyectos: categoría (área) y temas
alter table public.projects add column area_slug text references public.interest_areas (slug) on delete set null;
create type public.project_topic_kind as enum ('theme', 'skill');
create table public.project_topics (
  project_id uuid not null references public.projects (id) on delete cascade,
  topic_id   bigint not null references public.topics (id) on delete cascade,
  kind       public.project_topic_kind not null default 'theme',
  primary key (project_id, topic_id, kind)
);
insert into public.project_topics (project_id, topic_id)
select p.id, t.id
from public.projects p
cross join lateral unnest(p.interests) as old_slug
join (values
  ('fisica-cuantica', 'fisica-cuantica'), ('astronomia', 'astronomia'), ('conciencia', 'conciencia'),
  ('civilizaciones', 'civilizaciones-antiguas'), ('historia', 'arqueologia'), ('agricultura', 'agricultura-ecologica'),
  ('bioconstruccion', 'bioconstruccion'), ('autosuficiencia', 'vida-off-grid'), ('energias-alternativas', 'energia-solar'),
  ('vida-rural', 'recursos-rurales'), ('ia-tecnologia', 'inteligencia-artificial'), ('proyectos', 'proyectos-colectivos')
) as m(o, n) on m.o = old_slug
join public.topics t on t.slug = m.n
on conflict do nothing;
update public.projects p set area_slug = (
  select t.area_slug from public.project_topics pt join public.topics t on t.id = pt.topic_id where pt.project_id = p.id limit 1
);
alter table public.projects drop column interests;

drop function public.set_my_interests(text[], text[]);
drop function public.search_members(text, text[], text, text, public.chat_availability, boolean, integer, integer);
drop function public.discover_members(integer);
drop function public.member_card_for(uuid);
drop function public.member_countries();
drop function public.create_project(text, text, text, text[], text, public.project_status, text, text, text[], text);
drop type public.member_card;
drop table public.profile_interests;
drop function public.limit_profile_interests();
drop table public.interests;

-- -----------------------------------------------------------------------------
-- Privacidad: columnas personales solo a través de funciones
-- -----------------------------------------------------------------------------
revoke select on public.profiles from authenticated;
grant select (id, username, display_name, avatar_url, cover_path, languages, availability, role, status,
  onboarded_at, created_at, updated_at) on public.profiles to authenticated;
grant update (cover_path, exploring, can_offer, skills) on public.profiles to authenticated;

-- ¿Puede quien consulta ver un apartado del perfil de otra persona?
create or replace function public.profile_section_visible(p_owner uuid, p_section text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  vis public.visibility;
begin
  if auth.uid() = p_owner or public.is_staff() then
    return true;
  end if;
  if not public.is_active_member() then
    return false;
  end if;
  select case p_section
      when 'location' then pp.location
      when 'about' then pp.about
      when 'interests' then pp.interests
      when 'activity' then pp.activity
      when 'network' then pp.network
    end
  into vis
  from public.profile_privacy pp where pp.profile_id = p_owner;
  vis := coalesce(vis, 'public');
  return vis = 'public' or (vis = 'connections' and public.is_connected_with(p_owner));
end;
$$;

-- Perfil completo propio (incluye los campos personales)
create or replace function public.my_profile()
returns setof public.profiles
language sql
stable
security definer
set search_path = ''
as $$ select * from public.profiles where id = auth.uid() $$;

-- Marca de última actividad (como mucho, una escritura cada 10 minutos)
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profiles set last_seen_at = now()
  where id = auth.uid() and (last_seen_at is null or last_seen_at < now() - interval '10 minutes')
$$;

-- Perfil visto por otra persona, con cada apartado filtrado por su privacidad
create or replace function public.profile_view(p_username text)
returns table (
  id uuid, username text, display_name text, avatar_url text, cover_path text, languages text[],
  availability public.chat_availability, created_at timestamptz,
  country text, region text, bio text, exploring text, can_offer text, looking_for text,
  personal_projects text, skills text[],
  about_visible boolean, interests_visible boolean, activity_visible boolean, network_visible boolean,
  connection text, connections_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username::text, coalesce(p.display_name, p.username::text), p.avatar_url, p.cover_path, p.languages,
    p.availability, p.created_at,
    case when public.profile_section_visible(p.id, 'location') then p.country end,
    case when public.profile_section_visible(p.id, 'location') then p.region end,
    case when public.profile_section_visible(p.id, 'about') then p.bio end,
    case when public.profile_section_visible(p.id, 'about') then p.exploring end,
    case when public.profile_section_visible(p.id, 'about') then p.can_offer end,
    case when public.profile_section_visible(p.id, 'about') then p.looking_for end,
    case when public.profile_section_visible(p.id, 'about') then p.personal_projects end,
    case when public.profile_section_visible(p.id, 'about') then p.skills end,
    public.profile_section_visible(p.id, 'about'),
    public.profile_section_visible(p.id, 'interests'),
    public.profile_section_visible(p.id, 'activity'),
    public.profile_section_visible(p.id, 'network'),
    coalesce((
      select case when k.status = 'accepted' then 'connected'
                  when k.requester_id = auth.uid() then 'sent'
                  when k.status = 'pending' then 'received' else 'none' end
      from public.connections k
      where k.pair_low = least(auth.uid(), p.id) and k.pair_high = greatest(auth.uid(), p.id)
    ), 'none'),
    case when public.profile_section_visible(p.id, 'network') then
      (select count(*) from public.connections k where k.status = 'accepted' and p.id in (k.requester_id, k.addressee_id))
    end
  from public.profiles p
  where p.username = p_username::extensions.citext
    and p.onboarded_at is not null
    and (p.id = auth.uid() or public.is_staff() or (p.status = 'active' and public.is_active_member()))
    and not public.is_blocked_with(p.id)
$$;

-- Temas de un perfil (si su apartado de intereses es visible)
create or replace function public.profile_topics_for(p_profile uuid)
returns table (topic_id bigint, slug text, name text, area_slug text, area_name text, relation public.topic_relation, is_primary boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.slug, t.name, a.slug, a.name, pt.relation, pt.is_primary
  from public.profile_topics pt
  join public.topics t on t.id = pt.topic_id
  join public.interest_areas a on a.slug = t.area_slug
  where pt.profile_id = p_profile and public.profile_section_visible(p_profile, 'interests')
  order by pt.is_primary desc, a.position, t.name
$$;

create or replace function public.profile_goals_for(p_profile uuid)
returns setof public.user_goal
language sql
stable
security definer
set search_path = ''
as $$
  select g.goal from public.profile_goals g
  where g.profile_id = p_profile and public.profile_section_visible(p_profile, 'interests')
  order by g.goal
$$;

-- Guarda temas y relación de una vez. p_items: [{"topic_id": 1, "relation": "learning", "is_primary": true}, …]
create or replace function public.set_my_topics(p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 200 then
    raise exception 'Máximo 200 temas' using errcode = '23514';
  end if;
  if (select count(*) from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e where (e->>'is_primary')::boolean) > 5 then
    raise exception 'Máximo 5 temas principales' using errcode = '23514';
  end if;
  delete from public.profile_topics
  where profile_id = uid
    and topic_id not in (select (e->>'topic_id')::bigint from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e);
  insert into public.profile_topics (profile_id, topic_id, relation, is_primary)
  select uid, (e->>'topic_id')::bigint,
         coalesce(nullif(e->>'relation', ''), 'interested')::public.topic_relation,
         coalesce((e->>'is_primary')::boolean, false)
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
  on conflict (profile_id, topic_id) do update
    set relation = excluded.relation, is_primary = excluded.is_primary;
end;
$$;

create or replace function public.set_my_goals(p_goals public.user_goal[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Sesión requerida' using errcode = '42501';
  end if;
  delete from public.profile_goals where profile_id = auth.uid() and not (goal = any (coalesce(p_goals, '{}')));
  insert into public.profile_goals (profile_id, goal)
  select auth.uid(), g from unnest(coalesce(p_goals, '{}')) g
  on conflict do nothing;
end;
$$;

-- Autocompletado de temas: nombre, sinónimos y parecido (trigramas). Incluye
-- las propuestas propias pendientes.
create or replace function public.search_topics(p_query text, p_limit integer default 12)
returns table (id bigint, slug text, name text, area_slug text, area_name text, status public.topic_status, via text)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (select public.immutable_unaccent(lower(trim(coalesce(p_query, '')))) as v),
  hits as (
    select t.id, 3 as score, null::text as via from public.topics t, q
    where public.immutable_unaccent(lower(t.name)) like q.v || '%'
    union all
    select t.id, 2, null from public.topics t, q
    where public.immutable_unaccent(lower(t.name)) like '%' || q.v || '%'
    union all
    select s.topic_id, 2, s.term from public.topic_synonyms s, q
    where public.immutable_unaccent(lower(s.term)) like q.v || '%'
    union all
    select t.id, 1, null from public.topics t, q
    where char_length(q.v) >= 4 and extensions.similarity(public.immutable_unaccent(lower(t.name)), q.v) > 0.35
  ),
  best as (select h.id, max(h.score) as score, max(h.via) as via from hits h group by h.id)
  select t.id, t.slug, t.name, a.slug, a.name, t.status, b.via
  from best b
  join public.topics t on t.id = b.id
  join public.interest_areas a on a.slug = t.area_slug
  where char_length((select v from q)) >= 1
    and t.merged_into is null
    and (t.status = 'approved' or (t.status = 'pending' and t.proposed_by = auth.uid()) or public.is_staff())
    and public.is_active_member()
  order by b.score desc, char_length(t.name), t.name
  limit least(greatest(p_limit, 1), 30)
$$;

-- Proponer un tema nuevo (queda pendiente de moderación). Si ya existe uno
-- equivalente (mismo nombre normalizado o sinónimo), devuelve ese.
create or replace function public.propose_topic(p_name text, p_area text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_slug text := left(public.slugify(v_name), 60);
  v_id bigint;
begin
  if not public.can_write() then
    raise exception 'Tu cuenta no puede proponer temas' using errcode = '42501';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 60 or char_length(v_slug) < 2 then
    raise exception 'Nombre de tema no válido (2 a 60 caracteres)' using errcode = '22023';
  end if;
  if not exists (select 1 from public.interest_areas where slug = p_area) then
    raise exception 'Área no válida' using errcode = '22023';
  end if;
  select coalesce(t.merged_into, t.id) into v_id from public.topics t where t.slug = v_slug;
  if v_id is null then
    select s.topic_id into v_id from public.topic_synonyms s
    where public.immutable_unaccent(lower(s.term)) = public.immutable_unaccent(lower(v_name));
  end if;
  if v_id is not null then
    return v_id;
  end if;
  if (select count(*) from public.topics where proposed_by = auth.uid() and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Puedes proponer hasta 10 temas al día' using errcode = 'P0429';
  end if;
  insert into public.topics (slug, name, area_slug, status, proposed_by)
  values (v_slug, v_name, p_area, 'pending', auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Tarjetas de miembro con afinidad y razones de recomendación
-- -----------------------------------------------------------------------------
create type public.member_card as (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  looking_for text,
  country text,
  region text,
  availability public.chat_availability,
  languages text[],
  shared_count integer,
  shared_topics text[],
  topics text[],
  reasons text[],
  connection text
);

create or replace function public.member_card_for(p_id uuid)
returns public.member_card
language sql
stable
security definer
set search_path = ''
as $$
  with me as (select auth.uid() as uid),
  vis as (
    select public.profile_section_visible(p_id, 'interests') as interests,
           public.profile_section_visible(p_id, 'about') as about,
           public.profile_section_visible(p_id, 'location') as location
  ),
  shared as (
    select t.name, theirs.relation as their_rel, mine.relation as my_rel
    from public.profile_topics theirs
    join public.profile_topics mine on mine.topic_id = theirs.topic_id and mine.profile_id = (select uid from me)
    join public.topics t on t.id = theirs.topic_id
    where theirs.profile_id = p_id and (select interests from vis)
  )
  select
    p.id, p.username::text, coalesce(p.display_name, p.username::text), p.avatar_url,
    case when v.about then p.bio else '' end,
    case when v.about then p.looking_for else '' end,
    case when v.location then p.country end,
    case when v.location then p.region end,
    p.availability, p.languages,
    (select count(*)::int from shared),
    array(select s.name from shared s order by s.name limit 8),
    case when v.interests then array(
      select t.name from public.profile_topics pt join public.topics t on t.id = pt.topic_id
      where pt.profile_id = p.id order by pt.is_primary desc, t.name limit 8)
    else '{}' end,
    array_remove(array[
      case when (select count(*) from shared) >= 2 then 'Compartís ' || (select count(*) from shared) || ' intereses' end,
      (select 'Puede ayudarte con ' || s.name || ', que estás aprendiendo' from shared s
        where s.my_rel = 'learning' and s.their_rel in ('can_teach', 'experienced', 'knowledgeable') limit 1),
      (select 'Busca colaborar en ' || s.name from shared s where s.their_rel = 'seeking_collaborators' limit 1),
      (select 'Coincidís en el círculo «' || c.name || '»' from public.circle_members a
        join public.circle_members b on b.circle_id = a.circle_id and b.user_id = (select uid from me)
        join public.circles c on c.id = a.circle_id
        where a.user_id = p.id and c.visibility <> 'invite' limit 1),
      case when exists (select 1 from public.profile_goals g where g.profile_id = p.id and g.goal = 'find_collaborators' and v.interests)
        then 'Busca colaboradores para proyectos' end
    ], null),
    coalesce((
      select case when k.status = 'accepted' then 'connected'
                  when k.requester_id = (select uid from me) then 'sent'
                  when k.status = 'pending' then 'received' else 'none' end
      from public.connections k
      where k.pair_low = least((select uid from me), p.id) and k.pair_high = greatest((select uid from me), p.id)
    ), 'none')
  from public.profiles p, vis v
  where p.id = p_id
$$;

-- Buscador de miembros con filtros por área, tema, relación, objetivos, idioma,
-- ubicación visible, disponibilidad, proyectos y círculos en común.
create or replace function public.search_members(
  p_query text default null,
  p_areas text[] default null,
  p_topics bigint[] default null,
  p_relation public.topic_relation default null,
  p_goals public.user_goal[] default null,
  p_languages text[] default null,
  p_country text default null,
  p_region text default null,
  p_availability public.chat_availability default null,
  p_with_projects boolean default false,
  p_in_my_circles boolean default false,
  p_limit integer default 20,
  p_offset integer default 0
)
returns setof public.member_card
language sql
stable
security definer
set search_path = ''
as $$
  select mc.*
  from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where public.is_active_member()
    and p.onboarded_at is not null and p.status = 'active' and p.id <> auth.uid()
    and not public.is_blocked_with(p.id)
    and (coalesce(p_query, '') = '' or public.immutable_unaccent(
          coalesce(p.username::text, '') || ' ' || coalesce(p.display_name, '') || ' ' ||
          case when public.profile_section_visible(p.id, 'about')
            then p.bio || ' ' || p.looking_for || ' ' || p.exploring || ' ' || p.can_offer || ' ' ||
                 p.personal_projects || ' ' || array_to_string(p.skills, ' ')
            else '' end
        ) ilike '%' || public.immutable_unaccent(p_query) || '%')
    and (p_areas is null or cardinality(p_areas) = 0 or (public.profile_section_visible(p.id, 'interests') and exists (
          select 1 from public.profile_topics pt join public.topics t on t.id = pt.topic_id
          where pt.profile_id = p.id and t.area_slug = any (p_areas))))
    and (p_topics is null or cardinality(p_topics) = 0 or (public.profile_section_visible(p.id, 'interests') and exists (
          select 1 from public.profile_topics pt
          where pt.profile_id = p.id and pt.topic_id = any (p_topics)
            and (p_relation is null or pt.relation = p_relation))))
    and (p_relation is null or (p_topics is not null and cardinality(p_topics) > 0)
         or (public.profile_section_visible(p.id, 'interests') and exists (
           select 1 from public.profile_topics pt where pt.profile_id = p.id and pt.relation = p_relation)))
    and (p_goals is null or cardinality(p_goals) = 0 or (public.profile_section_visible(p.id, 'interests') and exists (
          select 1 from public.profile_goals g where g.profile_id = p.id and g.goal = any (p_goals))))
    and (p_languages is null or cardinality(p_languages) = 0 or p.languages && p_languages)
    and (coalesce(p_country, '') = '' or (public.profile_section_visible(p.id, 'location')
         and lower(public.immutable_unaccent(coalesce(p.country, ''))) = lower(public.immutable_unaccent(p_country))))
    and (coalesce(p_region, '') = '' or (public.profile_section_visible(p.id, 'location')
         and public.immutable_unaccent(coalesce(p.region, '')) ilike '%' || public.immutable_unaccent(p_region) || '%'))
    and (p_availability is null or p.availability = p_availability)
    and (not coalesce(p_with_projects, false) or exists (select 1 from public.project_members pm where pm.user_id = p.id))
    and (not coalesce(p_in_my_circles, false) or exists (
          select 1 from public.circle_members a join public.circle_members b on b.circle_id = a.circle_id
          where a.user_id = p.id and b.user_id = auth.uid()))
  order by mc.shared_count desc, cardinality(mc.reasons) desc, p.onboarded_at desc
  limit least(greatest(p_limit, 1), 50)
  offset greatest(p_offset, 0)
$$;

-- «Descubrir»: personas afines o complementarias sin conexión ni descarte reciente
create or replace function public.discover_members(p_limit integer default 12)
returns setof public.member_card
language sql
stable
security definer
set search_path = ''
as $$
  select mc.*
  from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where public.is_active_member()
    and p.onboarded_at is not null and p.status = 'active' and p.id <> auth.uid()
    and p.availability <> 'closed'
    and not public.is_blocked_with(p.id)
    and not exists (select 1 from public.connections k
      where k.pair_low = least(auth.uid(), p.id) and k.pair_high = greatest(auth.uid(), p.id))
    and not exists (select 1 from public.member_skips s
      where s.user_id = auth.uid() and s.skipped_id = p.id and s.created_at > now() - interval '30 days')
  order by cardinality(mc.reasons) desc, mc.shared_count desc, (p.availability = 'open') desc, p.onboarded_at desc
  limit least(greatest(p_limit, 1), 30)
$$;

-- Afinidad para Explorar y nuevos miembros (tarjetas con privacidad aplicada)
create or replace function public.affinity_members(p_limit integer default 6)
returns setof public.member_card
language sql
stable
security definer
set search_path = ''
as $$
  select mc.* from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where public.is_active_member() and p.onboarded_at is not null and p.status = 'active'
    and p.id <> auth.uid() and not public.is_blocked_with(p.id) and mc.shared_count > 0
  order by mc.shared_count desc, p.onboarded_at desc
  limit least(greatest(p_limit, 1), 30)
$$;

create or replace function public.new_members(p_limit integer default 6)
returns setof public.member_card
language sql
stable
security definer
set search_path = ''
as $$
  select mc.* from public.profiles p
  cross join lateral public.member_card_for(p.id) as mc
  where public.is_active_member() and p.onboarded_at is not null and p.status = 'active'
    and p.id <> auth.uid() and not public.is_blocked_with(p.id)
  order by p.onboarded_at desc
  limit least(greatest(p_limit, 1), 30)
$$;

create or replace function public.member_countries()
returns table (country text, members bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select initcap(lower(trim(p.country))), count(*)
  from public.profiles p
  where public.is_active_member() and p.onboarded_at is not null and p.status = 'active'
    and coalesce(trim(p.country), '') <> '' and public.profile_section_visible(p.id, 'location')
  group by initcap(lower(trim(p.country)))
  order by count(*) desc, 1
  limit 100
$$;

-- -----------------------------------------------------------------------------
-- Proyectos: creación con área y temas
-- -----------------------------------------------------------------------------
create or replace function public.create_project(
  p_title text, p_summary text, p_description text, p_objectives text[], p_seeking text,
  p_status public.project_status, p_country text, p_region text, p_area text default null,
  p_topics bigint[] default '{}', p_skills bigint[] default '{}', p_cover_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.can_write() then
    raise exception 'Tu cuenta no puede crear proyectos' using errcode = '42501';
  end if;
  if p_cover_path is not null and p_cover_path not like auth.uid()::text || '/%' then
    raise exception 'Imagen no válida' using errcode = '22023';
  end if;
  insert into public.projects (slug, title, summary, description, objectives, seeking, status, country, region, area_slug, cover_path, owner_id)
  values (
    public.unique_slug(p_title, 'projects'), trim(p_title), trim(coalesce(p_summary, '')), trim(coalesce(p_description, '')),
    coalesce(p_objectives, '{}'), trim(coalesce(p_seeking, '')), p_status, nullif(trim(p_country), ''), nullif(trim(p_region), ''),
    nullif(p_area, ''), p_cover_path, auth.uid()
  )
  returning id into v_id;
  insert into public.project_members (project_id, user_id, role) values (v_id, auth.uid(), 'owner');
  insert into public.project_topics (project_id, topic_id, kind)
  select v_id, x, 'theme'::public.project_topic_kind from unnest(coalesce(p_topics, '{}')) x where exists (select 1 from public.topics t where t.id = x)
  union
  select v_id, x, 'skill'::public.project_topic_kind from unnest(coalesce(p_skills, '{}')) x where exists (select 1 from public.topics t where t.id = x);
  return v_id;
end;
$$;

create or replace function public.set_project_topics(p_project uuid, p_topics bigint[], p_skills bigint[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_project_owner(p_project) then
    raise exception 'Sin permiso' using errcode = '42501';
  end if;
  delete from public.project_topics where project_id = p_project;
  insert into public.project_topics (project_id, topic_id, kind)
  select p_project, x, 'theme'::public.project_topic_kind from unnest(coalesce(p_topics, '{}')) x where exists (select 1 from public.topics t where t.id = x)
  union
  select p_project, x, 'skill'::public.project_topic_kind from unnest(coalesce(p_skills, '{}')) x where exists (select 1 from public.topics t where t.id = x);
end;
$$;

grant update (area_slug) on public.projects to authenticated;

-- -----------------------------------------------------------------------------
-- Moderación del catálogo
-- -----------------------------------------------------------------------------
create or replace function public.admin_review_topic(p_topic bigint, p_approve boolean, p_area text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  update public.topics set status = case when p_approve then 'approved'::public.topic_status else 'rejected' end,
    area_slug = coalesce(nullif(p_area, ''), area_slug)
  where id = p_topic;
  if not p_approve then
    delete from public.profile_topics where topic_id = p_topic;
  end if;
  perform public.log_moderation(case when p_approve then 'topic:approve' else 'topic:reject' end, 'topic', p_topic::text, '');
end;
$$;

-- Fusiona un tema en otro equivalente: mueve personas, proyectos y nombre (como sinónimo)
create or replace function public.admin_merge_topics(p_from bigint, p_into bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  perform public.require_admin();
  if p_from = p_into then
    raise exception 'Elige dos temas distintos' using errcode = '22023';
  end if;
  select name into v_name from public.topics where id = p_from;
  insert into public.profile_topics (profile_id, topic_id, relation, is_primary)
  select profile_id, p_into, relation, is_primary from public.profile_topics where topic_id = p_from
  on conflict (profile_id, topic_id) do nothing;
  insert into public.project_topics (project_id, topic_id, kind)
  select project_id, p_into, kind from public.project_topics where topic_id = p_from
  on conflict do nothing;
  delete from public.profile_topics where topic_id = p_from;
  delete from public.project_topics where topic_id = p_from;
  update public.topic_synonyms set topic_id = p_into where topic_id = p_from
    and not exists (select 1 from public.topic_synonyms s2 where s2.topic_id = p_into and s2.term = topic_synonyms.term);
  insert into public.topic_synonyms (topic_id, term) values (p_into, v_name) on conflict do nothing;
  update public.topics set merged_into = p_into, status = 'rejected' where id = p_from;
  perform public.log_moderation('topic:merge', 'topic', p_from::text, 'en ' || p_into::text);
end;
$$;

create or replace function public.admin_add_synonym(p_topic bigint, p_term text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_staff();
  insert into public.topic_synonyms (topic_id, term) values (p_topic, trim(p_term)) on conflict do nothing;
  perform public.log_moderation('topic:synonym', 'topic', p_topic::text, p_term);
end;
$$;

-- -----------------------------------------------------------------------------
-- Privilegios y RLS de las tablas nuevas
-- -----------------------------------------------------------------------------
revoke all on public.interest_areas, public.topics, public.topic_areas, public.topic_synonyms, public.profile_topics,
  public.profile_goals, public.profile_privacy, public.user_settings, public.project_topics from anon, authenticated;
grant select on public.interest_areas, public.topic_areas, public.topic_synonyms to authenticated;
grant select on public.topics to authenticated;
grant select, insert, update, delete on public.profile_topics, public.profile_goals to authenticated;
grant select, insert, update on public.profile_privacy, public.user_settings to authenticated;
grant select on public.project_topics to authenticated;

alter table public.interest_areas  enable row level security;
alter table public.topics          enable row level security;
alter table public.topic_areas     enable row level security;
alter table public.topic_synonyms  enable row level security;
alter table public.profile_topics  enable row level security;
alter table public.profile_goals   enable row level security;
alter table public.profile_privacy enable row level security;
alter table public.user_settings   enable row level security;
alter table public.project_topics  enable row level security;

create policy "interest_areas: lectura" on public.interest_areas for select to authenticated using (true);
create policy "topics: aprobados, propios pendientes o equipo" on public.topics for select to authenticated
using (status = 'approved' or proposed_by = auth.uid() or public.is_staff());
create policy "topic_areas: lectura" on public.topic_areas for select to authenticated using (true);
create policy "topic_synonyms: lectura" on public.topic_synonyms for select to authenticated using (true);

create policy "profile_topics: según privacidad" on public.profile_topics for select to authenticated
using (profile_id = auth.uid() or public.profile_section_visible(profile_id, 'interests'));
create policy "profile_topics: gestión propia" on public.profile_topics for insert to authenticated
with check (profile_id = auth.uid() and public.is_active_member()
  and exists (select 1 from public.topics t where t.id = topic_id and (t.status = 'approved' or t.proposed_by = auth.uid())));
create policy "profile_topics: edición propia" on public.profile_topics for update to authenticated
using (profile_id = auth.uid() and public.is_active_member()) with check (profile_id = auth.uid());
create policy "profile_topics: baja propia" on public.profile_topics for delete to authenticated
using (profile_id = auth.uid());

create policy "profile_goals: según privacidad" on public.profile_goals for select to authenticated
using (profile_id = auth.uid() or public.profile_section_visible(profile_id, 'interests'));
create policy "profile_goals: gestión propia" on public.profile_goals for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid() and public.is_active_member());

create policy "profile_privacy: propia" on public.profile_privacy for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "user_settings: propios" on public.user_settings for all to authenticated
using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "project_topics: lectura" on public.project_topics for select to authenticated
using (public.is_active_member() or public.is_staff());

revoke all on function
  public.profile_section_visible(uuid, text), public.my_profile(), public.touch_last_seen(), public.profile_view(text),
  public.profile_topics_for(uuid), public.profile_goals_for(uuid), public.set_my_topics(jsonb), public.set_my_goals(public.user_goal[]),
  public.search_topics(text, integer), public.propose_topic(text, text), public.member_card_for(uuid),
  public.search_members(text, text[], bigint[], public.topic_relation, public.user_goal[], text[], text, text, public.chat_availability, boolean, boolean, integer, integer),
  public.discover_members(integer), public.affinity_members(integer), public.new_members(integer), public.member_countries(),
  public.create_project(text, text, text, text[], text, public.project_status, text, text, text, bigint[], bigint[], text),
  public.set_project_topics(uuid, bigint[], bigint[]),
  public.admin_review_topic(bigint, boolean, text), public.admin_merge_topics(bigint, bigint), public.admin_add_synonym(bigint, text)
from public, anon;
grant execute on function
  public.profile_section_visible(uuid, text), public.my_profile(), public.touch_last_seen(), public.profile_view(text),
  public.profile_topics_for(uuid), public.profile_goals_for(uuid), public.set_my_topics(jsonb), public.set_my_goals(public.user_goal[]),
  public.search_topics(text, integer), public.propose_topic(text, text), public.member_card_for(uuid),
  public.search_members(text, text[], bigint[], public.topic_relation, public.user_goal[], text[], text, text, public.chat_availability, boolean, boolean, integer, integer),
  public.discover_members(integer), public.affinity_members(integer), public.new_members(integer), public.member_countries(),
  public.create_project(text, text, text, text[], text, public.project_status, text, text, text, bigint[], bigint[], text),
  public.set_project_topics(uuid, bigint[], bigint[]),
  public.admin_review_topic(bigint, boolean, text), public.admin_merge_topics(bigint, bigint), public.admin_add_synonym(bigint, text)
to authenticated;
