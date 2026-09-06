import { fileURLToPath } from 'node:url';
import { deliverMap } from './scripts/render-map.mjs';
await deliverMap(fileURLToPath(new URL("../routing.json",import.meta.url)),fileURLToPath(new URL("../routing.html",import.meta.url)),{bundle:false});
