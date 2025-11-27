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
    if (table.name === "usuarios" || table.name === "dicta") {
      continue;
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

  // 1. Generamos el HTML de los inputs del formulario basados en las columnas
  const formFieldsHtml = tableDef.columns.map(col => {
      // Nota: Aquí podrías agregar lógica para no mostrar IDs autoincrementales si tuvieras esa metadata
      return `
    <div>
      <label>${col.title || col.name}</label>
      <input id="alta-${col.name}" placeholder="${col.title || col.name}" />
    </div>`;
  }).join('');

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

    /* ESTILOS TABLA */
    .table-wrapper {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-top: 20px;
      margin-bottom: 20px; /* Espacio debajo de la tabla */
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

    /* INPUTS & BOTONES */
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
      margin-right: 5px;
    }

    .btn-edit { background-color: #FFB74D; color: white; }
    .btn-edit:hover { background-color: #F57C00; }

    .btn-del { background-color: #E57373; color: white; }
    .btn-del:hover { background-color: #D32F2F; }

    .btn-add { background-color: #66BB6A; color: white; }
    .btn-add:hover { background-color: #388E3C; }

    .btn-cancel { background-color: #ccc; color: #333; }
    .btn-cancel:hover { background-color: #bbb; }

    /* ESTILOS DEL FORMULARIO DE ALTA */
    .actions-bar {
        margin-bottom: 15px;
        margin-top: 15px; /* Agregado para separar de la tabla */
    }

    #form-alta {
        display: none; /* Oculto por defecto */
        background: white;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        max-width: 500px;
        margin-bottom: 25px;
        border-left: 5px solid #2E7D32;
    }

    #form-alta h3 {
        margin-top: 0;
        color: #2E7D32;
        margin-bottom: 20px;
    }

    #form-alta div {
        margin-bottom: 15px;
    }

    #form-alta label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        color: #555;
        font-size: 0.9em;
    }

    #form-alta-buttons {
        display: flex;
        gap: 10px;
        margin-top: 25px;
        justify-content: flex-end;
    }
  </style>
</head>
<body onload="cargarTabla()">
  <h2>${tableDef.title}</h2>

  <!-- TABLA DE DATOS (Ahora va primero) -->
  <div class="table-wrapper">
    <table id="tabla-generica">
      <thead>
        <tr id="thead-row"></tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <!-- BOTÓN AGREGAR (Ahora va debajo) -->
  <div class="actions-bar">
    <button id="btn-toggle-form" class="action-btn btn-add" onclick="toggleFormularioAlta()">
      Agregar registro
    </button>
  </div>

  <!-- FORMULARIO DE ALTA (CARD) -->
  <div id="form-alta">
    <h3>Nuevo registro</h3>
    <!-- CAMPOS GENERADOS DINÁMICAMENTE -->
    ${formFieldsHtml}

    <div id="form-alta-buttons">
      <button class="action-btn btn-cancel" onclick="toggleFormularioAlta()">Cancelar</button>
      <button class="action-btn btn-add" onclick="crearRegistro()">Crear</button>
    </div>
  </div>

  <script>
    const tableDef = ${tableJson};
    const displayColumns = ${displayColumnsJson};
    const pkValueFields = ${pkValueFieldsJson};
    const API_BASE = "/api/v0/" + tableDef.name;

    let editandoPk = null;

    function buildPkPath(row) {
      return pkValueFields
        .map(function (f) { return encodeURIComponent(row[f]); })
        .join("/");
    }

    async function cargarTabla() {
      try {
        // Lógica de Rol (simplificada para este ejemplo, asume backend maneja seguridad o view ya tiene filtro)
        const resp_rol = await fetch('/api/v0/roles/get');
        if (!resp_rol.ok) return;
        const data_rol = await resp_rol.json();

        let urlApi = API_BASE;

        // Filtros de rol básicos (manteniendo tu lógica existente)
        if(data_rol.nombreRol === "alumno"){
          const paramsURL = new URLSearchParams(window.location.search);
          const luAlumno = paramsURL.get('lu');
          if (luAlumno) urlApi += "?lu=" + encodeURIComponent(luAlumno);
        }
        if(data_rol.nombreRol === "profesor"){
          const paramsURL = new URLSearchParams(window.location.search);
          const legajo = paramsURL.get('legajo');
          if (legajo) urlApi += "?legajo=" + encodeURIComponent(legajo);
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
          tr.dataset.row = JSON.stringify(row);

          displayColumns.forEach(function (col) {
            const td = document.createElement("td");
            td.textContent = row[col.field] ?? "";
            tr.appendChild(td);
          });

          const tdAcc = document.createElement("td");

          const btnEdit = document.createElement("button");
          btnEdit.textContent = "Editar";
          btnEdit.className = "action-btn btn-edit";
          btnEdit.onclick = function () { confirmarEditar(pkPath); };
          tdAcc.appendChild(btnEdit);

          const btnDel = document.createElement("button");
          btnDel.textContent = "Eliminar";
          btnDel.className = "action-btn btn-del";
          btnDel.onclick = function () { eliminarRegistro(pkPath); };
          tdAcc.appendChild(btnDel);

          tr.appendChild(tdAcc);
          tbody.appendChild(tr);
        });

        // NOTA: Ya NO llamamos a agregarFilaAlta(tbody) aquí.

      } catch (e) {
        console.error("Fallo al cargar tabla:", e);
      }
    }

    // --- NUEVA LÓGICA DE FORMULARIO ---

    function toggleFormularioAlta() {
        const f = document.getElementById("form-alta");
        const btn = document.getElementById("btn-toggle-form");

        if (f.style.display === "none" || f.style.display === "") {
            f.style.display = "block";
            btn.textContent = "Ocultar formulario";
            // Scroll suave hacia el form
            f.scrollIntoView({ behavior: 'smooth' });
        } else {
            f.style.display = "none";
            btn.textContent = "Agregar registro";
        }
    }

    async function crearRegistro() {
      const body = {};

      // Recolectar datos del formulario card
      tableDef.columns.forEach(function (col) {
        const el = document.getElementById("alta-" + col.name);
        if (el) {
            let val = el.value.trim();
            if (val === "") val = null;
            body[col.name] = val;
        }
      });

      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
          alert("Error al crear: " + res.status);
          return;
      }

      // Éxito: Limpiar campos y ocultar form
      tableDef.columns.forEach(function (col) {
         const el = document.getElementById("alta-" + col.name);
         if(el) el.value = "";
      });

      toggleFormularioAlta(); // Cerrar form
      cargarTabla(); // Recargar datos
    }

    async function eliminarRegistro(pkPath) {
      if (!confirm("¿Eliminar registro?")) return;
      const res = await fetch(API_BASE + "/" + pkPath, { method: "DELETE" });
      if (!res.ok) { alert("Error al eliminar: " + res.status); return; }
      cargarTabla();
    }

    async function confirmarEditar(pkPath) {
      const fila = document.querySelector('tr[data-pk="' + pkPath + '"]');
      const pkParts = pkPath.split("/").map(decodeURIComponent);
      const body = {};

      tableDef.pk.forEach(function (pkCol, idx) {
        body[pkCol] = pkParts[idx];
      });

      let rowData = {};
      if (fila && fila.dataset.row) {
        try { rowData = JSON.parse(fila.dataset.row); } catch {}
      }

      tableDef.columns.forEach(function (col) {
        const input = document.getElementById("edit-" + col.name);
        if (input) {
          let val = input.value.trim();
          if (val === "") val = null;
          body[col.name] = val;
        } else {
          body[col.name] = rowData[col.name];
        }
      });

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

export default generarPlantillasHTML;