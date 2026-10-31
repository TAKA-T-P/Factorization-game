// 既存ゲームの動作の「指紋」：決まった乱数で出題・ヒント・段位・結果画面を作り、ハッシュにまとめる
// 基準の値を tests/fixtures/game-golden.json に保存してあり、今のコードと一致するかをテストで確かめる。
// 基準：リファクタリング前（タグ pre-tutorial-refactor）の動作に、共通因数パターンのヒント修正だけを加えたもの。
const crypto = require('node:crypto');

const FINGERPRINT_SCRIPT = `(() => {
    const out = {};
    for (const mode of ['expand', 'factorize', 'squareRoot']) {
        for (const diff of ['normal', 'hard']) {
            gameMode = mode; difficultyMode = diff; lastQuestionValues = null; isLastQuestion = false;
            const items = [];
            for (let i = 0; i < 300; i++) {
                generateQuestion();
                items.push(JSON.stringify(currentQuestion), document.getElementById('question').innerHTML, document.getElementById('answerGrid').innerHTML);
                showCorrectAnswerHint();
                items.push(Array.from(document.querySelectorAll('.hint-highlight')).map(b => b.outerHTML).join(''));
                clearAllTimeouts(); stopComboGauge();
            }
            out['questions:' + mode + ':' + diff] = items;
        }
    }
    const ranksOut = [];
    for (const mode of ['expand', 'factorize', 'squareRoot']) for (const diff of ['normal', 'hard']) for (const t of [60, 180]) {
        gameMode = mode; difficultyMode = diff; timeMode = t;
        for (let c = 0; c < 70; c += 3) for (let w = 0; w < 5; w++) for (const m of [0, 1, 2, 5, 10, 30]) ranksOut.push(calculateRank(c, w, m));
        for (let n = 0; n < 20; n++) { consecutiveCorrect = n; ranksOut.push(getGaugeSpeedMultiplier()); }
    }
    out.ranks = ranksOut;
    const results = [];
    for (const mode of ['expand', 'factorize', 'squareRoot']) for (const diff of ['normal', 'hard']) for (const t of [60, 180]) {
        gameMode = mode; difficultyMode = diff; timeMode = t;
        score = 777; correctAnswers = 7; wrongAnswers = 2; maxCombo = 4;
        questionHistory = [
            { question: '√12', answer: '2√3', correct: true, time: '1.2' },
            { question: '(x+1)(x+2)', answer: 'x²+3x+2', correct: false, time: '3.4' },
            { question: '6/√2', answer: '3√2', correct: true, time: '2.0' },
        ];
        endGame();
        results.push(document.getElementById('resultScreen').innerHTML);
    }
    out.results = results;
    return out;
})()`;

function sha(items) {
    return crypto.createHash('sha256').update(items.join('\u0000')).digest('hex');
}

// window はシード固定で読み込んだアプリ
function fingerprint(window) {
    const raw = window.eval(FINGERPRINT_SCRIPT);
    const out = {};
    Object.keys(raw).forEach(key => { out[key] = sha(raw[key]); });
    return out;
}

module.exports = { fingerprint, SEEDS: [1, 20261031] };
