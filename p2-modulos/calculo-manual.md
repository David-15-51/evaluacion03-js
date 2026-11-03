# P2 - Calculo manual y analisis del codigo antiguo

## Arreglo de pedidos del enunciado

| # | Producto  | Precio | Cantidad | Nota                          |
|---|-----------|--------|----------|-------------------------------|
| 0 | Cafe      | 6      | 2        | cantidad real = 2             |
| 1 | Croissant | 4.5    | 0        | cancelado, 0 unidades         |
| 2 | Jugo      | 8      | undefined| sin cantidad, deberia valer 0 |

---

## Calculo correcto (a mano)

Un pedido con cantidad 0 significa que fue cancelado: su aporte al total es 0.
Un pedido sin cantidad (undefined) deberia tratarse como 0, no como 1.

```
Cafe:      6    * 2 = 12.00
Croissant: 4.5  * 0 =  0.00
Jugo:      8    * 0 =  0.00  (sin cantidad -> se trata como 0)
                     -------
Subtotal:          12.00
IGV (18%):          2.16
                     -------
TOTAL CORRECTO:    14.16
```

---

## Resultado que devuelve el codigo antiguo

El codigo usa el operador `||` para el fallback de cantidad:

```js
var cantidad = pedidos[i].cantidad || 1;
```

El operador `||` devuelve el operando derecho cuando el izquierdo es FALSY.
En JavaScript, los valores falsy son: false, 0, "", null, undefined, NaN.

Por lo tanto:
- Cafe:      cantidad = 2   || 1 --> 2  (2 es truthy, se usa 2)
- Croissant: cantidad = 0   || 1 --> 1  (0 es FALSY, se usa 1 en lugar de 0)
- Jugo:      cantidad = undefined || 1 --> 1  (undefined es falsy, se usa 1)

```
Cafe:      6    * 2 = 12.00
Croissant: 4.5  * 1 =  4.50   <-- ERROR: deberia ser 0
Jugo:      8    * 1 =  8.00   <-- Error menor, pero aun incorrecto semanticamente
                     -------
Subtotal:          24.50
IGV (18%):          4.41
                     -------
TOTAL CON BUG:     28.91
```

---

## Explicacion de la diferencia

| Metodo         | Total   |
|----------------|---------|
| Correcto       | S/ 14.16|
| Codigo antiguo | S/ 28.91|
| Diferencia     | S/ 14.75|

La diferencia se debe a que `||` considera 0 como falso y lo reemplaza por 1.
Esto convierte pedidos cancelados (cantidad = 0) en pedidos de una unidad,
inflando el total artificialmente.

La solucion es usar el operador `??` (nullish coalescing), que solo aplica
el valor por defecto cuando el operando izquierdo es null o undefined,
NO cuando es 0 o cualquier otro valor falsy:

```js
// Correcto: 0 se respeta como 0, undefined se convierte en 0
const cantidad = pedido.cantidad ?? 0;
```

Con `??`:
- Cafe:      2         ?? 0 --> 2
- Croissant: 0         ?? 0 --> 0  (0 no es null ni undefined, se respeta)
- Jugo:      undefined ?? 0 --> 0  (undefined si activa el fallback)

Resultado: S/ 14.16 (correcto).

---

## Tabla de caracteristicas ES6+ usadas en la refactorizacion

| Caracteristica ES6+          | Donde se uso                            | Por que                                                      |
|------------------------------|-----------------------------------------|--------------------------------------------------------------|
| const / let                  | Todas las declaraciones de variables    | Evita re-declaraciones accidentales y clarifica el scope     |
| Funciones flecha (=>)        | calcularTotal, resumen, reduce          | Sintaxis mas corta; no crea su propio `this`                 |
| Template literals            | resumen(), mensajes de UI               | Legibilidad; evita concatenacion con +                       |
| Desestructuracion + defaults | ({ producto, precio, cantidad = 0 })    | Extrae propiedades y aplica fallback en la firma             |
| reduce()                     | calcularTotal                           | Suma acumulativa funcional sin variable mutada externamente  |
| Encadenamiento opcional (?.) | pedido.cliente?.nombre                  | Evita TypeError si cliente es undefined sin if anidados      |
| Nullish coalescing (??)      | pedido.cantidad ?? 0                    | Distingue "sin valor" (null/undefined) de "valor cero" (0)  |
| class                        | class Pedido                            | Encapsula datos y metodos del pedido en una estructura clara |
| Spread operator (...)        | actualizar pedido sin mutar el arreglo  | Crea nuevo objeto con propiedades sobreescritas (inmutabilidad)|
| ES Modules (import/export)   | pedidos.js, ui.js, main.js              | Separa responsabilidades; permite tree-shaking               |

---

## Error de consola con file://

Al abrir index.html con doble clic (protocolo file://), la consola muestra:

```
Access to script at 'file:///...pedidos.js' from origin 'null'
has been blocked by CORS policy: Cross origin requests are only
supported for protocol schemes: http, data, chrome-extension, ...
```

O en algunos navegadores simplemente:

```
Failed to load module script: Expected a JavaScript module script but
the server responded with a MIME type of "". Strict MIME type checking
is enforced for module scripts per HTML spec.
```

Causa: el protocolo file:// no tiene origen (origin = null), y los modulos ES
requieren solicitudes HTTP con cabeceras CORS correctas para poder importarse.
El navegador trata las importaciones de modulos como solicitudes de origen cruzado
incluso dentro del mismo disco cuando el protocolo es file://.

Solucion: servir los archivos a traves de un servidor HTTP local.
- Live Server (extension de VS Code): hace exactamente eso en http://127.0.0.1:5500
- Alternativa: `python3 -m http.server 8000` en la carpeta del proyecto
