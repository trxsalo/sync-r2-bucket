
import { S3Client, ListObjectsV2Command, GetObjectCommand,ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import cliProgress from "cli-progress";
import { Envs } from "../core/env/env.js";

class EnvsSyncBucket {
    constructor(
        public readonly bucket: string = Envs.BUCKET_NAME,
        public readonly localBucket: string = Envs.BUCKET_SAVE_LOCAL_BUCKET,
        public readonly concurrency: number = Envs.BUCKET_DOWNLOAD_CONCURRENCY,
        public readonly maxRetries: number = Envs.BUCKET_MAX_RETRIES,
        public readonly accessKeyId: string = Envs.BUCKET_ACCESS_KEY,
        public readonly secretAccessKey: string = Envs.BUCKET_SECRET_KEY,
        public readonly accountId: string = Envs.BUCKET_ACCOUNT_ID,
        public readonly prefix: string = Envs.BUCKET_PREFIX
    ) {}
}

interface ISyncBucket {
    sync(): Promise<void>;
}

export class SyncBucket implements ISyncBucket {

    private readonly client: S3Client;

    constructor(private readonly env: EnvsSyncBucket = new EnvsSyncBucket()) {
        // Inicializa el cliente de S3
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey
            }
        });
    }

    // Verifica para no sobreescribir directorios de raiz
    private getSafePath(key: string): string | null {
        const safeKey = key.replace(/^(\.\.(\/|\\|$))+/, ''); // Elimina intentos de subir directorios
        const targetPath = path.join(this.env.localBucket, safeKey);
        const relative = path.relative(this.env.localBucket, targetPath);

        // Si el path relativo empieza con '..' o es absoluto fuera de la raíz
        if (relative && relative.startsWith('..') && !path.isAbsolute(relative)) {
            console.warn(`⚠️ Key sospechosa omitida: ${key}`);
            return null;
        }
        return targetPath;
    }

    /**
     *  Verifica si es necesario descargar el objeto
     */
    private async shouldDownload(localPath: string, remoteSize?: number): Promise<boolean> {
        try {
            const stats = await fs.promises.stat(localPath);
            // Si existe y el tamaño es igual, asumimos que es el mismo (simple check)
            return !(remoteSize !== undefined && stats.size === remoteSize);

        } catch (error) {
            return true; // No existe, descargar
        }
    }

    // Crea la carpeta si no existe
    private async ensureDir(filePath: string) {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
    }

    private async downloadObject(key: string, size?: number, attempt = 1): Promise<boolean> {
        // Obtiene la ruta verificada
        const localPath = this.getSafePath(key);

        // Salimos si no hay ruta
        if (!localPath) return false;

        // Check si existe y es igual en tamaño
        if (!(await this.shouldDownload(localPath, size))) return false; // saltamos la  descarga

        try {
            // Descarga el objeto
            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.env.bucket,
                    Key: key
                })
            );

            // Verifica que el objeto tenga Body
            if (!response.Body) throw new Error(`El objeto ${key} no tiene Body`);

            // Escribe el objeto en la ruta establecida
            await pipeline(response.Body as NodeJS.ReadableStream, fs.createWriteStream(localPath));

            return true; // Descarga exitosa

        } catch (err: any) {
            // Verifica si se debe reintentar
            if (attempt <= this.env.maxRetries) {
                await new Promise(res => setTimeout(res, 1000 * attempt));
                console.log(`⟳ Reintentando (${attempt}/${this.env.maxRetries}) → ${key}`);
                // Reintentamos
                return this.downloadObject(key, size, attempt + 1);
            }
            console.error(`✖ Error permanente al descargar ${key}:`, err.message);
            return false;
        }
    }


    // Realiza el proceso de descarga en paralelo
    private async processQueue(objects: { Key: string, Size?: number }[]) {
        const queue = [...objects];
        const bar = new cliProgress.SingleBar({
            format: 'Progreso |{bar}| {percentage}% || {value}/{total} Archivos || {skipped} Saltados'
        }, cliProgress.Presets.shades_classic);

        bar.start(queue.length, 0, { skipped: 0 });

        let skippedCount = 0;

        const workers = Array(this.env.concurrency).fill(null).map(async () => {
            while (queue.length > 0) {
                const item = queue.shift();
                if (item && item.Key) {
                    const downloaded = await this.downloadObject(item.Key, item.Size);
                    if (!downloaded) skippedCount++;
                    bar.increment({ skipped: skippedCount });
                }
            }
        });

        await Promise.all(workers);
        bar.stop();
    }

    async sync(): Promise<void> {
        let continuationToken: string | undefined = undefined;

        let allObjects: { Key: string, Size?: number }[] = [];

        try {
            console.log("📥 Listando objetos del bucket...");
            while (true) {
                const result: ListObjectsV2CommandOutput = await this.client.send(new ListObjectsV2Command({
                    Bucket: this.env.bucket,
                    Prefix: this.env.prefix,
                    ContinuationToken: continuationToken
                }));

                const contents = result.Contents || [];

                // Solo agrega los objetos que tengan Key
                allObjects.push(...contents.map(o => ({ Key: o.Key!, Size: o.Size })));

                if (!result.IsTruncated) break;

                continuationToken = result.NextContinuationToken;
            }

            console.log(`📦 Total de objetos encontrados: ${allObjects.length}`);
            console.log("🚀 Iniciando sincronización...");
            await this.processQueue(allObjects);

            console.log("🎉 Sincronización completa");

        } catch (err: any) {
            throw new Error(`Error durante la sincronización: ${err.message}`);
        }
    }
}
