
import {SyncBucket} from "../app/sync-bucket.js";


/*
* Intancia y ejecuta la sincronización del bucket
* */
const main = async () => {
    const syncBucket = new SyncBucket();
    await syncBucket.sync();
}

/*
* Ejecuta: npm run sync:bucket
* */
main().catch((error) => {
    console.error(error)
});
