// Modulo de datos y logica de negocio refactorizado con ES6+.
// Named exports porque este modulo expone multiples entidades reutilizables.

const IGV = 0.18;

// class encapsula las propiedades y metodos de un pedido en una sola unidad.
// El contructor usa desestructuracion con valor por defecto para cantidad.
export class Pedido {
  constructor({ producto, precio, cantidad = 0, cliente = null } = {}) {
    this.id = Pedido._nextId++;
    this.producto = producto;
    this.precio = precio;
    // ?? solo aplica el default cuando cantidad es null o undefined.
    // Si cantidad es 0 (pedido cancelado), se respeta el 0.
    this.cantidad = cantidad ?? 0;
    this.cliente = cliente;
    this.estado = "pendiente";
  }

  subtotal() {
    return this.precio * this.cantidad;
  }

  marcarEntregado() {
    this.estado = "entregado";
  }
}
Pedido._nextId = 1;

// calcularTotal usa reduce() para acumular sin variable externa mutable.
// La funcion flecha mantiene claridad; IGV se aplica al final, no dentro del reduce.
export const calcularTotal = (listaPedidos) => {
  const subtotal = listaPedidos.reduce((acc, p) => acc + p.subtotal(), 0);
  return subtotal + subtotal * IGV;
};

// resumen usa encadenamiento opcional (?.) para acceder a cliente.nombre sin
// riesgo de TypeError si cliente es undefined o null.
// Template literal reemplaza la concatenacion con +.
export const resumen = (pedido) => {
  const cliente = pedido.cliente?.nombre ?? "Anonimo";
  return `Pedido de ${cliente}: ${pedido.producto} x${pedido.cantidad}`;
};

// Arreglo de prueba equivalente al del enunciado, usando la clase Pedido.
export const pedidosEjemplo = [
  new Pedido({ producto: "Cafe",      precio: 6,   cantidad: 2, cliente: { nombre: "Ana" } }),
  new Pedido({ producto: "Croissant", precio: 4.5, cantidad: 0 }),
  new Pedido({ producto: "Jugo",      precio: 8 })
];

// Actualizar un pedido SIN mutar el arreglo original usando spread.
// Devuelve un nuevo arreglo con el pedido actualizado como nuevo objeto.
export const actualizarPedido = (lista, id, cambios) =>
  lista.map(p => p.id === id ? { ...p, ...cambios } : p);

// Verificacion en consola: debe imprimir 14.16 (no 28.91 como el codigo antiguo).
console.log("Total correcto con IGV:", calcularTotal(pedidosEjemplo).toFixed(2));
pedidosEjemplo.forEach(p => console.log(resumen(p)));
