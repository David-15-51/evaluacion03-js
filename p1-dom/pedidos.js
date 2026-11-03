// Modelo de datos: clase Pedido con metodos propios.
// Se exporta como named export porque el proyecto puede necesitar mas clases
// (por ejemplo, Cliente) en este mismo modulo sin romper las importaciones existentes.

let contadorId = 0;

export class Pedido {
  constructor(producto, precio, cantidad) {
    // El id autoincrementado identifica de forma unica cada pedido en el arreglo.
    this.id = ++contadorId;
    this.producto = producto;
    this.precio = precio;
    this.cantidad = cantidad;
    this.estado = "pendiente";
  }

  // El subtotal es responsabilidad del pedido, no del modulo de UI.
  subtotal() {
    return this.precio * this.cantidad;
  }

  // Encapsula la transicion de estado; evita que la UI manipule la propiedad directamente.
  marcarEntregado() {
    this.estado = "entregado";
  }
}

// El arreglo vive en este modulo; la UI lo lee pero no lo modifica directamente.
export let pedidos = [];

// Agrega un nuevo pedido al arreglo y devuelve la instancia creada.
export function agregarPedido(producto, precio, cantidad) {
  const p = new Pedido(producto, precio, cantidad);
  pedidos.push(p);
  return p;
}

// Elimina el pedido con el id dado usando filter para no mutar el arreglo original.
// Usar spread o filter en lugar de splice evita efectos secundarios sobre referencias externas.
export function eliminarPedido(id) {
  pedidos = pedidos.filter(p => p.id !== id);
}

// Calcula el total de TODOS los pedidos (independientemente del filtro activo en la UI).
export function calcularTotal() {
  return pedidos.reduce((acc, p) => acc + p.subtotal(), 0);
}
