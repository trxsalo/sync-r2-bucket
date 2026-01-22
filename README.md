
# 📦 Sync R2 Bucket
Sincronizador rápido, seguro y eficiente para descargar **todos los objetos** de un bucket de **Cloudflare R2** a tu máquina local, usando Node.js + TypeScript + AWS SDK v3.

Este proyecto está diseñado para manejar **miles de archivos**, con:

- Descargas paralelas
- Reintentos automáticos
- Sincronización inteligente (solo descarga lo necesario)
- Validación de rutas seguras
- Barra de progreso avanzada
- Filtro por prefijo
- Configuración por variables de entorno
- Arquitectura limpia y orientada a clases

Ideal para backups, espejos locales, migraciones o sincronización incremental de buckets grandes.

---

## 🚀 Características principales

- **⚡ Descarga paralela** configurable (por defecto 15 workers)
- **🔁 Reintentos automáticos** con backoff progresivo
- **🧠 Sincronización inteligente**
   - Evita descargar archivos ya existentes
   - Compara tamaños para detectar cambios
   - Marca archivos como *saltados* si no requieren descarga
- **🛡️ Validación de rutas seguras**
   - Previene path traversal (`../../`)
   - Garantiza que ningún archivo salga del directorio destino
- **📊 Barra de progreso avanzada**
   - Archivos descargados
   - Archivos saltados
   - Porcentaje y totales
- **📁 Respeta la estructura de carpetas** del bucket
- **🎯 Filtro opcional por prefijo** (descargar solo una carpeta)
- **🔐 Configuración mediante `.env`**
- **🧩 Compatible con NodeNext (ESM)**

---

## 📂 Estructura del proyecto

```
sync-r2-bucket/
│
├── src/
│   ├── app/
│   │   └── sync-bucket.ts         
│   ├── core/
│   │   └── env/
│   │       └── env.ts             
│   └── services/
│       └── sync-bucket.service.ts 
│
├── dist/                          # Código compilado
├── .env                           # Variables de entorno
├── tsconfig.json
└── package.json
```

---

## 🔧 Configuración de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
BUCKET_ACCOUNT_ID=xxxxxxxxxxxxxxxx
BUCKET_ACCESS_KEY=xxxxxxxxxxxxxxxx
BUCKET_SECRET_KEY=xxxxxxxxxxxxxxxx
BUCKET_NAME=mi-bucket
BUCKET_SAVE_LOCAL_BUCKET=./backup-r2
BUCKET_DOWNLOAD_CONCURRENCY=15
BUCKET_MAX_RETRIES=3
BUCKET_PREFIX=
```

### Explicación de variables

| Variable | Descripción |
|---------|-------------|
| `BUCKET_ACCOUNT_ID` | ID de tu cuenta Cloudflare |
| `BUCKET_ACCESS_KEY` | Access Key de R2 |
| `BUCKET_SECRET_KEY` | Secret Key de R2 |
| `BUCKET_NAME` | Nombre del bucket |
| `BUCKET_SAVE_LOCAL_BUCKET` | Carpeta local donde se guardarán los archivos |
| `BUCKET_DOWNLOAD_CONCURRENCY` | Número de descargas simultáneas |
| `BUCKET_MAX_RETRIES` | Reintentos por archivo |
| `BUCKET_PREFIX` | Prefijo opcional (ej: `imagenes/`) |

---

## 📦 Instalación

```bash
npm install
```

Compilar TypeScript:

```bash
npx tsc
```

---

## ▶️ Ejecución

### Opción 1 — Ejecutar compilado

```bash
node dist/services/sync-bucket.service.js
```

### Opción 2 — Compilar y ejecutar con script

```bash
npm run sync:bucket
```

---

## 🧠 ¿Cómo funciona?

El proceso de sincronización sigue estos pasos:

1. **Listar objetos del bucket** usando `ListObjectsV2`
   - Si hay más de 1000 objetos, usa `ContinuationToken` para paginar.

2. **Construir una cola de descargas**
   - Cada objeto se agrega con su `Key` y `Size`.

3. **Validar rutas seguras**
   - Se evita escribir fuera del directorio destino.

4. **Sincronización inteligente**
   - Si el archivo existe y el tamaño coincide → se *salta*.
   - Si no existe o cambió → se descarga.

5. **Descargas paralelas**
   - Se crean N workers que consumen la cola con `queue.shift()`.

6. **Reintentos automáticos**
   - Backoff progresivo: 1s → 2s → 3s…

7. **Barra de progreso avanzada**
   - Muestra descargas, saltos y porcentaje.


## 🧪 Ejemplo de salida

```
📥 Listando objetos del bucket...
📦 Total de objetos encontrados: 12,842
🚀 Iniciando sincronización...
Progreso |████████████████████████████████████████| 100% || 12842/12842 Archivos || 9123 Saltados
🎉 Sincronización completa
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.
Puedes abrir issues o enviar PRs.

---

## 📜 Licencia

MIT License.
