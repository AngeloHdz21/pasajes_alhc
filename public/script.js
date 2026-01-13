const API_URL = '/api/pasajes';
let listaPasajes = []; 

async function cargarPasajes() {
    try {
        const res = await fetch(API_URL);
        listaPasajes = await res.json(); 
        
        const tbody = document.getElementById('tablaPasajes');
        tbody.innerHTML = ''; 

        listaPasajes.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.ID_PASAJE}</td>
                    <td>${p.FECHA || 'Reciente'}</td>
                    <td>${p.NOMBRE_RUTA}</td>
                    <td>Unidad ${p.NUMERO_UNIDAD}</td>
                    <td>${p.NOMBRE_CLIENTE}</td>
                    <td>${p.NOMBRE_TIPO}</td>
                    <td>$${p.VALOR_FINAL.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-2" onclick="prepararEdicion(${p.ID_PASAJE})">✏️</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarPasaje(${p.ID_PASAJE})">🗑️</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error cargando pasajes:', error);
    }
}

document.getElementById('formPasaje').addEventListener('submit', async (e) => {
    e.preventDefault();

    const idPasaje = document.getElementById('id_pasaje').value; 
    
    const datos = {
        id_ruta: document.getElementById('id_ruta').value,
        id_unidad: document.getElementById('id_unidad').value,
        id_tipo: document.getElementById('id_tipo').value,
        cedula: document.getElementById('cedula').value,
        nombre: document.getElementById('nombre').value,
        asiento: document.getElementById('asiento').value,
        valor: document.getElementById('valor').value,
        fecha_viaje: document.getElementById('fecha_viaje').value 
    };

    try {
        let res;
        
        if (idPasaje) {
            res = await fetch(`${API_URL}/${idPasaje}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        } else {
            res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
        }

        if (res.ok) {
            alert(idPasaje ? '✅ Pasaje actualizado' : '✅ Pasaje vendido');
            resetFormulario(); 
            cargarPasajes();   
        } else {
            const errorText = await res.text();
            alert('❌ Error al guardar: ' + errorText);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
});

function prepararEdicion(id) {
    const pasaje = listaPasajes.find(p => p.ID_PASAJE == id);
    if (!pasaje) return;

    document.getElementById('id_pasaje').value = pasaje.ID_PASAJE;
    document.getElementById('id_ruta').value = pasaje.ID_RUTA || "";
    document.getElementById('id_unidad').value = pasaje.ID_UNIDAD || "";
    document.getElementById('id_tipo').value = pasaje.ID_TIPO || "";
    document.getElementById('cedula').value = pasaje.CEDULA_CLIENTE || '';
    document.getElementById('nombre').value = pasaje.NOMBRE_CLIENTE;
    document.getElementById('asiento').value = pasaje.NUMERO_ASIENTO || 0; 

    if (pasaje.FECHA) {
        document.getElementById('fecha_viaje').value = pasaje.FECHA.replace(' ', 'T');
    }

    calcularPrecio();
    if(pasaje.VALOR_FINAL) {
         document.getElementById('valor').value = pasaje.VALOR_FINAL.toFixed(2);
    }

    document.getElementById('tituloFormulario').innerText = `✏️ Editando Pasaje #${id}`;
    document.getElementById('btnGuardar').innerText = '🔄 Actualizar';
    document.getElementById('btnGuardar').classList.replace('btn-success', 'btn-warning');
    document.getElementById('btnCancelar').style.display = 'block';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetFormulario() {
    document.getElementById('formPasaje').reset();
    document.getElementById('id_pasaje').value = ''; 
    document.getElementById('tituloFormulario').innerText = 'Venta de Pasaje';
    document.getElementById('btnGuardar').innerText = '💾 Guardar Pasaje';
    document.getElementById('btnGuardar').classList.replace('btn-warning', 'btn-success');
    document.getElementById('btnCancelar').style.display = 'none';
}

async function eliminarPasaje(id) {
    if (!confirm('¿Estás seguro de eliminar el pasaje #' + id + '?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            cargarPasajes();
        } else {
            alert('Error eliminando pasaje');
        }
    } catch (error) {
        console.error(error);
    }
}

document.getElementById('filtroRuta').addEventListener('keyup', function() {
    const texto = this.value.toLowerCase();
    const filas = document.querySelectorAll('#tablaPasajes tr');

    filas.forEach(fila => {
        const ruta = fila.children[2].textContent.toLowerCase();
        if (ruta.includes(texto)) {
            fila.style.display = '';
        } else {
            fila.style.display = 'none';
        }
    });
});

function calcularPrecio() {
    const selectRuta = document.getElementById('id_ruta');
    const selectTipo = document.getElementById('id_tipo');

    const opcionRuta = selectRuta.options[selectRuta.selectedIndex];
    const opcionTipo = selectTipo.options[selectTipo.selectedIndex];

    const precioBase = parseFloat(opcionRuta.getAttribute('data-precio')) || 0;
    const descuento = parseFloat(opcionTipo.getAttribute('data-descuento')) || 0;

    const valorFinal = precioBase - (precioBase * descuento);

    document.getElementById('valor').value = valorFinal.toFixed(2);
}

async function descargarCSV() {
    try {
        const btn = document.querySelector('button[onclick="descargarCSV()"]');
        const textoOriginal = btn.innerText;
        btn.innerText = '⏳ Descargando...';
        btn.disabled = true;

        const res = await fetch(`${API_URL}/csv`, {
            method: 'POST'
        });

        if (res.ok) {
            const blob = await res.blob();
            
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte_ventas.csv';
            document.body.appendChild(a);
            a.click();
            
            a.remove();
            window.URL.revokeObjectURL(url);
            
        } else {
            const errorText = await res.text();
            alert('❌ Error: ' + errorText);
        }

        btn.innerText = textoOriginal;
        btn.disabled = false;

    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor');
        document.querySelector('button[onclick="descargarCSV()"]').disabled = false;
    }
}

cargarPasajes();