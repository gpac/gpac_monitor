import { Sys as sys } from 'gpaccore';

// Ring buffer fixe pour éviter shift() et limiter la mémoire
const CAP = 5000;
const buf = new Array(CAP);
let head = 0, size = 0;

function pushLog(entry) {
  buf[(head + size) % CAP] = entry;
  if (size < CAP) size++;
  else head = (head + 1) % CAP; // overwrite le plus ancien
}

sys.on_log = (tool, level, message) => {
  // stocker un objet minimal (moins de GC/alloc)
  pushLog({ t: Date.now(), tl: tool, lv: level, m: message });
};

sys.set_logs('all@debug');

// minuteur via scheduler GPAC (~5 s)
const start = Date.now();
session.post_task(() => {
  if (Date.now() - start >= 5000) {
    // on stoppe
    try { sys.set_logs('all@warning'); } catch {}
    sys.on_log = undefined;
    print('logs stockés en 5s = ' + size); // devrait être <= CAP
    return false;
  }
  return 50;
});
