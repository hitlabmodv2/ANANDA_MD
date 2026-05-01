// Runs INSIDE the Worker — patch fs before pino/sonic-boom loads.
// All output is rerouted through process.stdout (piped when stdout:true).

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs      = require('fs');
const _orig   = fs.writeSync.bind(fs);

// Redirect fd-1 writes → process.stdout so the parent can pipe & format them
fs.writeSync = function (fd, data, ...rest) {
        if (fd === 1) {
                const str = (data instanceof Uint8Array || Buffer.isBuffer(data))
                        ? data.toString()
                        : String(data);
                process.stdout.write(str);
                return typeof data === 'string' ? Buffer.byteLength(data) : data.length;
        }
        return _orig(fd, data, ...rest);
};

// Now load the real bot
await import('./main.js');
