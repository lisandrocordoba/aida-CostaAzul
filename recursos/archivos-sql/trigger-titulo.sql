CREATE OR REPLACE FUNCTION aida.chequear_inicio_tramite()
RETURNS TRIGGER AS $$
DECLARE
    v_id_carrera INTEGER;
    v_cant_materias_requeridas INTEGER;
    v_cant_materias_aprobadas INTEGER;
BEGIN
    -- 1. Obtener la carrera del alumno usando la LU del registro de cursada
    SELECT id_carrera_ALU INTO v_id_carrera
    FROM aida.alumnos
    WHERE lu = NEW.lu_CURS; -- Usamos NEW.lu_CURS (antes NEW.alumno_lu)

    -- Si el alumno no tiene carrera asignada, o si la nota no es de aprobación, no hacer nada
    IF v_id_carrera IS NULL OR NEW.nota IS NULL OR NEW.nota < 4 THEN
        RETURN NEW;
    END IF;

    -- 2. Contar cuántas materias son requeridas para esa carrera
    SELECT COUNT(*) INTO v_cant_materias_requeridas
    FROM aida.materiasEnCarrera
    WHERE id_carrera_MEC = v_id_carrera; -- Usamos id_carrera_MEC (antes carrera_id)

    -- 3. Contar cuántas de esas materias el alumno aprobó
    SELECT COUNT(DISTINCT c.id_materia_CURS)
    INTO v_cant_materias_aprobadas
    FROM aida.cursadas c
    JOIN aida.materiasEnCarrera mec
      ON c.id_materia_CURS = mec.id_materia_MEC -- Usamos id_materia_CURS e id_materia_MEC
     AND mec.id_carrera_MEC = v_id_carrera      -- Usamos id_carrera_MEC
    WHERE c.lu_CURS = NEW.lu_CURS               -- Usamos lu_CURS
      AND c.nota IS NOT NULL
      AND c.nota >= 4;

    -- 4. Si completó todas las materias requeridas, iniciar el trámite
    IF v_cant_materias_aprobadas = v_cant_materias_requeridas THEN
        UPDATE aida.alumnos
        SET titulo_en_tramite = CURRENT_DATE
        WHERE lu = NEW.lu_CURS -- Usamos NEW.lu_CURS
          AND titulo_en_tramite IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crea el TRIGGER
CREATE TRIGGER trg_chequear_inicio_tramite
AFTER INSERT OR UPDATE OF nota ON aida.cursadas
FOR EACH ROW
EXECUTE FUNCTION aida.chequear_inicio_tramite();