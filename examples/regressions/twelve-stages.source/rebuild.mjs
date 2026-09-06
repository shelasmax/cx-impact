import { fileURLToPath } from 'node:url';
import { deliverMap } from './scripts/render-map.mjs';
await deliverMap(fileURLToPath(new URL("../twelve-stages.json",import.meta.url)),fileURLToPath(new URL("../twelve-stages.html",import.meta.url)),{bundle:false});
