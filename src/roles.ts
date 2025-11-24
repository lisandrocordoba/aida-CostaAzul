import { Usuario } from 'auth.js';

export type Rol = | 'profesor' | 'secretario' | 'alumno';

export function verificarRol(usuario: Usuario, rol: Rol): boolean {
    usuario = usuario as Usuario;
    rol = rol as Rol;
    return true
  }
