import dotenv from "dotenv";
import env from "env-var";
dotenv.config();

export const Envs = {
    BUCKET_ACCOUNT_ID: env.get('BUCKET_ACCOUNT_ID').required().asString(),
    BUCKET_ACCESS_KEY: env.get('BUCKET_ACCESS_KEY').required().asString(),
    BUCKET_SECRET_KEY:env.get('BUCKET_SECRET_KEY').required().asString(),
    BUCKET_NAME:env.get('BUCKET_NAME').required().asString(),
    BUCKET_SAVE_LOCAL_BUCKET:env.get('BUCKET_SAVE_LOCAL_BUCKET').default('./bucket_backup').asString(),
    BUCKET_DOWNLOAD_CONCURRENCY:env.get('BUCKET_DOWNLOAD_CONCURRENCY').default(15).asIntPositive(),
    BUCKET_MAX_RETRIES:env.get('BUCKET_MAX_RETRIES').default(3).asIntPositive(),
    BUCKET_PREFIX:env.get('BUCKET_PREFIX').default('').asString()
}