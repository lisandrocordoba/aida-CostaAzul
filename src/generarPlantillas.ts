import fs from "fs";
import path from "path";
import { tableDefs, TableDef, ForeignKeyDef } from "./applicationStructure.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   TIPOS INTERNOS
   ============================================================ */

interface DisplayColumn {
  field: string;       // nombre del campo que viene en el JSON
  title: string;       // título a mostrar
  editField: string | null; // nombre real de columna a editar (o null si no editable)
}

interface ExpandedFk {
  field: string;
  sourceColumn: string;
}

/* ============================================================
   RESOLVER FK RECURSIVO
   ============================================================ */

function expandFkRecursively(
  fk: ForeignKeyDef,
  allTables: TableDef[]
): ExpandedFk[] {
  const result: ExpandedFk[] = [];

  for (const col of fk.referencesColumns) {
    result.push({ field: col, sourceColumn: fk.column });

    const refTable = allTables.find(t => t.name === fk.referencesTable);
    if (!refTable) continue;

    const innerFk = refTable.fks.find(f => f.column === col);
    if (innerFk) {
      result.push(...expandFkRecursively(innerFk, allTables));
    }
  }

  return result;
}

/* ============================================================
   GENERAR TODAS LAS PLANTILLAS
   ============================================================ */

export function generarPlantillasHTML(): void {
  const viewsDir = path.join(__dirname, "..", "views");

  if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir, { recursive: true });
  }

  for (const table of tableDefs) {
    const filePath = path.join(
      viewsDir,
      `plantilla-tabla-${table.name}.html`
    );

    const html = buildTableHtml(table);

    fs.writeFileSync(filePath, html, "utf8");
    console.log("✔ Generada:", filePath);
  }
}

/* ============================================================
   GENERAR HTML SEGÚN TABLA
   ============================================================ */

function buildTableHtml(tableDef: TableDef): string {
  const allTables = tableDefs;
  const displayColumns: DisplayColumn[] = [];

  for (const col of tableDef.columns) {
    const fk = tableDef.fks.find(f => f.column === col.name);

    if (!fk) {
      displayColumns.push({
        field: col.name,
        title: col.title ?? col.name,
        editField: col.name
      });
      continue;
    }

    const expanded = expandFkRecursively(fk, allTables);

    expanded.forEach((exp, index) => {
      displayColumns.push({
        field: exp.field,
        title: index === 0 ? col.title ?? col.name : exp.field,
        editField: index === 0 ? col.name : null
      });
    });
  }

  // PK para armar la URL o buscar la fila correcta
const pkValueFields: string[] = tableDef.pk.map(pk => {
  const fk = tableDef.fks.find(f => f.column === pk);
  const val = fk?.referencesColumns?.[0];
  return val ?? pk;
});


  const displayColumnsJson = JSON.stringify(displayColumns);
  const pkValueFieldsJson = JSON.stringify(pkValueFields);
  const tableJson = JSON.stringify(tableDef);

  /* ============================================================
     ATENCIÓN: para evitar error TS con ${pkPath} dentro del HTML,
     usamos ${"\\${pkPath}"} → esto evita que TypeScript lo interprete.
     ============================================================ */

  const PK_VAR = "\\${pkPath}";
  const PK_VAR2 = "\\${pkPath}";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${tableDef.title}</title>

  <style>
    body { font-family: Arial; margin: 30px; background: #fafafa; }
    table { border-collapse: collapse; width: 100%; background: white; }
    th, td { border: 1px solid #ccc; padding: 8px; }
    th { background: #4CAF50; color: white; }
    input { width: 100%; }
    button { padding: 5px 10px; }
  </style>
</head>

<body onload="cargarTabla()">
  <h2>${tableDef.title}</h2>

  <table id="tabla-generica">
    <thead><tr id="thead-row"></tr></thead>
    <tbody></tbody>
  </table>

<script>

const tableDef = ${tableJson};
const displayColumns = ${displayColumnsJson};
const pkValueFields = ${pkValueFieldsJson};
const API_BASE = "/api/v0/" + tableDef.name;

let editandoPk = null;

function buildPkPath(row){
  return pkValueFields.map(f => encodeURIComponent(row[f])).join("/");
}

async function cargarTabla(){
  const res = await fetch(API_BASE);
  const data = await res.json();

  const thead = document.getElementById("thead-row");
  const tbody = document.querySelector("#tabla-generica tbody");

  thead.innerHTML = "";
  displayColumns.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c.title;
    thead.appendChild(th);
  });

  const thAcc = document.createElement("th");
  thAcc.textContent = "Acción";
  thead.appendChild(thAcc);

  tbody.innerHTML = "";

  data.forEach(row => {
    const tr = document.createElement("tr");
    const pkPath = buildPkPath(row);
    tr.dataset.pk = pkPath;
    tr.dataset.row = JSON.stringify(row);

    displayColumns.forEach(c => {
      const td = document.createElement("td");
      td.textContent = row[c.field] ?? "";
      tr.appendChild(td);
    });

    const tdAcc = document.createElement("td");
    tdAcc.innerHTML =
      "<button onclick=\\"editar('${PK_VAR}')\\">Editar</button>" +
      "<button onclick=\\"eliminarRegistro('${PK_VAR2}')\\">Eliminar</button>";

    tr.appendChild(tdAcc);
    tbody.appendChild(tr);
  });

  agregarFilaAlta(tbody);
}

function agregarFilaAlta(tbody){
  const tr = document.createElement("tr");

  tableDef.columns.forEach(c => {
    const td = document.createElement("td");
    const i = document.createElement("input");
    i.id = "new-" + c.name;
    td.appendChild(i);
    tr.appendChild(td);
  });

  const tdAcc = document.createElement("td");
  const b = document.createElement("button");
  b.textContent = "Agregar";
  b.onclick = crearRegistro;
  tdAcc.appendChild(b);

  tr.appendChild(tdAcc);
  tbody.appendChild(tr);
}

async function crearRegistro(){
  const body = {};
  tableDef.columns.forEach(c => {
    const i = document.getElementById("new-" + c.name);
    body[c.name] = i.value || null;
  });

  await fetch(API_BASE, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });

  cargarTabla();
}

async function eliminarRegistro(pkPath){
  await fetch(API_BASE + "/" + pkPath, { method:"DELETE" });
  cargarTabla();
}

function editar(pkPath){
  if (editandoPk) return;
  editandoPk = pkPath;

  const fila = document.querySelector("tr[data-pk='" + pkPath + "']");
  const rowData = JSON.parse(fila.dataset.row);
  const tds = fila.querySelectorAll("td");

  const editableSet = new Set(tableDef.columns.map(c => c.name));
  const pkSet = new Set(tableDef.pk);

  for (let i=0; i<tds.length-1; i++){
    const col = displayColumns[i];
    const real = col.editField;
    if (!real) continue;
    if (!editableSet.has(real)) continue;

    const td = tds[i];
    const val = rowData[real] ?? "";

    td.innerHTML = "";
    const input = document.createElement("input");
    input.id = "edit-" + real;
    input.value = val;

    if (pkSet.has(real)) input.disabled = true;

    td.appendChild(input);
  }

  const tdAcc = tds[tds.length-1];
  tdAcc.innerHTML =
    "<button onclick=\\"confirmarEditar('${PK_VAR}')\\">Confirmar</button>" +
    "<button onclick=\\"cancelarEditar()\\">Cancelar</button>";
}

async function confirmarEditar(pkPath){
  const fila = document.querySelector("tr[data-pk='" + pkPath + "']");
  const rowData = JSON.parse(fila.dataset.row);

  const body = { ...rowData };

  const pkParts = pkPath.split("/").map(decodeURIComponent);
  tableDef.pk.forEach((pk, i) => body[pk] = pkParts[i]);

  tableDef.columns.forEach(c => {
    const input = document.getElementById("edit-" + c.name);
    if (!input) return;
    body[c.name] = input.value || null;
  });

  await fetch(API_BASE + "/" + pkPath, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  editandoPk = null;
  cargarTabla();
}

function cancelarEditar(){
  editandoPk = null;
  cargarTabla();
}

</script>
</body>
</html>
`;
}



//function toTitle(name) {
//  return name.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
//}

export default generarPlantillasHTML;
