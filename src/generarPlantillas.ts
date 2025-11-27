import fs from "fs";
import path from "path";
import { ColumnName, ColumnDef, TableDef, tableDefs } from "./applicationStructure.js";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export function generarPlantillasHTML() {
  const recursosDir = path.join(__dirname, "..", "views");

  if (!fs.existsSync(recursosDir)) {
    fs.mkdirSync(recursosDir, { recursive: true });
  }

  for (const table of tableDefs) {
    if (table.name === "usuarios") {
      continue; // saltar tabla usuarios
    }
    const filePath = path.join(recursosDir, `plantilla-tabla-${table.name}.html`);
    const html = buildTableHtml(table);
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`✔ Plantilla generada: plantilla-tabla-${table.name}.html`);
  }
}

interface displayColumn {
    field: ColumnName;
    title: string;
    editField: string | null
}

//hacer un map de las columns
function toDisplayColumns(column: ColumnDef, table: TableDef): displayColumn[] {
    const fk = table.fks?.find(fk => fk.column === column.name);
    if(fk){
        return  [
                ...fk.referencesColumns.map((refCol: ColumnName) => {
                        const refTable = tableDefs.find(tableDef => tableDef.name === fk.referencesTable);
                        const refColumnDef = refTable?.columns.find(colDef => colDef.name === refCol);
                        return toDisplayColumns(refColumnDef!, refTable!);
                    }).flat()
                ];
    } else {
        return [{field: column.name, title: column.title!, editField: column.name}];
    }
}

function buildTableHtml(tableDef: TableDef): string {

  const displayColumns = tableDef.columns.map((c: any) => toDisplayColumns(c, tableDef)).flat();

  const pkValueFields: string[] = tableDef.pk.slice();

  const displayColumnsJson = JSON.stringify(displayColumns);
  const pkValueFieldsJson = JSON.stringify(pkValueFields);
  const tableJson = JSON.stringify(tableDef);

  return /*html*/ `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${tableDef.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&family=Merriweather:wght@700&display=swap');

    body {
      font-family: 'Roboto', sans-serif;
      margin: 0;
      padding: 30px 20px;
      background-color: #f4f6f8;
      color: #333;
    }

    h2 {
      color: #2E7D32;
      border-bottom: 2px solid #2E7D32;
      padding-bottom: 10px;
      margin-bottom: 25px;
      font-family: 'Merriweather', serif;
    }

    .table-wrapper {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background-color: #4CAF50;
      color: white;
      font-weight: 500;
      text-transform: uppercase;
      font-size: 0.85em;
    }

    tr:nth-child(even) { background-color: #fcfcfc; }
    tr:hover { background-color: #f1f8e9; }

    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-sizing: border-box;
    }

    button.action-btn {
      padding: 6px 12px;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      font-size: 0.9em;
      transition: background 0.2s;
    }

    .btn-edit { background-color: #FFB74D; color: white; margin-right: 5px; }
    .btn-edit:hover { background-color: #F57C00; }

    .btn-del { background-color: #E57373; color: white; }
    .btn-del:hover { background-color: #D32F2F; }

    .btn-add { background-color: #66BB6A; color: white; }
    .btn-add:hover { background-color: #388E3C; }
  </style>
</head>
<body onload="cargarTabla()">
  <h2>${tableDef.title}</h2>

  <div class="table-wrapper">
    <table id="tabla-generica">
      <thead>
        <tr id="thead-row"></tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <script>
    const tableDef = ${tableJson};
    const displayColumns = ${displayColumnsJson};
    const pkValueFields = ${pkValueFieldsJson};
    const API_BASE = "/api/v0/" + tableDef.name;

    // solo puede haber una fila en edición a la vez
    let editandoPk = null;

    function buildPkPath(row) {
      return pkValueFields
        .map(function (f) { return encodeURIComponent(row[f]); })
        .join("/");
    }

    async function cargarTabla() {
      try {
        const resp_rol = await fetch('/api/v0/roles/get');
        if (!resp_rol.ok) return;

        const data_rol = await resp_rol.json();

        let urlApi = API_BASE;

        // Si es alumno, filtrar por su LU
        if(data_rol.nombreRol === "alumno"){

          const paramsURL = new URLSearchParams(window.location.search);
          const luAlumno = paramsURL.get('lu');

          if (luAlumno) {
              urlApi += "?lu=" + encodeURIComponent(luAlumno);
          }
        }

        // Si es profesor, filtrar por su legajo
        if(data_rol.nombreRol === "profesor"){

          const paramsURL = new URLSearchParams(window.location.search);
          const legajo = paramsURL.get('legajo');

          if (legajo) {
              urlApi += "?legajo=" + encodeURIComponent(legajo);
          }
        }

        const res = await fetch(urlApi, { headers: { "Content-Type": "application/json" }});

        if (!res.ok) {
          console.error("Error al cargar:", res.status);
          return;
        }

        const data = await res.json();
        const theadRow = document.getElementById("thead-row");
        const tbody = document.querySelector("#tabla-generica tbody");

        // Encabezados
        theadRow.innerHTML = "";
        displayColumns.forEach(function (col) {
          const th = document.createElement("th");
          th.textContent = col.title;
          theadRow.appendChild(th);
        });
        const thAcc = document.createElement("th");
        thAcc.textContent = "Acción";
        theadRow.appendChild(thAcc);

        // Filas
        tbody.innerHTML = "";
        data.forEach(function (row) {
          const tr = document.createElement("tr");
          const pkPath = buildPkPath(row);
          tr.dataset.pk = pkPath;

          // ⬅️ Guardamos la fila original completa
          tr.dataset.row = JSON.stringify(row);

          displayColumns.forEach(function (col) {
            const td = document.createElement("td");
            td.textContent = row[col.field] ?? "";
            tr.appendChild(td);
          });

          const tdAcc = document.createElement("td");
          const btnEdit = document.createElement("button");
          btnEdit.textContent = "Editar";
          btnEdit.className = "action-btn btn-edit";   // 🎨 solo estilo
          btnEdit.onclick = function () { editar(pkPath); };
          tdAcc.appendChild(btnEdit);

          const btnDel = document.createElement("button");
          btnDel.textContent = "Eliminar";
          btnDel.className = "action-btn btn-del";     // 🎨 solo estilo
          btnDel.onclick = function () { eliminarRegistro(pkPath); };
          tdAcc.appendChild(btnDel);

          tr.appendChild(tdAcc);
          tbody.appendChild(tr);
        });

        agregarFilaAlta(tbody);
      } catch (e) {
        console.error("Fallo al cargar tabla:", e);
      }
    }

    function agregarFilaAlta(tbody) {
      const tr = document.createElement("tr");

      tableDef.columns.forEach(function (col) {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.id = "new-" + col.name;
        input.placeholder = col.title || col.name;
        td.appendChild(input);
        tr.appendChild(td);
      });

      const tdAcc = document.createElement("td");
      const btn = document.createElement("button");
      btn.textContent = "Agregar";
      btn.className = "action-btn btn-add";           // 🎨 solo estilo
      btn.onclick = crearRegistro;
      tdAcc.appendChild(btn);
      tr.appendChild(tdAcc);

      tbody.appendChild(tr);
    }

    async function crearRegistro() {
      const body = {};
      tableDef.columns.forEach(function (col) {
        const el = document.getElementById("new-" + col.name);
        body[col.name] = el.value || null;
      });
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) { alert("Error al crear: " + res.status); return; }
      cargarTabla();
    }

    async function eliminarRegistro(pkPath) {
      if (!confirm("¿Eliminar registro?")) return;
      const res = await fetch(API_BASE + "/" + pkPath, { method: "DELETE" });
      if (!res.ok) { alert("Error al eliminar: " + res.status); return; }
      cargarTabla();
    }

    function editar(pkPath) {
        if (editandoPk) return; // ya hay una fila en edición
        editandoPk = pkPath;

        const fila = document.querySelector('tr[data-pk="' + pkPath + '"]');
        if (!fila) return;

        // Recuperamos la fila original para obtener los valores reales (id_carrera, etc.)
        let rowData = {};
        if (fila.dataset.row) {
            try {
            rowData = JSON.parse(fila.dataset.row);
            } catch (e) {
            rowData = {};
            }
        }

        const tds = fila.querySelectorAll("td");
        const editableFields = tableDef.columns.map(function (c) { return c.name; });
        const pkFieldSet = new Set(tableDef.pk);

        // Todas las celdas menos la última (Acción)
        for (let i = 0; i < tds.length - 1; i++) {
            const td = tds[i];
            const colInfo = displayColumns[i];
            const editField = colInfo.editField; // 👈 columna REAL que se edita (ej: "id_carrera")

            // Si esta columna no es editable (editField null), la dejamos como está
            if (!editField) continue;

            // Solo editamos columnas reales de la tabla
            if (!editableFields.includes(editField)) continue;

            // Valor actual: preferimos el dato real de la fila (rowData),
            // si no está usamos el texto de la celda
            const valorActual =
            (rowData && Object.prototype.hasOwnProperty.call(rowData, editField))
                ? (rowData[editField] ?? "")
                : td.textContent.trim();

            td.innerHTML = "";

            const input = document.createElement("input");
            input.id = "edit-" + editField;
            input.value = valorActual ?? "";

            // Si es parte de la PK, no editable
            if (pkFieldSet.has(editField)) input.disabled = true;

            td.appendChild(input);
        }

        // Reemplazamos la celda de acción por Confirmar / Cancelar
        const tdAcc = tds[tds.length - 1];
        tdAcc.innerHTML = "";
        const bConfirm = document.createElement("button");
        bConfirm.textContent = "Confirmar";
        bConfirm.onclick = function () { confirmarEditar(pkPath); };
        tdAcc.appendChild(bConfirm);

        const bCancel = document.createElement("button");
        bCancel.textContent = "Cancelar";
        bCancel.onclick = cancelarEditar;
        tdAcc.appendChild(bCancel);
    }

    async function confirmarEditar(pkPath) {
      const fila = document.querySelector('tr[data-pk="' + pkPath + '"]');

      // leer PK desde la URL
      const pkParts = pkPath.split("/").map(decodeURIComponent);

      // armamos body SOLO con las columnas reales del tableDef
      const body = {};

      // 1) Las PK siempre se preservan
      tableDef.pk.forEach(function (pkCol, idx) {
        body[pkCol] = pkParts[idx];
      });

      // 2) Para el resto de columnas reales, si tienen input usamos el valor, sino dejamos el original del rowData
      let rowData = {};
      if (fila && fila.dataset.row) {
        try { rowData = JSON.parse(fila.dataset.row); } catch {}
      }

      tableDef.columns.forEach(function (col) {
        const input = document.getElementById("edit-" + col.name);

        if (input) {
          // EDITABLE
          let val = input.value.trim();
          if (val === "") val = null;
          body[col.name] = val;
        } else {
          // NO EDITABLE → tomamos valor original REAL
          body[col.name] = rowData[col.name];
        }
      });

      // 3) Enviar PUT limpio
      try {
        const res = await fetch(API_BASE + "/" + pkPath, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error("Error al actualizar: " + res.status);

        editandoPk = null;
        cargarTabla();
      } catch (e) {
        alert("No se pudo actualizar: " + e.message);
      }
    }

    function cancelarEditar() {
      editandoPk = null;
      cargarTabla();
    }
  </script>

</body>
</html>`;
}




export default generarPlantillasHTML