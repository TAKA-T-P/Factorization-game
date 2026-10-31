// 既存ゲームの「指紋」を作って tests/fixtures/game-golden.json に保存する
// 使い方: node tests/tools/make-game-golden.js <index.html> "<作成元の説明>"
//   出題ロジックを意図して変更したときに、変更後の index.html で作り直す。
//   例: node tests/tools/make-game-golden.js index.html "共通因数パターンのヒント修正後"
//   作り直す前に、変更していない部分の動作が変わっていないことを確かめること。
const fs = require('node:fs');
const path = require('node:path');
const { loadApp } = require('../helpers/load-app');
const { fingerprint, SEEDS } = require('../helpers/game-fingerprint');

(async () => {
    const file = path.resolve(process.argv[2]);
    const golden = { source: process.argv[3] || process.argv[2], seeds: {} };
    for (const seed of SEEDS) {
        const window = await loadApp({ file, seed, now: 1700000000000 });
        if (window.__errors.length) throw window.__errors[0];
        golden.seeds[seed] = fingerprint(window);
        window.close();
    }
    const out = path.join(__dirname, '..', 'fixtures', 'game-golden.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(golden, null, 2) + '\n');
    console.log(`saved ${out}`);
})();
