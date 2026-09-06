import { fileURLToPath } from 'node:url';
import { deliverMap } from './scripts/render-map.mjs';
await deliverMap(fileURLToPath(new URL("../comparison.json",import.meta.url)),fileURLToPath(new URL("../comparison.html",import.meta.url)),{bundle:false});
