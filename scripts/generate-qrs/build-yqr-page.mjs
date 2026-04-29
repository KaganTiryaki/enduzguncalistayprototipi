// Builds yemekqrkodlari/index.html: PIN-gated contact sheet.
// Reads the grid markup from output/contact-sheet.html, rewrites PNG paths
// to absolute (/yemekqrkodlari/png/), and wraps it in a gate + content layout.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

const source = readFileSync(resolve(__dirname, 'output', 'contact-sheet.html'), 'utf-8');
const start = source.indexOf('<div class="sheet">');
const end = source.lastIndexOf('</div>');
if (start < 0 || end < 0) { console.error('grid markup not found'); process.exit(1); }
const grid = source.slice(start, end + '</div>'.length)
    .replace(/src="png\//g, 'src="/yemekqrkodlari/png/');

const head = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#0E1A30">
    <meta name="robots" content="noindex,nofollow,noarchive,nosnippet">
    <title>MFL FBÇ '26 — QR Kontrol Sayfası</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">

    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --navy-dark: #2C56A5;
            --navy-primary: #3A64A7;
            --navy-medium: #4472B6;
            --gray-light: #DDE8F3;
            --text-muted: #7B93B8;
            --white: #FFFFFF;
        }
        html, body {
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100dvh;
            background: #0E1A30;
            color: var(--navy-dark);
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
        }
        body.view-content { background: #f3f7fc; }

        body.view-gate    .content { display: none; }
        body.view-content .gate    { display: none; }

        .gate { min-height: 100dvh; background: #0E1A30; color: var(--white); }
        .y-card {
            background: var(--white);
            border-radius: 14px;
            padding: 1.75rem 1.5rem;
            box-shadow: 0 8px 32px rgba(44, 86, 165, 0.15);
            border: 1px solid var(--gray-light);
            max-width: 400px;
            margin: 4rem auto;
        }
        .y-card h2 {
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 1.4rem;
            color: var(--navy-dark);
            margin-bottom: 0.5rem;
        }
        .y-card form { display: flex; flex-direction: column; }
        .y-card input[type="password"] {
            width: 100%;
            padding: 0.9rem 1rem;
            font-size: 1.1rem;
            border: 2px solid var(--gray-light);
            border-radius: 10px;
            margin-top: 0.75rem;
            margin-bottom: 0.75rem;
            font-family: inherit;
            color: var(--navy-dark);
            background: var(--white);
            letter-spacing: 0.08em;
        }
        .y-card input:focus-visible { outline: none; border-color: var(--navy-medium); }
        .y-btn-primary {
            width: 100%;
            padding: 0.95rem 1.25rem;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-family: inherit;
            background: var(--navy-primary);
            color: var(--white);
            transition: background 0.15s, box-shadow 0.15s, transform 0.08s;
        }
        .y-btn-primary:hover { background: var(--navy-dark); box-shadow: 0 4px 14px rgba(44, 86, 165, 0.35); }
        .y-btn-primary:active { transform: scale(0.98); }
        .y-hata {
            color: #C73E3A;
            font-size: 0.9rem;
            margin-top: 0.5rem;
            padding: 0.5rem 0.75rem;
            background: rgba(199, 62, 58, 0.08);
            border-radius: 8px;
        }

        .content { padding: 24px; }
        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 24px;
        }
        .topbar h1 {
            font-family: 'Playfair Display', serif;
            font-weight: 700;
            font-size: 1.8rem;
            color: var(--navy-dark);
            margin-bottom: 8px;
        }
        .topbar p { color: var(--text-muted); margin: 0; }
        .topbar button {
            background: transparent;
            border: 1px solid var(--gray-light);
            color: var(--navy-medium);
            padding: 8px 14px;
            font-size: 0.85rem;
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            flex-shrink: 0;
        }
        .topbar button:hover { background: var(--white); border-color: var(--navy-medium); }

        .sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 900px) { .sheet { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .sheet { grid-template-columns: 1fr; } }
        .card { background: white; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(44, 86, 165, 0.06); }
        .card .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        figure { margin: 0; text-align: center; }
        img { width: 100%; height: auto; display: block; }
        figcaption { font-size: 11px; margin-top: 4px; color: var(--text-muted); }
    </style>
</head>
<body class="view-gate">

    <section class="gate">
        <section class="y-card">
            <h2>Kod Girişi</h2>
            <form id="gateForm" autocomplete="off">
                <input
                    id="pinInput"
                    name="pin"
                    type="password"
                    inputmode="numeric"
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                    maxlength="8"
                    required>
                <button type="submit" class="y-btn-primary">Giriş</button>
                <p id="gateHata" class="y-hata" hidden>Yanlış kod.</p>
            </form>
        </section>
    </section>

    <main class="content">
        <div class="topbar">
            <div>
                <h1>MFL FBÇ '26 — Yaka Kartı QR Kontrol Sayfası</h1>
                <p>400 kart × 2 öğün = 800 QR. Basım öncesi rastgele örneklerin telefonla taranıp doğru URL'i gösterdiği teyit edilmeli.</p>
            </div>
            <button id="logoutBtn" type="button" aria-label="Çıkış">Çıkış</button>
        </div>
`;

const tail = `
    </main>

    <script>
        (function () {
            'use strict';
            var PIN_KEY = 'mfl-yqr-unlocked';
            var EXPECTED = '0910';
            var body = document.body;
            var form = document.getElementById('gateForm');
            var input = document.getElementById('pinInput');
            var hata = document.getElementById('gateHata');
            var logoutBtn = document.getElementById('logoutBtn');

            if (sessionStorage.getItem(PIN_KEY) === '1') {
                body.className = 'view-content';
            }

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                if (input.value.trim() === EXPECTED) {
                    sessionStorage.setItem(PIN_KEY, '1');
                    hata.hidden = true;
                    body.className = 'view-content';
                } else {
                    hata.hidden = false;
                    input.value = '';
                    input.focus();
                }
            });

            logoutBtn.addEventListener('click', function () {
                sessionStorage.removeItem(PIN_KEY);
                body.className = 'view-gate';
                input.value = '';
                setTimeout(function () { input.focus(); }, 50);
            });
        })();
    </script>
</body>
</html>
`;

const out = head + grid + tail;
const target = resolve(repoRoot, 'yemekqrkodlari', 'index.html');
writeFileSync(target, out, 'utf-8');
console.log(`Wrote ${target} (${out.length} bytes, grid ${grid.length} bytes)`);
