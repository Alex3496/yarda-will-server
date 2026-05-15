# =============================================================================
# ETAPA 1 — "builder"
# Su único trabajo es compilar TypeScript → JavaScript.
# Todo lo que instale aquí (devDependencies, tsc, ts-node-dev) NO llegará
# a la imagen final, así la imagen de producción queda mucho más pequeña.
# =============================================================================

# FROM: define la imagen base que usaremos como punto de partida.
# "node:22-alpine" significa Node 22 sobre Alpine Linux, una distribución
# minimalista (~5 MB) pensada para contenedores ligeros.
# Le damos el alias "builder" para referenciarla desde la etapa 2.
FROM node:22-alpine AS builder

# WORKDIR: crea el directorio (si no existe) y lo establece como el
# directorio de trabajo para todos los comandos siguientes (RUN, COPY, etc.).
# Es la convención usar /app dentro del contenedor.
WORKDIR /app

# COPY: copia archivos desde el host (tu máquina) al sistema de archivos
# del contenedor. Copiamos primero solo package*.json para aprovechar
# la caché de Docker: si el código cambia pero las dependencias no,
# Docker reutiliza la capa de "npm install" sin reinstalar nada.
COPY package*.json ./

# RUN: ejecuta un comando durante la construcción de la imagen.
# "npm install" instala todas las dependencias (incluidas devDependencies como tsc).
RUN npm install

# COPY: ahora copiamos el resto del código fuente.
# Esto va después de "npm install" a propósito (ver comentario anterior sobre caché).
COPY . .

# RUN: compilamos TypeScript. El script "build" ejecuta "tsc", que lee
# tsconfig.json y genera los archivos .js en la carpeta dist/.
RUN npm run build


# =============================================================================
# ETAPA 2 — imagen final de producción
# Parte de cero (nueva imagen limpia) y solo copia lo necesario
# del "builder": los archivos JS compilados y las dependencias de producción.
# =============================================================================

FROM node:22-alpine

# Buena práctica: crear un usuario no-root para ejecutar la aplicación.
# Si alguien explota una vulnerabilidad, no tendrá permisos de root
# dentro del contenedor.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copiamos solo package*.json para instalar únicamente las dependencias
# de producción (sin devDependencies como typescript, ts-node-dev, etc.).
COPY package*.json ./

# "--omit=dev" le dice a npm que ignore las devDependencies.
# Resultado: node_modules mucho más pequeño en la imagen final.
RUN npm install --omit=dev

# COPY --from=builder: copia archivos de la etapa "builder" (no del host).
# Solo necesitamos la carpeta dist/ con el JavaScript ya compilado.
COPY --from=builder /app/dist ./dist

# Cambiamos al usuario no-root que creamos arriba.
USER appuser

# EXPOSE: documenta en qué puerto escucha el contenedor.
# No abre el puerto por sí solo; eso lo hace "docker run -p" o docker-compose.
EXPOSE 3000

# CMD: el comando que se ejecuta cuando el contenedor arranca.
# Usamos la forma JSON (array) que es la recomendada porque no invoca
# una shell intermedia, lo que permite que las señales del sistema
# (como SIGTERM al detener el contenedor) lleguen directamente al proceso.
CMD ["node", "dist/index.js"]
