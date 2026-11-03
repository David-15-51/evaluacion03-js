# P3 - Analisis de la API Open-Meteo

## Tabla de endpoints (leida de open-meteo.com/en/docs)

| Endpoint                                        | Parametros que usa                                      | Campos de la respuesta que necesita         |
|-------------------------------------------------|---------------------------------------------------------|---------------------------------------------|
| geocoding-api.open-meteo.com/v1/search          | name (string), count=1, language=es                     | results[0].name, .admin1, .latitude, .longitude |
| api.open-meteo.com/v1/forecast                  | latitude, longitude, current=temperature_2m,wind_speed_10m | current.temperature_2m, current.wind_speed_10m, current.time |

Notas de la documentacion oficial:
- El parametro para datos actuales es `current`, no `current_weather`.
  `current_weather` era un campo de la version anterior y sigue funcionando
  pero devuelve menos variables y no es el campo documentado actualmente.
- `temperature_2m`: temperatura del aire a 2 metros del suelo, en grados Celsius.
- `wind_speed_10m`: velocidad del viento a 10 metros del suelo, en km/h.
- La API no requiere clave de API (API key).

---

## Por que fetch no lanza error ante 404 o 500

fetch() implementa la especificacion Fetch de la W3C. Segun esa especificacion,
una promesa devuelta por fetch() solo se rechaza (reject) ante fallas de NIVEL DE RED:
  - Sin conexion a internet
  - Falla de DNS (host no resuelve)
  - Timeout de red
  - Certificado SSL invalido

Una respuesta HTTP 404 (Not Found) o 500 (Internal Server Error) es una respuesta
valida del servidor; la conexion se establecio y el servidor respondio. fetch() la
considera un "exito" a nivel de red y resuelve (resolve) la promesa con el objeto
Response. Es responsabilidad del desarrollador verificar response.ok (true si el
status esta entre 200 y 299) o response.status antes de intentar parsear el cuerpo.

Si no se verifica response.ok:
  - Un 404 devolveria un JSON de error que el codigo intentaria usar como datos validos.
  - Un 500 podria devolver HTML de error que romperia JSON.parse() de forma no controlada.

---

## Revision de la propuesta de la IA para el widget

La IA propuso el siguiente fragmento para obtener el clima:

```js
// Propuesta de la IA
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
const data = await res.json();
const temp = data.current_weather.temperature;
const wind = data.current_weather.windspeed;
```

Errores detectados verificando la documentacion oficial:

| Campo propuesto por la IA           | Campo correcto segun documentacion    | Problema                                                   |
|-------------------------------------|---------------------------------------|------------------------------------------------------------|
| current_weather=true                | current=temperature_2m,wind_speed_10m | current_weather es el parametro legado; se acepto pero se corrigio a current para seguir la documentacion actual |
| data.current_weather.temperature    | data.current.temperature_2m           | El nombre del campo cambio en la API actual                |
| data.current_weather.windspeed      | data.current.wind_speed_10m           | Nombre de campo incorrecto en la version actual            |

Decision: se corrigieron los tres campos para alinearse con la documentacion
vigente de Open-Meteo. Se verifico ejecutando las llamadas reales en la consola
del navegador y comprobando la estructura del JSON devuelto.

La IA no verifico la propuesta contra la documentacion actual; propuso la version
legada que sigue funcionando pero que podria quedar obsoleta.
