// テスト用：index.html と実際のスクリプトを jsdom 上で読み込む
const { JSDOM, VirtualConsole, requestInterceptor } = require('jsdom');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const ORIGIN = 'http://localhost/';
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' };

// http://localhost/... をページのあるディレクトリのファイルとして返す
function localResources(baseDir) {
    return {
        interceptors: [
            requestInterceptor(async (request) => {
                if (!request.url.startsWith(ORIGIN)) return undefined;
                const file = path.join(baseDir, decodeURIComponent(new URL(request.url).pathname));
                try {
                    const body = await fs.promises.readFile(file);
                    return new Response(body, { headers: { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' } });
                } catch (error) {
                    return new Response('not found', { status: 404 });
                }
            }),
        ],
    };
}

// 再現性のある乱数（xorshift32）
function seededRandom(seed) {
    let s = seed >>> 0 || 1;
    return () => {
        s ^= s << 13; s >>>= 0;
        s ^= s >>> 17;
        s ^= s << 5; s >>>= 0;
        return s / 4294967296;
    };
}

// 効果音はテストでは鳴らさない
function stubAudio(window) {
    class FakeNode {
        connect() {}
        start() {}
        stop() {}
    }
    class FakeAudioContext {
        constructor() {
            this.currentTime = 0;
            this.destination = {};
        }
        createOscillator() {
            const node = new FakeNode();
            node.frequency = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} };
            return node;
        }
        createGain() {
            const node = new FakeNode();
            node.gain = { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} };
            return node;
        }
    }
    window.AudioContext = FakeAudioContext;
    window.webkitAudioContext = FakeAudioContext;
    window.HTMLMediaElement.prototype.play = function () {
        window.__soundsPlayed = (window.__soundsPlayed || 0) + 1;
        return Promise.resolve();
    };
}

/**
 * アプリを読み込んで window を返す。
 * options.file   読み込むHTML（既定は index.html）
 * options.seed   Math.random のシード
 * options.storage 事前に localStorage に入れておく {key: value}
 * options.now    Date.now を固定する値
 * options.setup  スクリプト実行前に window を細工する関数（保存できない環境の再現など）
 */
async function loadApp(options = {}) {
    const file = options.file || path.join(ROOT, 'index.html');
    const errors = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', (e) => errors.push(e));
    virtualConsole.on('error', (e) => errors.push(e));

    const dom = await JSDOM.fromFile(file, {
        url: ORIGIN,
        runScripts: 'dangerously',
        resources: localResources(path.dirname(file)),
        pretendToBeVisual: true,
        virtualConsole,
        beforeParse(window) {
            if (options.seed !== undefined) {
                window.Math.random = seededRandom(options.seed);
            }
            if (options.now !== undefined) {
                window.Date.now = () => options.now;
            }
            if (options.storage) {
                for (const [k, v] of Object.entries(options.storage)) {
                    window.localStorage.setItem(k, v);
                }
            }
            if (options.reducedMotion !== undefined || !window.matchMedia) {
                window.matchMedia = (q) => ({
                    matches: q.includes('reduce') ? !!options.reducedMotion : false,
                    media: q,
                    addEventListener() {},
                    removeEventListener() {},
                    addListener() {},
                    removeListener() {},
                });
            }
            stubAudio(window);
            if (options.setup) options.setup(window);
        },
    });

    const { window } = dom;
    if (window.document.readyState !== 'complete') {
        await new Promise((resolve) => window.addEventListener('load', resolve));
    }
    window.__errors = errors;
    // ページのグローバル（let 宣言も含む）を評価するためのヘルパー
    window.run = (code) => window.eval(code);
    return window;
}

module.exports = { loadApp, seededRandom, ROOT };
