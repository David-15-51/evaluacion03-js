// Codigo original del practicante - conservado para comparacion.
// TIENE UN BUG: el operador || trata cantidad=0 como falso y lo reemplaza por 1,
// convirtiendo pedidos cancelados en pedidos de una unidad.

var IGV = 0.18;

function calcularTotal(pedidos) {
  var total = 0;
  for (var i = 0; i < pedidos.length; i++) {
    var cantidad = pedidos[i].cantidad || 1; // BUG: 0 es falsy, se convierte en 1
    total = total + pedidos[i].precio * cantidad;
  }
  return total + total * IGV;
}

function resumen(pedido) {
  var cliente = pedido.cliente ? pedido.cliente.nombre : "Anonimo";
  return "Pedido de " + cliente + ": " + pedido.producto + " x" + pedido.cantidad;
}

var pedidos = [
  { producto: "Cafe",      precio: 6,   cantidad: 2, cliente: { nombre: "Ana" } },
  { producto: "Croissant", precio: 4.5, cantidad: 0 }, // cancelado: 0 unidades
  { producto: "Jugo",      precio: 8 }                 // sin cantidad: vale 1 (bug)
];

// Con el bug, calcularTotal(pedidos) devuelve 28.91 en lugar de 14.16.
console.log("Total con bug:", calcularTotal(pedidos).toFixed(2));
