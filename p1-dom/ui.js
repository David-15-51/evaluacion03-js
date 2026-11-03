// Modulo de presentacion: solo toca el DOM, no contiene logica de negocio.
// Se importan pedidos y calcularTotal desde el modulo de datos.
import { pedidos, calcularTotal } from "./pedidos.js";

const listaPedidos = document.getElementById("lista-pedidos");
const elTotal = document.getElementById("total");

// render() reconstruye la lista completa cada vez que el estado cambia.
// Se basa SIEMPRE en el arreglo pedidos; nunca lee el DOM para calcular nada.
export function render(filtro = "todos") {
  // Limpiar con textContent es mas seguro y rapido que innerHTML = "".
  listaPedidos.textContent = "";

  const pedidosFiltrados = filtro === "todos"
    ? pedidos
    : pedidos.filter(p => p.estado === filtro);

  for (const p of pedidosFiltrados) {
    const li = crearFilaPedido(p);
    listaPedidos.appendChild(li);
  }

  // El total siempre refleja todos los pedidos, no solo los filtrados.
  elTotal.textContent = `Total: S/ ${calcularTotal().toFixed(2)}`;
}

// Construye un elemento <li> para un pedido usando createElement + textContent.
// DECISION DE SEGURIDAD: se evita innerHTML con datos del usuario para prevenir XSS.
// Con textContent, cadenas como <img src=x onerror="alert(1)"> se muestran como texto literal
// y nunca se interpretan como HTML por el navegador.
function crearFilaPedido(pedido) {
  const li = document.createElement("li");
  if (pedido.estado === "entregado") li.classList.add("entregado");

  const texto = document.createElement("span");
  // textContent escapa automaticamente los caracteres especiales HTML.
  texto.textContent =
    `[${pedido.estado.toUpperCase()}] ${pedido.producto} x${pedido.cantidad} - S/ ${pedido.subtotal().toFixed(2)}`;
  li.appendChild(texto);

  // Los botones llevan data-id y data-accion para que el listener delegado los identifique.
  const btnEntregar = crearBoton("Entregar", "btn-entregar", pedido.id, "entregar");
  const btnEliminar = crearBoton("Eliminar", "btn-eliminar", pedido.id, "eliminar");

  li.appendChild(btnEntregar);
  li.appendChild(btnEliminar);

  return li;
}

function crearBoton(etiqueta, clase, id, accion) {
  const btn = document.createElement("button");
  btn.textContent = etiqueta;
  btn.className = clase;
  // data-id y data-accion permiten identificar el pedido y la operacion
  // desde el listener unico en #lista-pedidos sin recorrer arrays.
  btn.dataset.id = id;
  btn.dataset.accion = accion;
  return btn;
}

// Muestra o limpia el mensaje de validacion en #mensaje.
export function mostrarMensaje(texto) {
  document.getElementById("mensaje").textContent = texto;
}
