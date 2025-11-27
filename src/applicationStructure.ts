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
  | 'id_carrera_MEC'
  | 'id_materia_MEC'
  // alumnos
  | 'lu'
  | 'id_usuario_ALU'
  | 'id_carrera_ALU'
  | 'titulo_en_tramite'
  | 'egreso'
  // cursadas
  | 'lu_CURS'
  | 'id_materia_CURS'
  | 'anio'
  | 'cuatrimestre'
  | 'nota'
  // carreras
  | 'id_carrera'
  | 'nombre_carrera'
  // materias
  | 'id_materia'
  | 'nombre_materia'
  // usuarios
  | 'id_usuario'
  | 'username'
  | 'password_hash'
  | 'nombre_usuario'
  | 'apellido'
  | 'email'
  | 'activo'
  // profesores
  | 'legajo'
  | 'id_usuario_PROF'
  // secretario
  | 'id_secretario'
  | 'id_usuario_SEC'
  //dicta
  | 'legajo_DICTA'
  | 'id_materia_DICTA';

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
      { name: 'id_carrera_MEC' as ColumnName, type: 'int', title: 'Id. Carrera' },
      { name: 'id_materia_MEC' as ColumnName, type: 'int', title: 'Id. Materia' },
    ],
    pk: ['id_carrera_MEC' as ColumnName, 'id_materia_MEC' as ColumnName],
    fks: [],  // SON FKS PERO NUNCA LAS USAMOS
    elementName: 'materiaEnCarrera'
  },
  {
    name: 'alumnos',
    columns: [
      { name: 'lu' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'id_usuario_ALU' as ColumnName, type: 'int', title: 'Nombre'},   // agrego title NOMBRE porque sino el HTML muestra "id_usuario" en la columna donde pone los nombres.
      { name: 'id_carrera_ALU' as ColumnName, type: 'int', title: 'Carrera' },
      { name: 'titulo_en_tramite' as ColumnName, type: 'date', title: 'Título en Trámite' },
      { name: 'egreso' as ColumnName, type: 'date', title: 'Fecha Egreso' },
    ],
    pk: ['lu' as ColumnName],
    fks: [
      { column: 'id_usuario_ALU', referencedColumn: 'id_usuario', referencesTable: 'usuarios', referencesColumns: ['nombre_usuario', 'apellido']},
      { column: 'id_carrera_ALU', referencedColumn: 'id_carrera', referencesTable: 'carreras', referencesColumns: ['nombre_carrera'] }
    ],
    orderBy: ['apellido' as ColumnName, 'nombre_usuario' as ColumnName],
    elementName: 'alumno'
  },
  {
    name: 'cursadas',
    columns: [
      { name: 'lu_CURS' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'id_materia_CURS' as ColumnName, type: 'int', title: 'Materia' },
      { name: 'anio' as ColumnName, type: 'int', title: 'Año' },
      { name: 'cuatrimestre' as ColumnName, type: 'int', title: 'Cuatrimestre' },
      { name: 'nota' as ColumnName, type: 'int',title: 'Nota' },
    ],
    pk: ['lu_CURS' as ColumnName, 'id_materia_CURS' as ColumnName, 'anio' as ColumnName, 'cuatrimestre' as ColumnName],
    fks: [
      { column: 'lu_CURS', referencedColumn: 'lu', referencesTable: 'alumnos', referencesColumns: ['lu', 'id_usuario_ALU']}, //nombre', 'apellido'] },
      { column: 'id_materia_CURS', referencedColumn: 'id_materia', referencesTable: 'materias', referencesColumns: ['nombre_materia'] }
    ],
    orderBy: ['anio' as ColumnName, 'cuatrimestre' as ColumnName],
    elementName: 'cursada'
  },
  {
    name: 'carreras',
    columns: [
      { name: 'id_carrera' as ColumnName, type: 'int' },
      { name: 'nombre_carrera' as ColumnName, type: 'text' },
    ],
    pk: ['id_carrera' as ColumnName],
    fks: [],
    orderBy: ['nombre_carrera' as ColumnName],
    elementName: 'carrera'
  },
  {
    name: 'materias',
    columns: [
      { name: 'id_materia' as ColumnName, type: 'int' },
      { name: 'nombre_materia' as ColumnName, type: 'text', title: 'Materia' },
    ],
    pk: ['id_materia' as ColumnName],
    fks: [],
    orderBy: ['nombre_materia' as ColumnName],
    elementName: 'materia'
  },
  {
    name: 'usuarios',
    columns: [
      { name: 'id_usuario' as ColumnName, type: 'int' }, // 'serial' se maneja como 'int'
      { name: 'username' as ColumnName, type: 'text' },
      { name: 'password_hash' as ColumnName, type: 'text' },
      { name: 'nombre_usuario' as ColumnName, type: 'text', title: 'Nombre' },
      { name: 'apellido' as ColumnName, type: 'text', title: 'Apellido' },
      { name: 'email' as ColumnName, type: 'text' },
      { name: 'activo' as ColumnName, type: 'boolean' },
    ],
    pk: ['id_usuario' as ColumnName],
    fks: [],
    orderBy: ['apellido' as ColumnName, 'nombre_usuario' as ColumnName],
    elementName: 'usuario'
  },
  {
    name: 'profesores',
    columns: [
      { name: 'legajo' as ColumnName, type: 'int' },
      { name: 'id_usuario_PROF' as ColumnName, type: 'int' },
    ],
    pk: ['legajo' as ColumnName],
    fks: [{ column: 'id_usuario_PROF', referencedColumn: 'id_usuario', referencesTable: 'usuarios', referencesColumns: ['nombre_usuario', 'apellido']}],
    orderBy: ['apellido' as ColumnName, 'nombre_usuario' as ColumnName],
    elementName: 'profesor'
  },
  {
    name: 'secretario',
    columns: [
      { name: 'id_secretario' as ColumnName, type: 'int' },
      { name: 'id_usuario_SEC' as ColumnName, type: 'int' },
    ],
    pk: ['id_secretario' as ColumnName],
    fks: [{ column: 'id_usuario_SEC', referencedColumn: 'id_usuario', referencesTable: 'usuarios', referencesColumns: ['nombre_usuario', 'apellido']}],
    orderBy: ['id_secretario' as ColumnName],
    elementName: 'secretario'
  },
  {
    name: 'dicta',
    columns: [
      { name: 'legajo_DICTA' as ColumnName, type: 'int' },
      { name: 'id_materia_DICTA' as ColumnName, type: 'int' },
    ],
    pk: ['legajo_DICTA' as ColumnName, 'id_materia_DICTA' as ColumnName],
    fks: [
      { column: 'legajo_DICTA', referencedColumn: 'legajo', referencesTable: 'profesores', referencesColumns: ['legajo', 'id_usuario_PROF']},
      { column: 'id_materia_DICTA', referencedColumn: 'id_materia', referencesTable: 'materias', referencesColumns: ['nombre_materia']}],
    orderBy: ['legajo_DICTA' as ColumnName],
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