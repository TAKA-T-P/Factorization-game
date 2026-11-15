// 練習モード（時間制限なし・スコアや段位なし。正解するまで同じ問題、「次へ」で次の問題）

// 練習モードを始める（カウントダウンなしで1問目を出す）
function startPractice() {
    document.body.classList.add('practice-mode');
    document.getElementById('timerDisplay').textContent = '練習モード';
    hidePracticeControls();
    generateQuestion();
}

// 正解：次の問題には進まず、「次へ」「練習をやめる」を出す
function practiceCorrectAnswer() {
    hideHelpButton();
    playSound(correctSound);

    document.querySelectorAll('.answer-btn.selected').forEach(btn => {
        btn.classList.add('correct');
    });
    document.getElementById('answerGrid').classList.add('practice-locked');

    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.innerHTML = '<span>正解!</span>';
    comboDisplay.classList.add('show');

    // ヒントを使わずに正解したときも、ふり返り用に考え方を出す
    if (!document.getElementById('practiceHint').classList.contains('show')) {
        showPracticeHintText();
    }

    document.getElementById('practiceControls').classList.add('show');
}

// 不正解：問題はそのまま。選んだものを少し見せてから選択を外し、もう一度選べるようにする
function practiceWrongAnswer() {
    playSound(wrongSound);

    document.querySelectorAll('.answer-btn.selected').forEach(btn => {
        btn.classList.add('wrong');
    });
    const answerGrid = document.getElementById('answerGrid');
    answerGrid.classList.add('practice-locked');

    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.innerHTML = '<span class="practice-retry">もう一度!</span>';
    comboDisplay.classList.add('show');

    setTrackedTimeout(() => {
        document.querySelectorAll('.answer-btn').forEach(btn => {
            btn.classList.remove('selected', 'wrong');
        });
        selectedAnswers = [];
        answerGrid.classList.remove('practice-locked');
        comboDisplay.classList.remove('show');
        answeredCurrentQuestion = false;
    }, 800);
}

// ヒントボタンを押したとき、上部に考え方のヒントを出す（表示する場所は空けてあるので、問題や選択肢は動かない）
function showPracticeHintText() {
    const text = getPracticeHintText();
    if (!text) return;
    const hint = document.getElementById('practiceHint');
    hint.innerHTML = `<span class="practice-hint-label">ヒント</span><span>${text}</span>`;
    hint.classList.add('show');
}

function clearPracticeHintText() {
    const hint = document.getElementById('practiceHint');
    hint.classList.remove('show');
    hint.innerHTML = '';
}

// 負の数は ( ) を付ける
function practiceNum(n) {
    return n < 0 ? `(${n})` : `${n}`;
}

// 1 や -1 の係数は省略した形（文字の前に付ける）
function practiceCoeff(n) {
    return n === 1 ? '' : n === -1 ? '-' : `${n}`;
}

// 出題中の問題に合わせたヒント文（HTML）
function getPracticeHintText() {
    const q = currentQuestion;
    if (!q) return '';
    let text = '';

    if (gameMode === 'expand') {
        const pattern = q.hardPattern;
        if (pattern === 0 || pattern === 6) {
            const { a, b } = lastQuestionValues;
            if (a === b) {
                text = `(x+a)²=x²+2ax+a²。xの係数は 2×${practiceNum(a)}、定数項は ${practiceNum(a)}²`;
            } else if (a === -b) {
                text = `(x+a)(x-a)=x²-a²（まん中の項は消える）。定数項は -${Math.abs(a)}²`;
            } else {
                text = `(x+a)(x+b)=x²+(a+b)x+ab。xの係数は ${a}+${practiceNum(b)}、定数項は ${a}×${practiceNum(b)}`;
            }
        } else if (pattern === 1 && lastQuestionValues.a === -lastQuestionValues.b) {
            const a = Math.abs(lastQuestionValues.a);
            text = `(x+a)(x-a)=x²-a²（まん中の項は消える）。a が ${practiceCoeff(a)}y なので、y²の係数は -${a}²`;
        } else if (pattern === 1) {
            const { a, b } = lastQuestionValues;
            text = `数のかわりに y がついただけ。xyの係数は ${a}+${practiceNum(b)}、y²の係数は ${a}×${practiceNum(b)}`;
        } else if (pattern === 2 || pattern === 3) {
            const { c, d } = lastQuestionValues;
            const v = pattern === 2 ? ['x', ''] : ['xy', 'y²'];
            text = `(a+b)²=a²+2ab+b²。x²の係数は ${c}²、${v[0]}の係数は 2×${c}×${practiceNum(d)}、${pattern === 2 ? '定数項' : 'y²の係数'}は ${practiceNum(d)}²`;
        } else if (pattern === 4 || pattern === 5) {
            const { c, d } = lastQuestionValues;
            text = `(a+b)(a-b)=a²-b²（まん中の項は消える）。x²の係数は ${c}²、${pattern === 4 ? '定数項' : 'y²の係数'}は -${d}²`;
        } else if (pattern === 7) {
            const outer = `${practiceCoeff(q.a)}x${q.subPattern >= 5 ? 'y' : ''}`;
            text = `かっこの外の ${outer} を、かっこの中の **2つの項の両方** にかけよう（数どうし・文字どうしをかける）`;
        }
    } else if (gameMode === 'factorize') {
        const pattern = q.hardPattern;
        if (pattern === 0 && q.p === -q.q) {
            const a = Math.abs(q.p);
            text = `x²-a²=(x+a)(x-a) の形（2乗 − 2乗）。${a * a}=${a}² だよ`;
        } else if (pattern === 0 && q.p === q.q) {
            // 答えが (x+a)² になる問題
            text = `${q.p * q.p}=${Math.abs(q.p)}²、xの係数が 2×${practiceNum(q.p)}=${2 * q.p} になっているね。答えは (x+□)² の形`;
        } else if (pattern === 0) {
            text = `かけて ${q.p * q.q}、たして ${q.p + q.q} になる2つの数を探そう`;
        } else if (pattern === 1 && q.a === -q.b) {
            const a = Math.abs(q.a);
            text = `x²-a²=(x+a)(x-a) の形（2乗 − 2乗）。${a === 1 ? 'y² は y の2乗' : `${a * a}y²=(${a}y)²`} だよ`;
        } else if (pattern === 1) {
            text = `かけて ${q.a * q.b}、たして ${q.a + q.b} になる2つの数を探そう。答えは (x+□y)(x+□y) の形`;
        } else if (pattern === 2 || pattern === 3) {
            const d = Math.abs(q.d);
            text = `${q.c * q.c}=${q.c}²、${d * d}=${d}² なので (□x+□${pattern === 3 ? 'y' : ''})² の形。まん中の項の符号に注意しよう`;
        } else if (pattern === 4 || pattern === 5) {
            text = `2乗 − 2乗 の形。${q.c * q.c}=${q.c}²、${q.d * q.d}=${q.d}² なので (□x+□${pattern === 5 ? 'y' : ''})(□x-□${pattern === 5 ? 'y' : ''}) の形`;
        } else if (pattern === 6) {
            text = `2つの項に共通な数と文字でくくろう。${q.a * q.b} と ${q.a * q.c} の最大公約数は ${q.a}`;
        }
    } else if (gameMode === 'squareRoot') {
        if (q.isFraction) {
            text = `分母と分子に √{${q.b}} をかけて、分母を有理化しよう`;
        } else if (q.b === 1) {
            text = `${q.x}=${q.a}² なので、√{${q.x}} は整数になるよ`;
        } else {
            text = `${q.x}=${q.a * q.a}×${q.b}。平方数 ${q.a * q.a} を √ の外に出そう`;
        }
    }

    // 「-」を「−」にしてから、文字の斜体・√・強調を HTML にする（HTML のクラス名の「-」は変えない）
    return formatMathText(text.replace(/-/g, '−'))
        .replace(/√\{(\d+)\}/g, (m, n) => formatSquareRoot(n))
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

// 「次へ」
function nextPracticeQuestion() {
    hidePracticeControls();
    generateQuestion();
}

function hidePracticeControls() {
    clearPracticeHintText();
    document.getElementById('practiceControls').classList.remove('show');
    document.getElementById('answerGrid').classList.remove('practice-locked');
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.textContent = '';
    comboDisplay.classList.remove('show');
}
