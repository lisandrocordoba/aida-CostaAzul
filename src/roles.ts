import { Usuario } from './auth.js';
import { Client } from 'pg';
import { Request, Response, NextFunction } from "express";

export type Rol = { nombreRol: string;
                    lu?: string;
                    legajo?: Number;
                    carrera?: string;
                  }

export async function obtenerDatosRol(usuario: Usuario, nombreRol: string, clientDb: Client) {

    if (nombreRol === "alumno") {
      //obtengo LU y carrera del alumno
        try {
          const result = await clientDb.query(
              'SELECT lu, nombre_carrera FROM aida.alumnos ' +
                  'JOIN aida.carreras ON aida.alumnos.id_carrera_ALU = aida.carreras.id_carrera WHERE id_usuario_ALU = $1',
              [usuario.id]
          );

          if (result.rows.length === 0) {
              return null;
          }

          const { lu, nombre_carrera } = result.rows[0];

          return {
              nombreRol: nombreRol,
              lu: lu,
              carrera: nombre_carrera
          };
      } catch (error) {
          console.error('Error al obtener datos de sesión:', error);
          return null;
      }
    }

    if (nombreRol === "profesor") {

      //obtengo legajo del profesor
        try {
          const result = await clientDb.query(
              'SELECT legajo FROM aida.profesores WHERE id_usuario_PROF = $1',
              [usuario.id]
          );

          if (result.rows.length === 0) {
              return null;
          }

          const { legajo } = result.rows[0];

          return {
              nombreRol: nombreRol,
              legajo: legajo
          };
      } catch (error) {
          console.error('Error al obtener datos de sesión:', error);
          return null;
      }
    }

    if (nombreRol === "secretario") {
      //obtengo LU y carrera del alumno
        try {
          const result = await clientDb.query(
              'SELECT * FROM aida.secretario WHERE id_usuario_SEC = $1',
              [usuario.id]
          );

          if (result.rows.length === 0) {
              return null;
          }

          return {
              nombreRol: nombreRol
          };
      } catch (error) {
          console.error('Error al obtener datos de sesión:', error);
          return null;
      }
    }
  return null;
}

// Middleware de rol para el backend
export function requireRolAPI(...rolesPermitidos: string[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    const rol = req.session.rol as Rol | undefined;

    if (rol && rolesPermitidos.includes(rol.nombreRol)) {
      return next();
    }

    return res.status(401).json({ error: 'No autorizado' });
  };
}
