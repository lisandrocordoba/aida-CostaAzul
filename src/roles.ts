import { Usuario } from 'auth.js';
import { Client } from 'pg';

export type Rol = { nombreRol: string;
                    lu?: string;
                    legajo?: string;
                    carrera?: string;
                  }

export function verificarRol(usuario: Usuario, rol: Rol): boolean {
    usuario = usuario as Usuario;
    rol = rol as Rol;
    return true
  }

export async function obtenerDatosRol(usuario: Usuario, nombreRol: string, clientDb: Client) {
    // Obtener info del profesor o alumno con el usuario id
    // Del alumno: lu, nombre, apellido, carrera
    // Del profesor: legajo, nombre, apellido

    if (nombreRol === "alumno") {


      //obtengo LU y carrera del alumno
        try {
          const result = await clientDb.query(
              'SELECT lu, nombre_carrera FROM aida.alumnos ' +
                  'JOIN aida.carreras ON aida.alumnos.id_carrera = aida.carreras.id WHERE id_usuario = $1',
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
              'SELECT legajo FROM aida.profesores WHERE id_usuario = $1',
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
  return null;
}
