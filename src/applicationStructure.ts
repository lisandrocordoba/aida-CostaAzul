export type TableName =
  | 'materiasEnCarrera'
  | 'alumnos'
  | 'cursadas'
  | 'carreras'
  | 'materias'
  | 'usuarios';

export type ColumnName =
  // materiasEnCarrera
  | 'carrera_id'
  | 'materia_id'
  // alumnos
  | 'lu'
  | 'apellido'
  | 'nombres'
  | 'id_carrera'
  | 'titulo_en_tramite'
  | 'egreso'
  // cursadas
  | 'alumno_lu'
  | 'materia_id'
  | 'anio'
  | 'cuatrimestre'
  | 'nota'
  // carreras
  | 'id'
  | 'nombre'
  // materias
  | 'id'
  | 'nombre'
  // usuarios
  | 'id'
  | 'username'
  | 'password_hash'
  | 'nombre'
  | 'email'
  | 'activo';

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
      { name: 'carrera_id' as ColumnName, type: 'int', title: 'Id. Carrera' },
      { name: 'materia_id' as ColumnName, type: 'int', title: 'Id. Materia' },
    ],
    pk: ['carrera_id' as ColumnName, 'materia_id' as ColumnName],
    fks: [],
    elementName: 'materiaEnCarrera'
  },
  {
    name: 'alumnos',
    columns: [
      { name: 'lu' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'apellido' as ColumnName, type: 'text', title: 'Apellido'},
      { name: 'nombres' as ColumnName, type: 'text', title: 'Nombre' },     // CUANDO LO PASEMOS A USUARIO SACARLE LA "s"
      { name: 'id_carrera' as ColumnName, type: 'int', title: 'Carrera' },
      { name: 'titulo_en_tramite' as ColumnName, type: 'date', title: 'Título en Trámite' },
      { name: 'egreso' as ColumnName, type: 'date', title: 'Fecha Egreso' },
    ],
    pk: ['lu' as ColumnName],
    fks: [{ column: 'id_carrera', referencedColumn: 'id', referencesTable: 'carreras', referencesColumns: ['nombre'] }],
    orderBy: ['apellido' as ColumnName, 'nombres' as ColumnName],
    elementName: 'alumno'
  },
  {
    name: 'cursadas',
    columns: [
      { name: 'alumno_lu' as ColumnName, type: 'text', title: 'L.U' },
      { name: 'materia_id' as ColumnName, type: 'int', title: 'Materia' },
      { name: 'anio' as ColumnName, type: 'int', title: 'Año' },
      { name: 'cuatrimestre' as ColumnName, type: 'int', title: 'Cuatrimestre' },
      { name: 'nota' as ColumnName, type: 'int',title: 'Nota' },
    ],
    pk: ['alumno_lu' as ColumnName, 'materia_id' as ColumnName, 'anio' as ColumnName, 'cuatrimestre' as ColumnName],
    fks: [
      { column: 'alumno_lu', referencedColumn: 'lu', referencesTable: 'alumnos', referencesColumns: ['lu', 'nombres', 'apellido'] },
      { column: 'materia_id', referencedColumn: 'id', referencesTable: 'materias', referencesColumns: ['nombre'] }
    ],
    orderBy: ['anio' as ColumnName, 'cuatrimestre' as ColumnName],
    elementName: 'cursada'
  },
  {
    name: 'carreras',
    columns: [
      { name: 'id' as ColumnName, type: 'int' },
      { name: 'nombre' as ColumnName, type: 'text' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['nombre' as ColumnName],
    elementName: 'carrera'
  },
  {
    name: 'materias',
    columns: [
      { name: 'id' as ColumnName, type: 'int' },
      { name: 'nombre' as ColumnName, type: 'text' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['nombre' as ColumnName],
    elementName: 'materia'
  },
  {
    name: 'usuarios',
    columns: [
      { name: 'id' as ColumnName, type: 'int' }, // 'serial' se maneja como 'int'
      { name: 'username' as ColumnName, type: 'text' },
      { name: 'password_hash' as ColumnName, type: 'text' },
      { name: 'nombre' as ColumnName, type: 'text' },
      { name: 'email' as ColumnName, type: 'text' },
      { name: 'activo' as ColumnName, type: 'boolean' },
    ],
    pk: ['id' as ColumnName],
    fks: [],
    orderBy: ['username' as ColumnName],
    elementName: 'usuario'
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