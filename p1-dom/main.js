// Punto de entrada: conecta eventos del DOM con la logica de negocio y la UI.
import { agregarPedido, eliminarPedido, pedidos } from "./pedidos.js";
import { render, mostrarMensaje } from "./ui.js";

const form = document.getElementById("form-pedido");
const filtroSelect = document.getElementById("filtro");
const listaPedidos = document.getElementById("lista-pedidos");

// --- Evento 1: submit del formulario ---
// preventDefault evita que la pagina se recargue al enviar el formulario.
form.addEventListener("submit", (e) => {
  e.preventDefault();
  mostrarMensaje("");

  const producto = document.getElementById("producto").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const cantidad = parseInt(document.getElementById("cantidad").value, 10);

  // Validaciones: se muestran en #mensaje, nunca con alert().
  if (!producto) {
    mostrarMensaje("El nombre del producto no puede estar vacio.");
    return;
  }
  if (isNaN(precio) || precio <= 0) {
    mostrarMensaje("El precio debe ser mayor a 0.");
    return;
  }
  if (isNaN(cantidad) || cantidad < 0) {
    mostrarMensaje("La cantidad no puede ser negativa.");
    return;
  }

  agregarPedido(producto, precio, cantidad);
  form.reset();
  render(filtroSelect.value);
});

// --- Evento 2: cambio del filtro ---
filtroSelect.addEventListener("change", () => {
  render(filtroSelect.value);
});

// --- Evento 3: delegacion de eventos en la lista ---
// UN SOLO listener en #lista-pedidos maneja todos los botones "Entregar" y "Eliminar".
// JUSTIFICACION: los pedidos se crean dinamicamente; si cada boton tuviera su propio
// listener, habria que registrarlo cada vez que se llama a render(). La delegacion
// evita eso y reduce el numero total de listeners de 2*N a 1, independientemente
// de cuantos pedidos haya. Esto mejora la memoria y simplifica el codigo.
listaPedidos.addEventListener("click", (e) => {
  // closest() sube por el arbol DOM buscando el elemento con data-id.
  // Funciona aunque el clic sea en texto dentro del boton.
  const btn = e.target.closest("[data-id]");
  if (!btn) return;

  const id = parseInt(btn.dataset.id, 10);
  const accion = btn.dataset.accion;

  if (accion === "entregar") {
    // Busca el pedido en el arreglo y llama a su metodo de instancia.
    const pedido = pedidos.find(p => p.id === id);
    if (pedido) pedido.marcarEntregado();
  } else if (accion === "eliminar") {
    eliminarPedido(id);
  }

  render(filtroSelect.value);
});

// Renderizado inicial para mostrar la lista vacia al cargar la pagina.
render();
