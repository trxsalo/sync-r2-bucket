
# 📦 Sync R2 Bucket
Sincronizador rápido y confiable para descargar **todos los objetos** de un bucket de **Cloudflare R2** a tu máquina local, usando Node.js + TypeScript + AWS SDK v3.

Este proyecto está diseñado para manejar **miles de archivos**, con:

- Descargas paralelas
- Reintentos automáticos
- Barra de progreso
- Filtro por prefijo
- Configuración por variables de entorno
- Arquitectura limpia y orientada a clases

Ideal para backups, migraciones o sincronización local de buckets grandes.

---

## 🚀 Características principales

- **⚡ Descarga paralela** configurable (por defecto 15 workers)
- **🔁 Reintentos automáticos** por archivo (por defecto 3)
- **📊 Barra de progreso** en tiempo real
- **📁 Respeta la estructura de carpetas** del bucket
- **🎯 Filtro opcional por prefijo** (descargar solo una carpeta)
- **🔐 Configuración mediante `.env`**
- **🧱 Arquitectura limpia**: clases, envs, separación de responsabilidades
- **🧩 Compatible con NodeNext (ESM)**

---

## 📂 Estructura del proyecto

```
sync-r2-bucket/
│
├── src/
│   ├── app/
│   │   └── sync-bucket.ts        # Entry point
│   ├── core/
│   │   └── env/
│   │       └── env.ts            # Carga de variables de entorno
│   └── services/
│       └── sync-bucket.service.ts # Clase SyncBucket
│
├── dist/                         # Código compilado
├── .env                          # Variables de entorno
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

### Opción 2 — Ejecutar con ts-node & node

```bash
npm run sync:bucket
```
---

## 🧠 ¿Cómo funciona?

El proceso de sincronización sigue estos pasos:

1. **Listar objetos del bucket** usando `ListObjectsV2`
   - Si hay más de 1000 objetos, usa `ContinuationToken` para paginar.

2. **Crear una cola de descargas**
   - Cada archivo se agrega a una lista interna.

3. **Procesar descargas en paralelo**
   - Usa `CONCURRENCY` workers simultáneos.

4. **Reintentos automáticos**
   - Si una descarga falla, se reintenta hasta `MAX_RETRIES`.

5. **Guardar archivos localmente**
   - Respeta la estructura de carpetas del bucket.

6. **Mostrar barra de progreso**
   - Avanza por cada archivo descargado.

---

## 🛠 Tecnologías utilizadas

- **Node.js**
- **TypeScript**
- **AWS SDK v3 (S3Client)**
- **cli-progress**
- **dotenv**
---

## 🧪 Ejemplo de salida

```
📥 Listando objetos del bucket...
📦 Total de objetos encontrados: 12,842
🚀 Iniciando descargas...
[████████████████████████████████████████] 100% | 12842/12842
🎉 Sincronización completa
```

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas.
Puedes abrir issues o enviar PRs.

---

## 📜 Licencia

MIT License.
