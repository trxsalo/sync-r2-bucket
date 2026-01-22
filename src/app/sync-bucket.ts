
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
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: env.accessKeyId,
                secretAccessKey: env.secretAccessKey
            }
        });
    }

    private async ensureDir(filePath: string) {
        const dir = path.dirname(filePath);
        await fs.promises.mkdir(dir, { recursive: true });
    }

    private async downloadObject(key: string, attempt = 1): Promise<void> {
        try {
            const localPath = path.join(this.env.localBucket, key);
            await this.ensureDir(localPath);

            const response = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.env.bucket,
                    Key: key
                })
            );

            if (!response.Body) {
                throw new Error(`El objeto ${key} no tiene Body (posible objeto vacío o error en R2)`);
            }

            await pipeline(response.Body as NodeJS.ReadableStream, fs.createWriteStream(localPath));

        } catch (err: any) {
            if (attempt <= this.env.maxRetries) {
                console.log(`⟳ Reintentando (${attempt}/${this.env.maxRetries}) → ${key}`);
                return this.downloadObject(key, attempt + 1);
            }
            console.error(`✖ Error permanente al descargar ${key}:`, err.message);
        }
    }

    private async processQueue(keys: string[]) {
        const queue = [...keys];
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(keys.length, 0);

        const workers = Array(this.env.concurrency).fill(null).map(async () => {
            while (queue.length > 0) {
                const key = queue.shift()!;
                await this.downloadObject(key);
                bar.increment();
            }
        });

        await Promise.all(workers);
        bar.stop();
    }

    async sync(): Promise<void> {
        let continuationToken: string | undefined = undefined;
        let allKeys: string[] = [];
        try {
            console.log("📥 Listando objetos del bucket...");
            while (true) {
                const result:ListObjectsV2CommandOutput = await this.client.send(new ListObjectsV2Command({
                    Bucket: this.env.bucket,
                    Prefix: this.env.prefix,
                    ContinuationToken: continuationToken
                }));
                const objects = result.Contents || [];
                allKeys.push(...objects.map(o => o.Key!));
                if (!result.IsTruncated) break;
                continuationToken = result.NextContinuationToken;
            }
            console.log(`📦 Total de objetos encontrados: ${allKeys.length}`);
            console.log("🚀 Iniciando descargas...");
            await this.processQueue(allKeys);
            console.log("🎉 Sincronización completa");
        }catch(err: any){
            throw new Error(`Error durante la sincronización del bucket: ${err.message}`);
        }
    }
}
