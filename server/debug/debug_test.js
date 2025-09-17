import { Sys as sys } from 'gpaccore';

let cnt = 0;

// Callback ultra-léger : on compte seulement
sys.on_log = () => { cnt++; };

// Active le mode ALL DEBUG
sys.set_logs('all@debug');

// Ticker périodique via le scheduler GPAC
const start = Date.now();
session.post_task(() => {
  const elapsed = Date.now() - start;

  if (elapsed >= 5000) {
    // Après ~5s, on nettoie et on arrête le task
    try { sys.set_logs('all@warning'); } catch (e) {}
    sys.on_log = undefined;


    print('logs comptés en 5s = ' + cnt);

    return false; // stop le task
  }

  return 50; // replanifie dans 50 ms
});
