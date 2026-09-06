import { fileURLToPath } from 'node:url';
import { deliverMap } from './scripts/render-map.mjs';
await deliverMap(fileURLToPath(new URL("../map.json",import.meta.url)),fileURLToPath(new URL("../map.html",import.meta.url)),{bundle:false});
