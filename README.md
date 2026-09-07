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

## Selección automática de idioma

Las rutas sin prefijo de idioma se resuelven con esta prioridad: preferencia manual
guardada en la cookie `jabbustore_locale`, país informado por la infraestructura,
cabecera `Accept-Language` del navegador e inglés como último respaldo. Las rutas que
ya incluyen `/en`, `/es` o `/br` se respetan tal como fueron solicitadas.

El proxy reconoce `X-Vercel-IP-Country`, `CF-IPCountry`,
`CloudFront-Viewer-Country`, `X-Geo-Country`, `X-Country-Code` y `X-Country`.
En un despliegue propio, el reverse proxy debe calcular y sobrescribir uno de esos
encabezados con un código de país ISO 3166-1 alpha-2 confiable; si no lo hace, la
aplicación usa el idioma preferido del navegador como respaldo.

## Scripts Disponibles

En el directorio del proyecto, puedes ejecutar:

* `bun run dev` o `npm run dev`: Inicia el servidor de desarrollo en modo local.
* `bun run build` o `npm run build`: Construye la aplicación para producción.
* `bun run start` o `npm run start`: Inicia el servidor de producción.
* `bun run lint` o `npm run lint`: Ejecuta el linter (ESLint) para analizar el código.

## Estructura de Proyecto (Convenciones de Next.js)
El proyecto sigue la estructura estándar de Next.js (App Router o Pages Router dependiendo de la implementación interna), utilizando TypeScript para un tipado estricto.
