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

test('練習モード：時間・スコアなし、不正解は選び直し、正解後は「次へ」「練習をやめる」', async () => {
    const window = await loadApp({ seed: 13, storage: { highScore_expand_60_normal: '500' } });
    const { document } = window;
    const button = (type, match) => Array.from(document.querySelectorAll(`.answer-btn[data-type="${type}"]`))
        .find(b => match(parseInt(b.getAttribute('data-value'))));
    const controlsShown = () => document.getElementById('practiceControls').classList.contains('show');

    document.getElementById('timePractice').click();
    assert.ok(document.getElementById('timePractice').classList.contains('active'));
    assert.ok(!document.getElementById('time60').classList.contains('active'));
    assert.equal(window.run('timeMode'), 60, '1分/3分の設定は残る');

    // カウントダウンなしで1問目が出て、タイマー・コンボゲージは動かない
    window.run(`startGame('expand')`);
    assert.ok(!document.getElementById('countdownOverlay').classList.contains('show'));
    assert.ok(document.body.classList.contains('practice-mode'));
    assert.equal(document.getElementById('timerDisplay').textContent, '練習モード');
    assert.equal(window.run('timer'), null);
    assert.equal(document.getElementById('comboGaugeContainer').style.display, 'none');
    const question = window.run('currentQuestion.original');

    // 不正解：問題はそのまま、選択が外れてもう一度選べる
    button('x', v => v !== window.run('currentQuestion.xCoeff')).click();
    assert.ok(document.querySelector('.answer-btn.wrong'));
    assert.ok(!controlsShown());
    await sleep(900);
    assert.equal(window.run('currentQuestion.original'), question);
    assert.equal(document.querySelectorAll('.answer-btn.selected, .answer-btn.wrong').length, 0);
    assert.equal(window.run('answeredCurrentQuestion'), false);

    // 正解：次の問題には進まず「次へ」「練習をやめる」が出る。得点・記録はつけない
    const xCoeff = window.run('currentQuestion.xCoeff');
    const constant = window.run('currentQuestion.constant');
    if (xCoeff !== 0) button('x', v => v === xCoeff).click();
    if (constant !== 0) button('const', v => v === constant).click();
    assert.ok(controlsShown());
    assert.equal(window.run('currentQuestion.original'), question);
    assert.ok(document.getElementById('answerGrid').classList.contains('practice-locked'));
    // ヒントボタンを使わずに正解しても、ヒント文が出る
    assert.ok(document.getElementById('practiceHint').classList.contains('show'));
    assert.ok(document.getElementById('practiceHint').textContent.startsWith('ヒント'));
    // ボタンは「正解!」と同じ行に出る
    const row = document.getElementById('comboDisplay').parentElement;
    assert.equal(document.getElementById('practiceControls').parentElement, row);
    assert.ok(document.getElementById('comboDisplay').textContent.includes('正解!'));
    assert.deepEqual([window.run('score'), window.run('correctAnswers'), window.run('wrongAnswers'), window.run('questionHistory.length')], [0, 0, 0, 0]);

    // 「次へ」で次の問題（ヒント文は消える）
    document.querySelector('#practiceControls .practice-next-btn').click();
    assert.notEqual(window.run('currentQuestion.original'), question);
    assert.ok(!controlsShown());
    assert.ok(!document.getElementById('practiceHint').classList.contains('show'));

    // 「練習をやめる」でタイトルへ。ハイスコアは変わらない
    window.run('correctAnswer()');
    assert.ok(controlsShown());
    document.querySelector('#practiceControls .practice-quit-btn').click();
    assert.ok(document.getElementById('titleScreen').classList.contains('active'));
    assert.ok(!document.body.classList.contains('practice-mode'));
    assert.ok(!controlsShown());
    assert.equal(window.localStorage.getItem('highScore_expand_60_normal'), '500');

    // 1分に戻すと、いつものゲーム（カウントダウンあり）
    document.getElementById('time60').click();
    window.run(`startGame('expand')`);
    assert.ok(document.getElementById('countdownOverlay').classList.contains('show'));
    assert.ok(!document.body.classList.contains('practice-mode'));
    window.run('goToTitle()');
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('練習モード：因数分解・平方根・ハードでも、正解するまで同じ問題で次へ進まない', async () => {
    const window = await loadApp({ seed: 21 });
    window.run(`selectTime('practice')`);
    for (const [mode, diff] of [['factorize', 'normal'], ['squareRoot', 'normal'], ['expand', 'hard'], ['factorize', 'hard'], ['squareRoot', 'hard']]) {
        window.run(`selectDifficulty('${diff}'); startGame('${mode}')`);
        for (let i = 0; i < 5; i++) {
            const question = window.run('currentQuestion.original');
            window.run('wrongAnswer()');
            assert.equal(window.run('currentQuestion.original'), question, `${mode}/${diff}`);
            window.run('clearAllTimeouts(); answeredCurrentQuestion = false;');
            window.run('correctAnswer()');
            assert.equal(window.run('currentQuestion.original'), question, `${mode}/${diff}`);
            assert.ok(window.document.getElementById('practiceControls').classList.contains('show'));
            window.run('nextPracticeQuestion()');
        }
        assert.deepEqual([window.run('score'), window.run('correctAnswers'), window.run('wrongAnswers')], [0, 0, 0]);
        window.run('goToTitle()');
    }
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('練習モード：ヒントボタンは最初から出ていて、押すとヒント文だけを出す（ボタンは光らない）。式は正しい', async () => {
    const window = await loadApp({ seed: 31 });
    const results = JSON.parse(window.run(`JSON.stringify((() => { const out = [];
        selectTime('practice');
        for (const m of ['expand', 'factorize', 'squareRoot']) for (const d of ['normal', 'hard']) {
            selectDifficulty(d); startGame(m);
            for (let i = 0; i < 150; i++) {
                const hint = document.getElementById('practiceHint');
                const hiddenBefore = !hint.classList.contains('show');
                const buttonShown = document.getElementById('helpButton').classList.contains('show');
                showCorrectAnswerHint();
                out.push({ mode: m, q: currentQuestion, last: lastQuestionValues, hiddenBefore, buttonShown, shown: hint.classList.contains('show'), text: hint.textContent, lit: document.querySelectorAll('.hint-highlight').length });
                clearAllTimeouts();
                nextPracticeQuestion();
            }
            goToTitle();
        } return out; })())`));
    // 表示用の式（2×(−3)、(−4)² など）を計算する
    const calc = expr => Function(`return (${expr.replace(/−/g, '-').replace(/×/g, '*').replace(/(\d+|\([^()]*\))²/g, '($1**2)')})`)();
    const patterns = new Set();
    results.forEach(r => {
        const where = `${r.mode} ${r.q.original}: ${r.text}`;
        patterns.add(`${r.mode}:${r.q.hardPattern}:${r.q.isFraction}`);
        assert.ok(r.hiddenBefore, `${where} 次の問題ではヒント文が消える`);
        assert.ok(r.shown && r.text.startsWith('ヒント'), where);
        assert.ok(r.buttonShown, `${where} ヒントボタンは最初から出ている`);
        assert.equal(r.lit, 0, `${where} 正解のボタンは光らない`);
        // スマホ縦画面でも3行に収まる長さ（「ヒント」ラベルを含めて）
        assert.ok(r.text.length <= 58, `${where} 長すぎる（${r.text.length}文字）`);
        if (r.mode === 'expand') {
            const want = { 'x²': r.q.x2Coeff ?? 1, x: r.q.xCoeff, xy: r.q.xyCoeff, 'y²': r.q.y2Coeff, 定数項: r.q.constant };
            for (const [, name, expr] of r.text.matchAll(/(x²|xy|x|y²)の係数は ([\d()+−×²]+)|(定数項)は ([\d()+−×²]+)/g).map(m => [m[0], m[1] || m[3], m[2] || m[4]])) {
                assert.equal(calc(expr), want[name], `${where}（${name}）`);
            }
        } else if (r.mode === 'factorize' && /かけて/.test(r.text)) {
            const [, prod, sum] = r.text.match(/かけて (−?\d+)、たして (−?\d+)/).map(v => v && Number(v.replace('−', '-')));
            const [a, b] = r.q.hardPattern === 1 ? [r.q.a, r.q.b] : [r.q.p, r.q.q];
            assert.deepEqual([prod, sum], [a * b, a + b], where);
        } else if (r.mode === 'squareRoot' && !r.q.isFraction && r.q.b !== 1) {
            const [, x, expr] = r.text.match(/(\d+)=(\d+×\d+)/);
            assert.equal(Number(x), r.q.x, where);
            assert.equal(calc(expr), r.q.x, where);
        }
    });
    // (x+a)(x−a) の形は、和と差の公式のヒントになる
    const diffs = results.filter(r => (r.mode === 'expand' && [0, 1, 6].includes(r.q.hardPattern) && r.last.a === -r.last.b) ||
        (r.mode === 'factorize' && (r.q.hardPattern === 0 ? r.q.p === -r.q.q : r.q.hardPattern === 1 && r.q.a === -r.q.b)));
    assert.ok(diffs.some(r => r.mode === 'expand') && diffs.some(r => r.mode === 'factorize'), '和と差の形の問題が出ている');
    diffs.forEach(r => assert.ok(r.text.includes('(x+a)(x−a)') && !r.text.includes('(x+b)') && !r.text.includes('かけて'), `${r.q.original}: ${r.text}`));
    // 答えが (x+a)² になる因数分解は、2乗の公式のヒントになる
    const squares = results.filter(r => r.mode === 'factorize' && r.q.hardPattern === 0 && r.q.p === r.q.q);
    assert.ok(squares.length > 0, '答えが (x+a)² の問題が出ている');
    squares.forEach(r => {
        const where = `${r.q.original}: ${r.text}`;
        assert.ok(!r.text.includes('かけて'), where);
        const [, sq, root, expr, coeff] = r.text.match(/(\d+)=(\d+)²、xの係数が (2×[\d()−]+)=(−?\d+)/);
        assert.equal(Number(sq), r.q.p * r.q.p, where);
        assert.equal(Number(root), Math.abs(r.q.p), where);
        assert.equal(calc(expr), 2 * r.q.p, where);
        assert.equal(Number(coeff.replace('−', '-')), 2 * r.q.p, where);
    });
    // ハードの各パターン（展開1〜7、因数分解1〜6、平方根の有理化）も出ている
    for (const p of ['expand:0:undefined', 'expand:1:undefined', 'expand:7:undefined', 'factorize:0:undefined', 'factorize:6:undefined', 'squareRoot:undefined:true', 'squareRoot:undefined:false']) {
        assert.ok(patterns.has(p), p);
    }
    // 通常のゲームでは、ヒント文は出ない
    window.run(`selectTime(60); startGame('expand'); clearAllTimeouts(); generateQuestion();`);
    assert.ok(!window.document.getElementById('helpButton').classList.contains('show'), '通常のゲームではヒントボタンは10秒後');
    window.run('showCorrectAnswerHint()');
    assert.ok(!window.document.getElementById('practiceHint').classList.contains('show'));
    assert.ok(window.document.querySelectorAll('.hint-highlight').length >= 1, '通常のゲームでは正解のボタンが光る');
    window.run('goToTitle()');
    assert.deepEqual(window.__errors, []);
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
