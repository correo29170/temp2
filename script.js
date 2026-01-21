document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('table-body');
    const fileInput = document.getElementById('file-input');
    const searchInput = document.getElementById('search-input');
    const resetButton = document.getElementById('reset-button');
    const tableHeaders = document.querySelectorAll('thead th');
    
    // Elementos de totales
    const totalNetoEl = document.getElementById('total-neto');
    const totalIvaEl = document.getElementById('total-iva');
    const totalTotalEl = document.getElementById('total-total');

    // Constante para el botón de exportar (Debes tener el ID "export-button" en tu HTML)
    const exportButton = document.getElementById('export-button'); 
    
    let allData = []; // Datos originales
    let currentData = []; // Datos filtrados/ordenados
    let sortDirection = 'asc';

    // Carga de Archivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                allData = parseCSV(event.target.result);
                currentData = [...allData];
                renderTable(currentData);
                searchInput.value = '';
            };
            reader.readAsText(file, 'ISO-8859-1');
        }
    });

    // Resetear Tabla
    resetButton.addEventListener('click', () => {
        currentData = [...allData];
        searchInput.value = '';
        tableHeaders.forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
        renderTable(currentData);
    });

    // Evento para el botón de Exportar
    if (exportButton) { 
        exportButton.addEventListener('click', () => {
            exportTableToCSV(currentData);
        });
    }

    // Buscador Dinámico
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        currentData = allData.filter(row => 
            row.some(cell => cell.toString().toLowerCase().includes(term))
        );
        renderTable(currentData);
    });

    // Ordenamiento por Columnas
    tableHeaders.forEach((header, index) => {
        header.addEventListener('click', () => {
            sortDirection = (header.classList.contains('sorted-asc')) ? 'desc' : 'asc';
            
            tableHeaders.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
            header.classList.add(sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');

            currentData.sort((a, b) => {
                const valA = (a[index] || '').replace(/\./g, '').replace(',', '.');
                const valB = (b[index] || '').replace(/\./g, '').replace(',', '.');
                
                if (!isNaN(valA) && !isNaN(valB) && valA !== "" && valB !== "") {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                }
                return sortDirection === 'asc' ? 
                    a[index].localeCompare(b[index]) : b[index].localeCompare(a[index]);
            });
            renderTable(currentData);
        });
    });

    // Función de exportación a CSV (Excel)
    function exportTableToCSV(data) {
        if (data.length === 0) {
            alert("No hay datos para exportar.");
            return;
        }

        const headers = Array.from(document.querySelectorAll('thead th')).map(th => th.textContent);
        let csvContent = headers.join(';') + '\n';

        data.forEach(row => {
            let rowString = row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(';');
            csvContent += rowString + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=ISO-8859-1;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'RegistroDeDocumentos.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function parseCSV(text) {
        const lines = text.trim().split(/\r?\n/);
        const start = (lines[0].toLowerCase().includes('rut') || lines[0].toLowerCase().includes('monto')) ? 1 : 0;
        
        return lines.slice(start).map(line => 
            line.split(';').map(cell => cell.replace(/"/g, '').trim())
        );
    }

    function renderTable(data) {
        tableBody.innerHTML = '';
        data.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
        calculateTotals(data);
    }

    function calculateTotals(data) {
        const clean = (val) => {
            if (!val) return 0;
            let n = val.toString().replace(/\./g, '').replace(',', '.').replace(/[^-0-9.]/g, '');
            return parseFloat(n) || 0;
        };

        let neto = 0, iva = 0, total = 0;

        data.forEach(row => {
            neto += clean(row[10]);
            iva += clean(row[11]);
            total += clean(row[14]);
        });

        const fmt = new Intl.NumberFormat('es-CL');
        totalNetoEl.textContent = fmt.format(neto);
        totalIvaEl.textContent = fmt.format(iva);
        totalTotalEl.textContent = fmt.format(total);
    }
    
    // *** FUNCIONALIDAD DE REDIMENSIÓN DE COLUMNAS (Añadida al final) ***

    function initializeColumnResizing() {
        const headers = document.querySelectorAll('thead th');
        headers.forEach(th => {
            const resizer = document.createElement('div');
            resizer.classList.add('resizer');
            th.appendChild(resizer);
            resizer.addEventListener('mousedown', mouseDownHandler);
        });
    }

    let thMinX = 0, thBeingResized;

    function mouseDownHandler(e) {
        thBeingResized = e.target.parentNode;
        thMinX = thBeingResized.offsetWidth - e.clientX;
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    function mouseMoveHandler(e) {
        const newWidth = e.clientX + thMinX;
        thBeingResized.style.width = `${newWidth}px`;
    }

    function mouseUpHandler() {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }

    // Inicializa los resizers cuando la página carga
    initializeColumnResizing();
});
