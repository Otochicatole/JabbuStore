# JabbuStore - Frontend Documentation

## Descripción General
JabbuStore es el frontend de una plataforma de comercio electrónico orientada a la venta de artículos (probablemente relacionados con CS2, dado el contexto del backend). Está construida utilizando las últimas tecnologías web para garantizar un rendimiento óptimo y una experiencia de usuario fluida y reactiva.

## Stack Tecnológico
* **Framework:** Next.js (v16.2)
* **Librería UI:** React (v19)
* **Estilos:** TailwindCSS
* **Animaciones:** Framer Motion
* **Iconos:** Lucide React
* **Comunicación en Tiempo Real:** Socket.io-client
* **Pagos:** MercadoPago SDK React
* **Lenguaje:** TypeScript

## Características Principales
* **Renderizado Optimizado:** Utiliza Next.js para renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG) donde sea conveniente.
* **Diseño Responsivo y Moderno:** Interfaz estilizada con TailwindCSS y animaciones fluidas con Framer Motion.
* **Integración de Pagos:** Flujo de pagos integrado directamente con MercadoPago.
* **Actualizaciones en Tiempo Real:** Conexión por WebSockets mediante Socket.io para mantener sincronizado el estado (ej. inventario, notificaciones de compra).

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

* `bun run dev` o `npm run dev`: Inicia el servidor de desarrollo en modo local.
* `bun run build` o `npm run build`: Construye la aplicación para producción.
* `bun run start` o `npm run start`: Inicia el servidor de producción.
* `bun run lint` o `npm run lint`: Ejecuta el linter (ESLint) para analizar el código.
* `bun run test:market-sync`: Valida la normalización compatible y la política de polling del estado del Global Market.

## Diagnóstico de sincronización del Global Market

El panel administrativo consume `GET /api/market/sync/status`. Cuando el backend
incluye `run`, muestra métricas durables de la corrida: tiempos total, activo,
pausado y de espera de cuota; rendimiento y ETA; consultas vacías, timeouts y
reintentos; latencia, concurrencia efectiva, causas de lentitud y candidatos
diferidos. También presenta los workers activos y requeridos, la utilización y
cola del pool, el estado del circuit breaker, la cuenta regresiva del objetivo de
diez minutos y la finalización proyectada. Si SteamWebAPI no permite sostener el
ritmo necesario, muestra la advertencia `ten_minute_target_unreachable`: los diez
minutos son un SLO condicionado por el proveedor y no provocan la publicación de
un snapshot parcial. Si `run` no existe, mantiene compatibilidad con el contrato
anterior y continúa mostrando el progreso básico.

El polling no usa un intervalo fijo: respeta `run.recommendedPollAfterMs` dentro
de un rango seguro de 1 a 30 segundos. Como fallback consulta cada 5 segundos
durante la recolección, cada 2 segundos durante validación/publicación y reduce
la frecuencia mientras espera el reinicio de cuota. Las fases terminales y una
corrida pausada detienen el polling; los errores HTTP aplican backoff sin solapar
requests.

## Estructura de Proyecto (Convenciones de Next.js)
El proyecto sigue la estructura estándar de Next.js (App Router o Pages Router dependiendo de la implementación interna), utilizando TypeScript para un tipado estricto.
