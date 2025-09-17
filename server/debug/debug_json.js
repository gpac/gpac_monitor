import { Sys as sys } from 'gpaccore';

// On bufferise brut, puis on batch + stringify périodiquement, sans envoyer
const CAP = 10000;
const buf = new Array(CAP);
let head = 0, size = 0;

function pushLog(entry) {
  buf[(head + size) % CAP] = entry;
  if (size < CAP) size++;
  else head = (head + 1) % CAP;
}

sys.on_log = (tool, level, message) => {
  // objet minimal pour réduire la taille mémoire
  pushLog({ t: Date.now(), tl: tool, lv: level, m: message });
};

sys.set_logs('all@debug');

let jsonBytesTotal = 0;
const start = Date.now();

session.post_task(() => {
  const elapsed = Date.now() - start;

  // toutes les ~200 ms : on prend un batch (max 50), on stringify, on "jette"
  const maxBatch = 50;
  let n = Math.min(size, maxBatch);
  if (n > 0) {
    const out = new Array(n);
    for (let i = 0; i < n; i++) {
      out[i] = buf[head];
      head = (head + 1) % CAP;
    }
    size -= n;

    // stringify sans envoyer
    const s = JSON.stringify({ message: 'log_batch', logs: out });
    jsonBytesTotal += s.length;

    // aide au GC
    for (let i = 0; i < n; i++) out[i] = null;
  }

  if (elapsed >= 5000) {
    try { sys.set_logs('all@warning'); } catch {}
    sys.on_log = undefined;
    print('OK stringify 5s; bytes JSON cumulés = ' + jsonBytesTotal + ', restants dans buf = ' + size);
    return false;
  }

  return 200; // cadence de flush JSON
});
