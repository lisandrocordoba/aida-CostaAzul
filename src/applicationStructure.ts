export type TableName =
  | 'materiasEnCarrera'
  | 'alumnos'
  | 'cursadas'
  | 'carreras'
  | 'materias'
  | 'usuarios'
  | 'profesores'
  | 'secretario'
  | 'dicta';

export type ColumnName =
  // materiasEnCarrera
  | 'id_carrera'
  | 'id_materia'
  // alumnos
  | 'lu'
  | 'id_usuario'
  | 'id_carrera'
  | 'titulo_en_tramite'
  | 'egreso'
  // cursadas
  | 'alumno_lu'
  | 'id_materia'
  | 'anio'
  | 'cuatrimestre'
  | 'nota'
  // carreras
  | 'id'
  | 'nombre_carrera'
  // materias
  | 'id'
  | 'nombre_materia'
  // usuarios
  | 'id'
  | 'username'
  | 'password_hash'
  | 'nombre'
  | 'apellido'
  | 'email'
  | 'activo'
  // profesores
  | 'legajo'
  | 'id_usuario'
  // secretario
  | 'id_secretario'
  | 'id_usuario'
  //dicta
  | 'legajo'
  | 'id_materia'

export type ColumnType = 'text' | 'int' | 'date' | 'boolean';


export interface ColumnDef {
    name: ColumnName
    type: ColumnType
    title?: string
    description?: string
}
export interface ForeignKeyDef {
    column: ColumnName   // ASUMIMOS NO HAY fks COMPUESTAS
    referencedColumn: ColumnName
    referencesTable: TableName
    referencesColumns: ColumnName[]
}

export interface TableDef {
    name: TableName
    columns: ColumnDef[]
    pk: ColumnName[]
    fks: ForeignKeyDef[]
    title?: string
    orderBy?: ColumnName[]
    elementName?: string
}

const tableDefinitions: TableDef[] = [
  {
    name: 'materiasEnCarrera',
    columns: [
      { name: 'id_carrera' as ColumnName, type: 'int', title: 'Id. Carrera' },
      { name: 'id_materia' as ColumnName, type: 'int', title: 'Id. Materia' },
    ],
    pk: ['id_carrera' as ColumnName, 'id_materia' as ColumnName],
    fks: [],
    elementName: 'materiaEnCarrera'
  },
  {
    name: 'alumnos',
    columns: [
      { name: 'lu' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'id_usuario' as ColumnName, type: 'int', title: 'Nombre'},   // agrego title NOMBRE porque sino el HTML muestra "id_usuario" en la columna donde pone los nombres.
      { name: 'id_carrera' as ColumnName, type: 'int', title: 'Carrera' },
      { name: 'titulo_en_tramite' as ColumnName, type: 'date', title: 'Título en Trámite' },
      { name: 'egreso' as ColumnName, type: 'date', title: 'Fecha Egreso' },
    ],
    pk: ['lu' as ColumnName],
    fks: [
      { column: 'id_usuario', referencedColumn: 'id', referencesTable: 'usuarios', referencesColumns: ['nombre', 'apellido']},
      { column: 'id_carrera', referencedColumn: 'id', referencesTable: 'carreras', referencesColumns: ['nombre_carrera'] }
    ],
    orderBy: ['apellido' as ColumnName, 'nombre' as ColumnName],
    elementName: 'alumno'
  },
  {
    name: 'cursadas',
    columns: [
      { name: 'alumno_lu' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'id_materia' as ColumnName, type: 'int', title: 'Materia' },
      { name: 'anio' as ColumnName, type: 'int', title: 'Año' },
      { name: 'cuatrimestre' as ColumnName, type: 'int', title: 'Cuatrimestre' },
      { name: 'nota' as ColumnName, type: 'int',title: 'Nota' },
    ],
    pk: ['alumno_lu' as ColumnName, 'id_materia' as ColumnName, 'anio' as ColumnName, 'cuatrimestre' as ColumnName],
    fks: [
      { column: 'alumno_lu', referencedColumn: 'lu', referencesTable: 'alumnos', referencesColumns: ['lu', 'id_usuario']}, //nombre', 'apellido'] },
      { column: 'id_materia', referencedColumn: 'id', referencesTable: 'materias', referencesColumns: ['nombre_materia'] }
    ],
    orderBy: ['anio' as ColumnName, 'cuatrimestre' as ColumnName],
    elementName: 'cursada'
  },
  {
    name: 'carreras',
    columns: [
      { name: 'id' as ColumnName, type: 'int' },
      { name: 'nombre_carrera' as ColumnName, type: 'text' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['nombre_carrera' as ColumnName],
    elementName: 'carrera'
  },
  {
    name: 'materias',
    columns: [
      { name: 'id' as ColumnName, type: 'int' },
      { name: 'nombre_materia' as ColumnName, type: 'text', title: 'Materia' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['nombre_materia' as ColumnName],
    elementName: 'materia'
  },
  {
    name: 'usuarios',
    columns: [
      { name: 'id' as ColumnName, type: 'int' }, // 'serial' se maneja como 'int'
      { name: 'username' as ColumnName, type: 'text' },
      { name: 'password_hash' as ColumnName, type: 'text' },
      { name: 'nombre' as ColumnName, type: 'text', title: 'Nombre' },
      { name: 'apellido' as ColumnName, type: 'text', title: 'Apellido' },
      { name: 'email' as ColumnName, type: 'text' },
      { name: 'activo' as ColumnName, type: 'boolean' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['apellido' as ColumnName, 'nombre' as ColumnName],
    elementName: 'usuario'
  },
  {
    name: 'profesores',
    columns: [
      { name: 'legajo' as ColumnName, type: 'int' },
      { name: 'id_usuario' as ColumnName, type: 'int' },
    ],
    pk: ['legajo' as ColumnName],
    fks: [{ column: 'id_usuario', referencedColumn: 'id', referencesTable: 'usuarios', referencesColumns: ['nombre', 'apellido']}],
    orderBy: ['apellido' as ColumnName, 'nombre' as ColumnName],
    elementName: 'profesor'
  },
  {
    name: 'secretario',
    columns: [
      { name: 'id_secretario' as ColumnName, type: 'int' },
      { name: 'id_usuario' as ColumnName, type: 'int' },
    ],
    pk: ['id_secretario' as ColumnName],
    fks: [{ column: 'id_usuario', referencedColumn: 'id', referencesTable: 'usuarios', referencesColumns: ['nombre', 'apellido']}],
    orderBy: ['id_secretario' as ColumnName],
    elementName: 'secretario'
  },
  {
    name: 'dicta',
    columns: [
      { name: 'legajo' as ColumnName, type: 'int' },
      { name: 'id_materia' as ColumnName, type: 'int' },
    ],
    pk: ['legajo' as ColumnName, 'id_materia' as ColumnName],
    fks: [
      { column: 'legajo', referencedColumn: 'legajo', referencesTable: 'profesores', referencesColumns: ['legajo', 'id_usuario']},
      { column: 'id_materia', referencedColumn: 'id', referencesTable: 'materias', referencesColumns: ['nombre_materia']}],
    orderBy: ['legajo' as ColumnName],
    elementName: 'dicta'
  }
];


export function completeTableDefaults(tableDef:TableDef[]): TableDef[]{
    return tableDef.map( t => {
        return {
            ...t,
            title: t.title ?? t.name,
            elementName: t.elementName ?? 'registro de ' + t.name,
            orderBy: t.orderBy ?? t.pk,
            columns: t.columns.map(c => {
                return {
                    // title: c.title ?? c.name,
                    ...c,
                    title: c.title ?? c.name,
                    description: c.description ?? ''
                }
            })
        }
    })
}

export const tableDefs = completeTableDefaults(tableDefinitions)