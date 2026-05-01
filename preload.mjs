// Preloader: must run BEFORE any module (including pino/sonic-boom)
// patches fs.writeSync so all fd-1 writes are caught early.

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs      = require('fs');
const _orig   = fs.writeSync.bind(fs);

// expose original for index.js to use as safe raw write
global.__rawWrite = (str) => _orig(1, str);

// shared line buffer & output hook (index.js will set __outputLine)
global.__lineBuf   = '';
global.__outputLine = null;

fs.writeSync = function (fd, data, ...rest) {
        if (fd === 1) {
                const str = (data instanceof Uint8Array || Buffer.isBuffer(data))
                        ? data.toString()
                        : String(data);
                global.__lineBuf += str;
                const lines = global.__lineBuf.split('\n');
                global.__lineBuf = lines.pop();
                for (let line of lines) {
                        if (line.startsWith('> ')) line = line.slice(2);
                        if (!line.trim()) continue;
                        if (global.__outputLine) {
                                global.__outputLine(line);
                        } else {
                                _orig(1, line + '\n');
                        }
                }
                return typeof data === 'string' ? Buffer.byteLength(data) : data.length;
        }
        return _orig(fd, data, ...rest);
};
