// 既存ゲームの回帰テスト（ファイル分割・チュートリアル追加の前後で動作が変わっていないこと）
const test = require('node:test');
const assert = require('node:assert/strict');
const golden = require('../fixtures/game-golden.json');
const { loadApp } = require('../helpers/load-app');
const { fingerprint, SEEDS } = require('../helpers/game-fingerprint');
const { equivalent } = require('../helpers/math-eval');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// 基準はリファクタリング前の動作に、共通因数パターンのヒント修正だけを加えたもの
test('出題・ヒント・段位・結果画面が基準と完全に一致する', async () => {
    for (const seed of SEEDS) {
        const window = await loadApp({ seed, now: 1700000000000 });
        assert.deepEqual(window.__errors, []);
        assert.deepEqual(fingerprint(window), golden.seeds[seed], `seed ${seed}`);
        window.close();
    }
});

test('出題される問題の答えは数学的に正しい（全モード・全難易度）', async () => {
    const window = await loadApp({ seed: 99 });
    const pairs = window.run(`(() => { const out = [];
        for (const m of ['expand', 'factorize', 'squareRoot']) for (const d of ['normal', 'hard']) {
            gameMode = m; difficultyMode = d; lastQuestionValues = null;
            for (let i = 0; i < 400; i++) { generateQuestion(); out.push([m + '/' + d, currentQuestion.original, currentQuestion.answer]); clearAllTimeouts(); stopComboGauge(); }
        } return out; })()`);
    assert.equal(pairs.length, 2400);
    pairs.forEach(([where, question, answer]) => {
        assert.ok(equivalent(question, answer), `${where}: ${question} ≠ ${answer}`);
    });
    window.close();
});

test('段位：(正解 − 不正解 + コンボ補正) ÷ 係数 で21段階', async () => {
    const window = await loadApp();
    const rank = (mode, diff, time, c, w, m) => window.run(`gameMode='${mode}'; difficultyMode='${diff}'; timeMode=${time}; calculateRank(${c}, ${w}, ${m})`);
    // 展開ノーマル1分は係数1.5：15問正解・ミス0・最大コンボ1 → 15/1.5 = 10 → 初段
    assert.equal(rank('expand', 'normal', 60, 15, 0, 1), '初段');
    // コンボ補正 (最大コンボ-1)×0.1 は最大0.9：14 + 0.9 = 14.9 → 9.93 → 1級
    assert.equal(rank('expand', 'normal', 60, 14, 0, 30), '1級');
    // 平方根ハード3分は係数4.9
    assert.equal(rank('squareRoot', 'hard', 180, 49, 0, 1), '初段');
    // マイナスにはならない／上限は皆伝
    assert.equal(rank('factorize', 'normal', 60, 0, 5, 0), '10級');
    assert.equal(rank('factorize', 'normal', 60, 500, 0, 1), '皆伝');
    window.close();
});

test('得点：正解は (10+コンボ数)²、不正解は −200（0未満にならない）', async () => {
    const window = await loadApp({ seed: 3 });
    window.run(`gameMode='expand'; difficultyMode='normal'; score=0; consecutiveCorrect=0; maxCombo=0; correctAnswers=0; wrongAnswers=0; isLastQuestion=false; generateQuestion();`);
    window.run('correctAnswer(); clearAllTimeouts();');
    assert.equal(window.run('score'), 121); // (10+1)²
    window.run('comboGaugeValue = 50; correctAnswer(); clearAllTimeouts();');
    assert.equal(window.run('score'), 121 + 144); // (10+2)²
    assert.equal(window.run('maxCombo'), 2);
    window.run('wrongAnswer(); clearAllTimeouts();');
    assert.equal(window.run('score'), 65);
    assert.equal(window.run('consecutiveCorrect'), 0);
    window.run('generateQuestion(); wrongAnswer(); clearAllTimeouts();');
    assert.equal(window.run('score'), 0);
    assert.equal(window.run('wrongAnswers'), 2);
    // ゲージが尽きていたらコンボは1から数え直し
    window.run('generateQuestion(); correctAnswer(); clearAllTimeouts(); generateQuestion(); comboGaugeValue = 0; correctAnswer(); clearAllTimeouts();');
    assert.equal(window.run('consecutiveCorrect'), 1);
    window.close();
});

test('ハイスコア：既存の保存データを読み込み、同じキー形式で更新する', async () => {
    const storage = { highScore_expand_60_normal: '500', highScore_squareRoot_180_hard: '1200' };
    const window = await loadApp({ storage });
    window.run(`gameMode='expand'; timeMode=60; difficultyMode='normal'; score=300; questionHistory=[]; endGame();`);
    assert.equal(window.document.getElementById('highScore').textContent, '500');
    assert.equal(window.localStorage.getItem('highScore_expand_60_normal'), '500');
    window.run(`score=900; endGame();`);
    assert.equal(window.localStorage.getItem('highScore_expand_60_normal'), '900');
    assert.equal(window.localStorage.getItem('highScore_squareRoot_180_hard'), '1200');
    assert.ok(window.document.getElementById('resultScreen').classList.contains('active'));
    window.close();
});

test('ヒント：ノーマルは正解を1つ、ハードは最大2つハイライトする', async () => {
    const window = await loadApp({ seed: 5 });
    const counts = window.run(`(() => { const out = [];
        for (const m of ['expand', 'factorize', 'squareRoot']) for (const d of ['normal', 'hard']) {
            gameMode = m; difficultyMode = d; lastQuestionValues = null;
            for (let i = 0; i < 100; i++) {
                generateQuestion(); showCorrectAnswerHint();
                out.push([m, d, currentQuestion.hardPattern || null, document.querySelectorAll('.hint-highlight').length]);
                clearAllTimeouts(); stopComboGauge();
            }
        } return out; })()`);
    counts.forEach(([mode, diff, pattern, n]) => {
        const max = diff === 'hard' ? 2 : 1;
        assert.ok(n >= 1 && n <= max, `${mode}/${diff} pattern ${pattern}: ${n}`);
    });
    window.close();
});

test('ヒント：共通因数パターンでハイライトされた選択肢は、押すと正解として判定される', async () => {
    const window = await loadApp({ seed: 12 });
    const results = JSON.parse(window.run(`JSON.stringify((() => { const out = { expand: [], factorize: [] };
        difficultyMode = 'hard'; isLastQuestion = false;
        for (const [mode, pattern] of [['expand', 7], ['factorize', 6]]) {
            gameMode = mode; lastQuestionValues = null;
            let found = 0;
            for (let i = 0; i < 400 && found < 30; i++) {
                generateQuestion();
                if (currentQuestion.hardPattern !== pattern) { clearAllTimeouts(); stopComboGauge(); continue; }
                found++;
                const before = { c: correctAnswers, w: wrongAnswers };
                showCorrectAnswerHint();
                const lit = Array.from(document.querySelectorAll('.hint-highlight'));
                lit.forEach(b => b.click());
                out[mode].push({ lit: lit.length, correct: correctAnswers - before.c, wrong: wrongAnswers - before.w });
                clearAllTimeouts(); stopComboGauge();
            }
        } return out; })())`));
    // 展開：正解の2つ（x²の係数・xの係数）が光り、両方押すと正解
    assert.equal(results.expand.length, 30);
    results.expand.forEach(r => assert.deepEqual(r, { lit: 2, correct: 1, wrong: 0 }));
    // 因数分解：正解の1つ（共通因数 または 残りの因数）が光り、押しても不正解にならない
    assert.equal(results.factorize.length, 30);
    results.factorize.forEach(r => assert.deepEqual(r, { lit: 1, correct: 0, wrong: 0 }));
    window.close();
});

test('最終問題：時間切れで不正解になり、結果画面へ進む', async () => {
    const window = await loadApp({ seed: 8 });
    window.run(`gameMode='squareRoot'; difficultyMode='normal'; timeMode=60; isLastQuestion=true; questionHistory=[]; generateQuestion();`);
    assert.ok(window.run('lastQuestionTimeout !== null'), '20秒タイマーが設定される');
    window.run('handleQuestionTimeout();');
    await sleep(2200);
    assert.equal(window.run('wrongAnswers'), 1);
    assert.ok(window.document.getElementById('resultScreen').classList.contains('active'));
    window.close();
});

test('タイトル画面：設定・効果音・「？」解説・リンク・リトライ・戻る', async () => {
    const window = await loadApp({ seed: 2 });
    const { document } = window;
    assert.equal(document.querySelector('.lab-link').getAttribute('href'), 'https://taka-t-p.github.io/math-app-portal/');
    assert.ok(document.getElementById('catchphrase').textContent.length > 0);

    document.getElementById('time180').click();
    document.getElementById('difficultyHard').click();
    assert.equal(window.run('timeMode'), 180);
    assert.equal(window.run('difficultyMode'), 'hard');
    assert.ok(document.body.classList.contains('hard-mode'));
    document.getElementById('difficultyNormal').click();
    document.getElementById('time60').click();

    document.getElementById('audioToggleBtn').click();
    assert.equal(window.run('audioEnabled'), false);
    const before = window.__soundsPlayed || 0;
    window.run('playSound(wrongSound)');
    assert.equal(window.__soundsPlayed || 0, before);
    document.getElementById('audioToggleBtn').click();
    assert.equal(window.run('audioEnabled'), true);

    for (const [mode, title] of [['expand', '展開ラッシュ'], ['factorize', '因数分解ラッシュ'], ['squareRoot', '平方根ラッシュ']]) {
        window.run(`showHelp('${mode}')`);
        assert.ok(document.getElementById('helpScreen').classList.contains('active'));
        assert.ok(document.getElementById('helpTitle').textContent.startsWith(title));
        window.run('closeHelp()');
        assert.ok(document.getElementById('titleScreen').classList.contains('active'));
    }

    window.run(`startGame('expand')`);
    assert.equal(window.run('gameMode'), 'expand');
    window.run('retryGame()');
    assert.equal(window.run('score'), 0);
    window.run('goToTitle()');
    assert.ok(document.getElementById('titleScreen').classList.contains('active'));
    assert.deepEqual(window.__errors, []);
    window.close();
});
