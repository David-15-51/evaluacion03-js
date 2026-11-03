# P1 - Analisis manual: DOM, eventos y objetos

## Tabla de eventos

| Elemento          | Evento   | Accion                                                                 |
|-------------------|----------|------------------------------------------------------------------------|
| `#form-pedido`    | submit   | Valida los campos, crea un nuevo objeto Pedido y lo agrega al arreglo  |
| `#filtro`         | change   | Filtra el arreglo de pedidos por estado y llama a render()             |
| `#lista-pedidos`  | click    | Detecta si se hizo clic en un boton Entregar o Eliminar via delegacion |
| `#producto`       | input    | (Opcional) Limpia el mensaje de error al comenzar a escribir           |
| `#precio`         | input    | (Opcional) Limpia el mensaje de error al comenzar a escribir           |
| `#cantidad`       | input    | (Opcional) Limpia el mensaje de error al comenzar a escribir           |

---

## Modelo del objeto Pedido

```
+---------------------------+
|         Pedido            |
+---------------------------+
| id        : number        |
| producto  : string        |
| precio    : number        |
| cantidad  : number        |
| estado    : string        |  <-- "pendiente" | "entregado"
+---------------------------+
| subtotal()                |  --> precio * cantidad
| marcarEntregado()         |  --> estado = "entregado"
+---------------------------+
```

Representacion visual del arreglo de pedidos:

```
pedidos[]
  |
  +-- [0] Pedido { id:1, producto:"Cafe", precio:5, cantidad:2, estado:"pendiente" }
  |         subtotal() --> 10
  |         marcarEntregado() --> estado = "entregado"
  |
  +-- [1] Pedido { id:2, producto:"Croissant", precio:4.5, cantidad:1, estado:"pendiente" }
  |         subtotal() --> 4.5
  |
  +-- [2] Pedido { id:3, producto:"Jugo", precio:8, cantidad:3, estado:"entregado" }
            subtotal() --> 24
```

---

## Flujo de render()

```
Estado del arreglo cambia
        |
        v
    render()
        |
        +-- Filtra segun #filtro.value
        |
        +-- Limpia #lista-pedidos
        |
        +-- Por cada pedido filtrado:
        |       Crea <li> con createElement
        |       Asigna textContent (NO innerHTML) a cada parte
        |       Agrega botones Entregar / Eliminar con data-id
        |
        +-- Calcula total de TODOS los pedidos (sin filtro)
        |
        +-- Actualiza #total con textContent
```

---

## Justificacion: delegacion de eventos

En lugar de agregar un listener a cada boton "Entregar" y "Eliminar"
individualmente, se coloca UN SOLO listener en el elemento padre #lista-pedidos.

Ventajas:
- Los pedidos se agregan dinamicamente. Si cada boton tuviera su propio
  listener, los botones nuevos no tendrian el listener hasta que se les
  asignara manualmente.
- Menor consumo de memoria: un listener vs. N * 2 listeners.
- El codigo de manejo de eventos queda centralizado en un solo lugar.
- event.target.closest('[data-id]') sube por el arbol DOM hasta encontrar
  el elemento con el atributo data-id, sin importar si el clic fue en el
  texto del boton o en el boton mismo.

---

## Prueba de seguridad: innerHTML vs textContent

Texto ingresado como producto:
```
<img src=x onerror="alert(1)">
```

Con innerHTML:
- El navegador interpreta la cadena como HTML real.
- Se inserta una etiqueta <img> en el DOM.
- El atributo onerror ejecuta alert(1).
- Riesgo: XSS (Cross-Site Scripting). Un atacante puede inyectar
  scripts que roben cookies, redirijan al usuario o manipulen la pagina.

Con textContent / createElement:
- La cadena se trata como texto plano.
- Los caracteres < y > no se interpretan como etiquetas HTML.
- Se muestra literalmente: <img src=x onerror="alert(1)">
- Sin riesgo de ejecucion de codigo.

Decision: usar createElement y textContent en toda funcion render()
que muestre datos ingresados por el usuario.

---

## Revision de la propuesta de IA para render()

La IA propuso usar innerHTML con template literals para armar cada fila:
```js
// Propuesta de la IA (NO aceptada tal cual)
lista.innerHTML += `<li>${pedido.producto} - S/ ${pedido.precio}</li>`;
```

Problemas detectados:
1. Usa innerHTML con datos del usuario: riesgo XSS confirmado con la prueba.
2. Recalculaba el total dentro del loop (ineficiente).
3. Reasignaba innerHTML += en cada iteracion, lo que destruye y recrea
   todo el DOM en cada pedido (performance innecesariamente mala).

Decision: Se rechazo la propuesta y se reescribio usando createElement
y textContent. El total se calcula en un reduce() fuera del loop de renderizado.
