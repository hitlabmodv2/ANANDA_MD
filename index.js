import { Worker } from 'worker_threads';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { watchFile, unwatchFile } from 'fs';
import readline from 'readline';

process.stdout?._handle?.setBlocking?.(true);
process.stderr?._handle?.setBlocking?.(true);

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Raw write (uses original fs.writeSync from preloader) ─
const _raw = (str) => (global.__rawWrite ? global.__rawWrite(str) : process.stdout.write(str));

// ── Spinner ───────────────────────────────────────────────
const frames  = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let spinIdx   = 0;
let spinTimer = null;
let spinning  = false;

function startSpinner() {
        if (spinning) return;
        spinning  = true;
        spinTimer = setInterval(() => {
                _raw(`\r${frames[spinIdx++ % frames.length]} Menunggu pesan baru...`);
        }, 120);
}

function stopSpinner() {
        if (!spinning) return;
        spinning = false;
        clearInterval(spinTimer);
        _raw('\r\x1b[K');
}

// ── Output line handler (called by preloader for every line) ──
function handleLine(line) {
        stopSpinner();
        _raw(line + '\n');
        if (line.includes('Tersambung') || line.includes('Menunggu Pesan')) {
                setTimeout(startSpinner, 600);
        }
}

// register hook so preload.mjs feeds all fd-1 output here
global.__outputLine = handleLine;

// also intercept process.stdout.write (console.log path)
const _origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk, enc, cb) => {
        // feed through preloader's line buffer
        global.__lineBuf = (global.__lineBuf || '') + chunk.toString();
        const lines = global.__lineBuf.split('\n');
        global.__lineBuf = lines.pop();
        lines.forEach(line => {
                if (line.startsWith('> ')) line = line.slice(2);
                if (line.trim()) handleLine(line);
        });
        if (typeof enc === 'function') enc();
        else if (typeof cb === 'function') cb();
        return true;
};

// ── Banner ────────────────────────────────────────────────
_raw('\n');
_raw('┌─────────────────────┐\n');
_raw('│   🐾  C H I I B O T │\n');
_raw('│   v2.0  Starting... │\n');
_raw('└─────────────────────┘\n');
_raw('\n');

// ── Worker ────────────────────────────────────────────────
const rl = readline.createInterface(process.stdin, process.stdout);
let worker      = null;
let running     = false;
let restartTimer = null;

function start(file) {
        if (running) return;
        running = true;
        const full = join(__dirname, file);

        if (worker) worker.terminate();
        worker = new Worker(full, { stdout: true });
        worker.stdout.on('data', (chunk) => {
                global.__lineBuf = (global.__lineBuf || '') + chunk.toString();
                const lines = global.__lineBuf.split('\n');
                global.__lineBuf = lines.pop();
                lines.forEach(line => {
                        if (line.startsWith('> ')) line = line.slice(2);
                        if (line.trim()) handleLine(line);
                });
        });

        if (restartTimer) {
                clearTimeout(restartTimer);
                restartTimer = null;
        }

        worker.on('message', (msg) => {
                if (msg === 'restart' || msg === 'reset') restart();
        });

        worker.on('exit', (code) => {
                stopSpinner();
                _raw(`❗ Exit: ${code}\n`);
                running = false;
                if (code !== 0) {
                        restartTimer = setTimeout(() => {
                                _raw('⏳ Auto restart...\n');
                                restart();
                        }, 30 * 60 * 1000);
                }
                watchFile(full, () => {
                        unwatchFile(full);
                        _raw('♻️ File updated, restarting...\n');
                        start('mainWrapper.mjs');
                });
        });

        if (!rl.listenerCount('line')) {
                rl.on('line', (line) => {
                        const cmd = line.trim().toLowerCase();
                        if (!cmd) return;
                        if (cmd === 'exit') {
                                stopSpinner();
                                _raw('⛔ Exiting...\n');
                                worker?.terminate();
                                process.exit(0);
                        }
                        if (cmd === 'restart' || cmd === 'reset') {
                                _raw('🍃 Restarting...\n');
                                restart();
                        }
                        worker?.postMessage(cmd);
                });
        }
}

function restart() {
        stopSpinner();
        if (worker) {
                try { worker.terminate(); } catch {}
        }
        running = false;
        start('mainWrapper.mjs');
}

start('mainWrapper.mjs');
