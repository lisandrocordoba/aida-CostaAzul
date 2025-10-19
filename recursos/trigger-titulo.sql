CREATE OR REPLACE FUNCTION aida.chequear_inicio_tramite()
RETURNS TRIGGER AS $$
DECLARE
    v_id_carrera INTEGER;
    v_cant_materias_requeridas INTEGER;
    v_cant_materias_aprobadas INTEGER;
BEGIN
    -- Obtener la carrera del alumno
    SELECT id_carrera INTO v_id_carrera
    FROM aida.alumnos
    WHERE lu = NEW.alumno_lu;

    -- Si el alumno no tiene carrera asignada, no hacer nada
    IF v_id_carrera IS NULL THEN
        RETURN NEW;
    END IF;

    -- Contar cuántas materias son requeridas para esa carrera
    SELECT COUNT(*) INTO v_cant_materias_requeridas
    FROM aida.materiasEnCarrera
    WHERE carrera_id = v_id_carrera;

    -- Contar cuántas de esas materias el alumno aprobó
    SELECT COUNT(DISTINCT c.materia_id)
    INTO v_cant_materias_aprobadas
    FROM aida.cursadas c
    JOIN aida.materiasEnCarrera mec
      ON c.materia_id = mec.materia_id
     AND mec.carrera_id = v_id_carrera
    WHERE c.alumno_lu = NEW.alumno_lu
      AND c.nota IS NOT NULL
      AND c.nota >= 4;  -- asumimos nota >= 4 es aprobado

    -- Si completó todas las materias requeridas, iniciar el trámite
    IF v_cant_materias_aprobadas = v_cant_materias_requeridas THEN
        UPDATE aida.alumnos
        SET titulo_en_tramite = CURRENT_DATE
        WHERE lu = NEW.alumno_lu
          AND titulo_en_tramite IS NULL; -- para no sobrescribir si ya estaba iniciado
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chequear_inicio_tramite
AFTER INSERT OR UPDATE OF nota ON aida.cursadas
FOR EACH ROW
EXECUTE FUNCTION aida.chequear_inicio_tramite();
