// Modulo principal del widget ClimaTec.
// Consume la API gratuita de Open-Meteo en dos llamadas encadenadas:
//   1. Geocodificacion: nombre de ciudad -> coordenadas
//   2. Pronostico: coordenadas -> temperatura y viento actuales

// --- Referencias al DOM ---
const input = document.getElementById("ciudad-input");
const btnBuscar = document.getElementById("btn-buscar");
const elEstado = document.getElementById("estado");
const divResultado = document.getElementById("resultado");
const btnComparar = document.getElementById("btn-comparar");
const divTabla = document.getElementById("tabla-tiempos");

// --- Funciones de API ---

// buscarCiudad obtiene las coordenadas de una ciudad por nombre.
// Devuelve el primer resultado o null si la ciudad no existe.
async function buscarCiudad(nombre) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nombre)}&count=1&language=es`;
  const res = await fetch(url);

  // fetch NO lanza error ante respuestas HTTP 4xx o 5xx.
  // Solo lanza error ante fallas de red (sin conexion, DNS, timeout).
  // response.ok es false cuando el status es 400-599; hay que verificarlo manualmente.
  if (!res.ok) {
    throw new Error(`Error de geocodificacion: HTTP ${res.status}`);
  }

  const data = await res.json();

  // La API devuelve results:[] cuando no encuentra la ciudad; no devuelve 404.
  if (!data.results || data.results.length === 0) {
    return null;
  }

  return data.results[0];
}

// obtenerClima pide temperatura y velocidad del viento actual para unas coordenadas.
// Segun la documentacion de Open-Meteo, el parametro correcto es "current",
// NO "current_weather" (campo obsoleto en versiones recientes de la API).
async function obtenerClima(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Error de clima: HTTP ${res.status}`);
  }

  const data = await res.json();
  // data.current contiene temperature_2m y wind_speed_10m segun la documentacion oficial.
  return data.current;
}

// --- Flujo principal: buscar una ciudad y mostrar su clima ---

async function buscarYMostrar(nombreCiudad) {
  elEstado.textContent = "Cargando...";
  btnBuscar.disabled = true;
  divResultado.style.display = "none";

  try {
    const ciudad = await buscarCiudad(nombreCiudad);

    if (!ciudad) {
      elEstado.textContent = `No se encontro la ciudad "${nombreCiudad}". Verifique el nombre.`;
      return;
    }

    const clima = await obtenerClima(ciudad.latitude, ciudad.longitude);

    // Mostrar resultados usando textContent para evitar XSS con nombres de ciudades.
    document.getElementById("nombre-ciudad").textContent = ciudad.name;
    document.getElementById("region").textContent = `Region: ${ciudad.admin1 ?? "N/A"}`;
    document.getElementById("temperatura").textContent =
      `Temperatura: ${clima.temperature_2m} degC`;
    document.getElementById("viento").textContent =
      `Viento: ${clima.wind_speed_10m} km/h`;

    divResultado.style.display = "block";
    elEstado.textContent = "";
  } catch (err) {
    // try/catch captura errores de red (sin conexion) y errores lanzados manualmente.
    // El bloque finally garantiza que el boton se reactive aunque haya error.
    elEstado.textContent = `Error: ${err.message}. Verifique su conexion a internet.`;
    divResultado.style.display = "none";
  } finally {
    btnBuscar.disabled = false;
  }
}

btnBuscar.addEventListener("click", () => {
  const nombre = input.value.trim();
  if (nombre) buscarYMostrar(nombre);
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnBuscar.click();
});

// --- Comparacion secuencial vs. paralela ---

const CIUDADES = ["Lima", "Cusco", "Arequipa"];

// obtenerClimaCompleto encadena las dos llamadas para una sola ciudad.
async function obtenerClimaCompleto(nombre) {
  const ciudad = await buscarCiudad(nombre);
  if (!ciudad) throw new Error(`Ciudad no encontrada: ${nombre}`);
  const clima = await obtenerClima(ciudad.latitude, ciudad.longitude);
  return { nombre: ciudad.name, ...clima };
}

// medirSecuencial ejecuta las tres ciudades una tras otra con await en secuencia.
// Tiempo total >= suma de tiempos individuales porque cada llamada espera a la anterior.
async function medirSecuencial() {
  const inicio = performance.now();
  const resultados = [];
  for (const c of CIUDADES) {
    resultados.push(await obtenerClimaCompleto(c));
  }
  const tiempo = performance.now() - inicio;
  return { resultados, tiempo };
}

// medirParalelo usa Promise.all para disparar las tres peticiones al mismo tiempo.
// Tiempo total ~= tiempo de la peticion mas lenta, no la suma de todas.
// Promise.all falla en conjunto si ALGUNA promesa falla (comportamiento "todo o nada").
async function medirParalelo() {
  const inicio = performance.now();
  const resultados = await Promise.all(CIUDADES.map(obtenerClimaCompleto));
  const tiempo = performance.now() - inicio;
  return { resultados, tiempo };
}

// DECISION: Promise.all vs Promise.allSettled
// Se elige Promise.allSettled cuando se necesita saber el resultado de CADA promesa
// aunque alguna falle. Por ejemplo, si "Xyzabc" es una ciudad invalida,
// Promise.allSettled devuelve { status: "rejected", reason: Error } para esa ciudad
// y { status: "fulfilled", value: ... } para las demas.
// Promise.all en cambio cancela todo el conjunto en cuanto falla una sola promesa.
// Para el widget de comparacion de ciudades se prefiere allSettled para mostrar
// los datos disponibles aunque una ciudad no se encuentre.
async function medirParaleloSeguro() {
  const inicio = performance.now();
  const resultados = await Promise.allSettled(CIUDADES.map(obtenerClimaCompleto));
  const tiempo = performance.now() - inicio;
  return { resultados, tiempo };
}

btnComparar.addEventListener("click", async () => {
  btnComparar.disabled = true;
  divTabla.textContent = "Midiendo tres veces...";

  const corridas = 3;
  const tiemposSeq = [];
  const tiemposPar = [];

  try {
    for (let i = 0; i < corridas; i++) {
      const seq = await medirSecuencial();
      tiemposSeq.push(seq.tiempo);

      const par = await medirParalelo();
      tiemposPar.push(par.tiempo);
    }

    const promSeq = tiemposSeq.reduce((a, b) => a + b, 0) / corridas;
    const promPar = tiemposPar.reduce((a, b) => a + b, 0) / corridas;

    // Construir la tabla de resultados con createElement para evitar XSS.
    const tabla = document.createElement("table");

    const encabezado = tabla.insertRow();
    ["Corrida", "Secuencial (ms)", "Paralelo (ms)"].forEach(txt => {
      const th = document.createElement("th");
      th.textContent = txt;
      encabezado.appendChild(th);
    });

    for (let i = 0; i < corridas; i++) {
      const fila = tabla.insertRow();
      [i + 1, tiemposSeq[i].toFixed(0), tiemposPar[i].toFixed(0)].forEach(txt => {
        const td = fila.insertCell();
        td.textContent = txt;
      });
    }

    const filaPromedio = tabla.insertRow();
    ["Promedio", promSeq.toFixed(0), promPar.toFixed(0)].forEach(txt => {
      const td = filaPromedio.insertCell();
      td.textContent = txt;
      td.style.fontWeight = "bold";
    });

    divTabla.textContent = "";
    divTabla.appendChild(tabla);

    const conclusion = document.createElement("p");
    conclusion.textContent =
      `Conclusion: Promise.all es ~${(promSeq / promPar).toFixed(1)}x mas rapido ` +
      `porque ejecuta las ${CIUDADES.length} peticiones en paralelo en lugar de en secuencia.`;
    divTabla.appendChild(conclusion);

  } catch (err) {
    divTabla.textContent = `Error durante la medicion: ${err.message}`;
  } finally {
    btnComparar.disabled = false;
  }
});
