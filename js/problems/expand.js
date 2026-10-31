// 展開ラッシュの問題生成・正誤判定

function generateExpandQuestion() {
    // ハードモードの場合
    if (difficultyMode === 'hard') {
        // 共通因数パターン: 約15%の確率
        if (Math.random() < 0.15) {
            generateExpandCommonFactorPattern();
            return;
        }
        // 残り85%のうち50%でハード問題を出題
        if (Math.random() < 0.5) {
            generateExpandHardQuestion();
            return;
        }
    }

    // ノーマル問題: 20%の確率で2乗問題を生成
    const isSquare = Math.random() < 0.2;

    let a, b;
    do {
        if (isSquare) {
            a = getRandomNonZero();
            b = a; // 同じ値にして2乗問題にする
        } else {
            a = getRandomNonZero();
            b = getRandomNonZero();
            // 偶然同じ値にならないよう調整
            while (b === a) {
                b = getRandomNonZero();
            }
        }
        // 直前の問題と同じでないかチェック（順序は問わない）
    } while (lastQuestionValues &&
             ((lastQuestionValues.a === a && lastQuestionValues.b === b) ||
              (lastQuestionValues.a === b && lastQuestionValues.b === a)));

    const xCoeff = a + b;
    const constant = a * b;

    // ハードモードの場合は「= ____」形式で12個選択肢
    if (difficultyMode === 'hard') {
        let questionText;
        if (a === b) {
            questionText = `(x${a >= 0 ? '+' : ''}${a})² = ____`;
        } else {
            questionText = `(x${a >= 0 ? '+' : ''}${a})(x${b >= 0 ? '+' : ''}${b}) = ____`;
        }

        currentQuestion = {
            text: questionText,
            x2Coeff: 1, // x²の係数は1
            xCoeff: xCoeff,
            constant: constant,
            original: a === b ? `(x${a >= 0 ? '+' : ''}${a})²` : `(x${a >= 0 ? '+' : ''}${a})(x${b >= 0 ? '+' : ''}${b})`,
            answer: `x²${xCoeff !== 0 ? (xCoeff >= 0 ? '+' : '') + (xCoeff === 1 ? '' : xCoeff === -1 ? '-' : xCoeff) + 'x' : ''}${constant !== 0 ? (constant >= 0 ? '+' : '') + constant : ''}`,
            hardPattern: 6, // ノーマル形式だがハードモード用（12個選択肢）
            requiredSelections: xCoeff === 0 ? 2 : 3 // xCoeffが0なら2つ選択
        };

        lastQuestionValues = { a, b };
        document.getElementById('question').innerHTML = formatMathText(questionText);
        generateExpandHardAnswers();
        return;
    }

    // ノーマルモードの場合
    let questionText;
    if (a === b) {
        questionText = `(x${a >= 0 ? '+' : ''}${a})² = x²____`;
    } else {
        questionText = `(x${a >= 0 ? '+' : ''}${a})(x${b >= 0 ? '+' : ''}${b}) = x²____`;
    }

    currentQuestion = {
        text: questionText,
        xCoeff: xCoeff,
        constant: constant,
        original: a === b ? `(x${a >= 0 ? '+' : ''}${a})²` : `(x${a >= 0 ? '+' : ''}${a})(x${b >= 0 ? '+' : ''}${b})`,
        answer: `x²${xCoeff !== 0 ? (xCoeff >= 0 ? '+' : '') + (xCoeff === 1 ? '' : xCoeff === -1 ? '-' : xCoeff) + 'x' : ''}${constant !== 0 ? (constant >= 0 ? '+' : '') + constant : ''}`,
        hardPattern: 0 // ノーマル問題
    };

    // 現在の問題の値を保存
    lastQuestionValues = { a, b };

    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandAnswers();
}

function generateExpandHardQuestion() {
    // 重み付きランダム選択（パターン1を3倍の確率で出題）
    // パターン1: 重み3, パターン2-5: 重み1（合計7）
    const rand = Math.random() * 7;
    let pattern;
    if (rand < 3) {
        pattern = 1; // 約43%の確率
    } else if (rand < 4) {
        pattern = 2; // 約14%の確率
    } else if (rand < 5) {
        pattern = 3; // 約14%の確率
    } else if (rand < 6) {
        pattern = 4; // 約14%の確率
    } else {
        pattern = 5; // 約14%の確率
    }

    switch (pattern) {
        case 1: generateExpandPattern1(); break; // (x+ay)(x+by)
        case 2: generateExpandPattern2(); break; // (cx+d)²
        case 3: generateExpandPattern3(); break; // (cx+dy)²
        case 4: generateExpandPattern4(); break; // (cx+d)(cx-d)
        case 5: generateExpandPattern5(); break; // (cx+dy)(cx-dy)
    }
}

// パターン1: (x+ay)(x+by) = x² + (a+b)xy + ab·y²
function generateExpandPattern1() {
    let a, b;
    do {
        a = getRandomNonZeroSmall();
        b = getRandomNonZeroSmall();
        while (b === a) {
            b = getRandomNonZeroSmall();
        }
    } while (lastQuestionValues && lastQuestionValues.pattern === 1 &&
             ((lastQuestionValues.a === a && lastQuestionValues.b === b) ||
              (lastQuestionValues.a === b && lastQuestionValues.b === a)));

    const xyCoeff = a + b;
    const y2Coeff = a * b;

    const aSign = a >= 0 ? '+' : '';
    const bSign = b >= 0 ? '+' : '';
    const aDisplay = a === 1 ? '' : a === -1 ? '-' : a;
    const bDisplay = b === 1 ? '' : b === -1 ? '-' : b;
    const questionText = `(x${aSign}${aDisplay}y)(x${bSign}${bDisplay}y) = ____`;

    currentQuestion = {
        text: questionText,
        x2Coeff: 1,
        xyCoeff: xyCoeff,
        y2Coeff: y2Coeff,
        original: `(x${aSign}${aDisplay}y)(x${bSign}${bDisplay}y)`,
        answer: `x²${xyCoeff !== 0 ? (xyCoeff >= 0 ? '+' : '') + (xyCoeff === 1 ? '' : xyCoeff === -1 ? '-' : xyCoeff) + 'xy' : ''}${y2Coeff !== 0 ? (y2Coeff >= 0 ? '+' : '') + y2Coeff + 'y²' : ''}`,
        hardPattern: 1,
        requiredSelections: xyCoeff === 0 ? 2 : 3 // xyCoeffが0なら2つ、そうでなければ3つ
    };

    lastQuestionValues = { pattern: 1, a, b };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

// パターン2: (cx+d)² = c²x² + 2cdx + d²
function generateExpandPattern2() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = pair.d;
    } while (lastQuestionValues && lastQuestionValues.pattern === 2 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const xCoeff = 2 * c * d;
    const constant = d * d;

    const dSign = d >= 0 ? '+' : '';
    const questionText = `(${c}x${dSign}${d})² = ____`;

    currentQuestion = {
        text: questionText,
        x2Coeff: x2Coeff,
        xCoeff: xCoeff,
        constant: constant,
        original: `(${c}x${dSign}${d})²`,
        answer: `${x2Coeff}x²${xCoeff >= 0 ? '+' : ''}${xCoeff}x${constant >= 0 ? '+' : ''}${constant}`,
        hardPattern: 2,
        requiredSelections: 3 // x², x, 定数
    };

    lastQuestionValues = { pattern: 2, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

// パターン3: (cx+dy)² = c²x² + 2cdxy + d²y²
function generateExpandPattern3() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = pair.d;
    } while (lastQuestionValues && lastQuestionValues.pattern === 3 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const xyCoeff = 2 * c * d;
    const y2Coeff = d * d;

    const dSign = d >= 0 ? '+' : '';
    const dDisplay = d === 1 ? '' : d === -1 ? '-' : d;
    const questionText = `(${c}x${dSign}${dDisplay}y)² = ____`;

    currentQuestion = {
        text: questionText,
        x2Coeff: x2Coeff,
        xyCoeff: xyCoeff,
        y2Coeff: y2Coeff,
        original: `(${c}x${dSign}${dDisplay}y)²`,
        answer: `${x2Coeff}x²${xyCoeff >= 0 ? '+' : ''}${xyCoeff}xy+${y2Coeff}y²`,
        hardPattern: 3,
        requiredSelections: 3 // x², xy, y²
    };

    lastQuestionValues = { pattern: 3, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

// パターン4: (cx+d)(cx-d) = c²x² - d²
function generateExpandPattern4() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = Math.abs(pair.d); // 正の値にする
    } while (lastQuestionValues && lastQuestionValues.pattern === 4 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const constant = -(d * d);

    const questionText = `(${c}x+${d})(${c}x-${d}) = ____`;

    currentQuestion = {
        text: questionText,
        x2Coeff: x2Coeff,
        constant: constant,
        original: `(${c}x+${d})(${c}x-${d})`,
        answer: `${x2Coeff}x²${constant}`,
        hardPattern: 4,
        requiredSelections: 2 // x², 定数
    };

    lastQuestionValues = { pattern: 4, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

// パターン5: (cx+dy)(cx-dy) = c²x² - d²y²
function generateExpandPattern5() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = Math.abs(pair.d); // 正の値にする
    } while (lastQuestionValues && lastQuestionValues.pattern === 5 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const y2Coeff = -(d * d);

    const dDisplay = d === 1 ? '' : d;
    const questionText = `(${c}x+${dDisplay}y)(${c}x-${dDisplay}y) = ____`;

    currentQuestion = {
        text: questionText,
        x2Coeff: x2Coeff,
        y2Coeff: y2Coeff,
        original: `(${c}x+${dDisplay}y)(${c}x-${dDisplay}y)`,
        answer: `${x2Coeff}x²${y2Coeff}y²`,
        hardPattern: 5,
        requiredSelections: 2 // x², y²
    };

    lastQuestionValues = { pattern: 5, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

// 共通因数パターン: ax(bx+c), ax(bx-c), ax(bx+cy), ax(bx-cy), axy(bx+cy), axy(bx-cy)
function generateExpandCommonFactorPattern() {
    // サブパターン1〜6を均等に選択
    const subPattern = Math.floor(Math.random() * 6) + 1;

    let a, b, c;
    do {
        a = Math.floor(Math.random() * 9) + 1; // 1〜9
        const pair = getCoprimePositivePair();
        b = pair.b;
        c = pair.c;
    } while (lastQuestionValues && lastQuestionValues.pattern === 'cf' &&
             lastQuestionValues.a === a && lastQuestionValues.b === b && lastQuestionValues.c === c &&
             lastQuestionValues.subPattern === subPattern);

    const col1Value = a * b; // 高次項の係数
    const isPlus = (subPattern % 2 === 1); // 奇数サブパターンは+
    const col2Value = isPlus ? a * c : -(a * c); // 低次項の係数（符号付き）

    // 問題テキスト生成
    const aDisplay = a === 1 ? '' : a;
    const bDisplay = b === 1 ? '' : b;
    const cDisplay = c === 1 ? '' : c;
    const sign = isPlus ? '+' : '-';

    let questionText;
    if (subPattern <= 2) {
        // ①② ax(bx±c)
        questionText = `${aDisplay}x(${bDisplay}x${sign}${c}) = ____`;
    } else if (subPattern <= 4) {
        // ③④ ax(bx±cy)
        questionText = `${aDisplay}x(${bDisplay}x${sign}${cDisplay}y) = ____`;
    } else {
        // ⑤⑥ axy(bx±cy)
        questionText = `${aDisplay}xy(${bDisplay}x${sign}${cDisplay}y) = ____`;
    }

    // 展開結果の文字列（answer表示用）
    const t1 = col1Value === 1 ? '' : col1Value;
    const t2Sign = col2Value >= 0 ? '+' : '';
    const t2 = col2Value === 1 ? '' : col2Value === -1 ? '-' : col2Value;
    let answerText;
    if (subPattern <= 2) {
        answerText = `${t1}x²${t2Sign}${t2}x`;
    } else if (subPattern <= 4) {
        answerText = `${t1}x²${t2Sign}${t2}xy`;
    } else {
        answerText = `${t1}x²y${t2Sign}${t2}xy²`;
    }

    currentQuestion = {
        text: questionText,
        col1Value: col1Value,
        col2Value: col2Value,
        a: a,
        b: b,
        c: c,
        subPattern: subPattern,
        original: questionText.replace(' = ____', ''),
        answer: answerText,
        hardPattern: 7,
        requiredSelections: 2
    };

    lastQuestionValues = { pattern: 'cf', a, b, c, subPattern };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateExpandHardAnswers();
}

function generateExpandHardAnswers() {
    const pattern = currentQuestion.hardPattern;
    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';

    // 全パターンで12個ボタン（縦4×横3）に固定
    answerGrid.className = 'answer-grid-12';
    generateExpandHard3ColumnAnswers(pattern);
}

function generateExpandHard3ColumnAnswers(pattern) {
    const answerGrid = document.getElementById('answerGrid');

    let col1Label, col2Label, col3Label;
    let correctCol1, correctCol2, correctCol3;
    let col2IsDummy = false; // パターン4,5,1(xy係数0)では中央列はダミー
    let col3IsDummy = false; // パターン7（共通因数）では右列はダミー

    if (pattern === 7) {
        // 共通因数パターン: 右列（col3）がダミー
        const sub = currentQuestion.subPattern;
        if (sub <= 2) {
            col1Label = 'x²'; col2Label = 'x'; col3Label = '';
        } else if (sub <= 4) {
            col1Label = 'x²'; col2Label = 'xy'; col3Label = 'y²';
        } else {
            col1Label = 'x²y'; col2Label = 'xy²'; col3Label = 'y³';
        }
        correctCol1 = currentQuestion.col1Value;
        correctCol2 = currentQuestion.col2Value;
        correctCol3 = null;
        col3IsDummy = true;
    } else if (pattern === 1) {
        // (x+ay)(x+by) = x² + xyCoeff·xy + y2Coeff·y²
        col1Label = 'x²';
        col2Label = 'xy';
        col3Label = 'y²';
        correctCol1 = 1; // x²の係数は常に1
        correctCol2 = currentQuestion.xyCoeff;
        correctCol3 = currentQuestion.y2Coeff;
        // xyCoeffが0の場合は中央列はダミー
        if (correctCol2 === 0) {
            col2IsDummy = true;
            correctCol2 = null;
        }
    } else if (pattern === 2) {
        // (cx+d)² = x2Coeff·x² + xCoeff·x + constant
        col1Label = 'x²';
        col2Label = 'x';
        col3Label = '';
        correctCol1 = currentQuestion.x2Coeff;
        correctCol2 = currentQuestion.xCoeff;
        correctCol3 = currentQuestion.constant;
    } else if (pattern === 3) {
        // (cx+dy)² = x2Coeff·x² + xyCoeff·xy + y2Coeff·y²
        col1Label = 'x²';
        col2Label = 'xy';
        col3Label = 'y²';
        correctCol1 = currentQuestion.x2Coeff;
        correctCol2 = currentQuestion.xyCoeff;
        correctCol3 = currentQuestion.y2Coeff;
    } else if (pattern === 4) {
        // (cx+d)(cx-d) = x2Coeff·x² - d²（中央列はダミー）
        col1Label = 'x²';
        col2Label = 'x'; // ダミー列
        col3Label = '';
        correctCol1 = currentQuestion.x2Coeff;
        correctCol2 = null; // ダミー（選択したら不正解）
        correctCol3 = currentQuestion.constant;
        col2IsDummy = true;
    } else if (pattern === 5) {
        // (cx+dy)(cx-dy) = x2Coeff·x² - d²y²（中央列はダミー）
        col1Label = 'x²';
        col2Label = 'xy'; // ダミー列
        col3Label = 'y²';
        correctCol1 = currentQuestion.x2Coeff;
        correctCol2 = null; // ダミー（選択したら不正解）
        correctCol3 = currentQuestion.y2Coeff;
        col2IsDummy = true;
    } else { // pattern === 6 (ノーマル形式だがハードモード)
        // (x+a)(x+b) = x² + xCoeff·x + constant
        col1Label = 'x²';
        col2Label = 'x';
        col3Label = '';
        correctCol1 = 1; // x²の係数は常に1
        correctCol2 = currentQuestion.xCoeff;
        correctCol3 = currentQuestion.constant;
        // xCoeffが0の場合は中央列はダミー
        if (correctCol2 === 0) {
            col2IsDummy = true;
            correctCol2 = null;
        }
    }

    // 各列の選択肢を生成
    const col1Choices = pattern === 7
        ? generatePositiveChoices(correctCol1)
        : generateX2Choices(correctCol1);
    const col2Choices = col2IsDummy
        ? generateDummyChoicesNonZero()
        : generateChoicesForValue(correctCol2, false);
    const col3Choices = col3IsDummy
        ? generateDummyChoicesNonZero()
        : generateChoicesForValue(correctCol3, false);

    // シャッフル
    const col1Array = Array.from(col1Choices).sort(() => Math.random() - 0.5);
    const col2Array = Array.from(col2Choices).sort(() => Math.random() - 0.5);
    const col3Array = Array.from(col3Choices).sort(() => Math.random() - 0.5);

    // ボタンを生成
    for (let i = 0; i < 4; i++) {
        // 列1（x²項 - 「+」なしで表示）
        const btn1 = document.createElement('button');
        btn1.className = 'answer-btn';
        const coeff1 = col1Array[i] === 1 ? '' : col1Array[i];
        btn1.innerHTML = formatMathText(`${coeff1}${col1Label}`);
        btn1.setAttribute('data-type', 'col1');
        btn1.setAttribute('data-value', col1Array[i]);
        btn1.onclick = () => selectExpandHardAnswer(btn1, 'col1', col1Array[i]);
        answerGrid.appendChild(btn1);

        // 列2
        const btn2 = document.createElement('button');
        btn2.className = 'answer-btn';
        btn2.innerHTML = formatMathText(`${col2Array[i] >= 0 ? '+' : ''}${col2Array[i] === 1 ? '' : col2Array[i] === -1 ? '-' : col2Array[i]}${col2Label}`);
        btn2.setAttribute('data-type', 'col2');
        btn2.setAttribute('data-value', col2Array[i]);
        btn2.onclick = () => selectExpandHardAnswer(btn2, 'col2', col2Array[i]);
        answerGrid.appendChild(btn2);

        // 列3
        const btn3 = document.createElement('button');
        btn3.className = 'answer-btn';
        if (col3Label) {
            // y²の係数が1や-1の場合は省略表示
            const coeff3Display = col3Array[i] === 1 ? '+' : col3Array[i] === -1 ? '-' : (col3Array[i] >= 0 ? '+' : '') + col3Array[i];
            btn3.innerHTML = formatMathText(`${coeff3Display}${col3Label}`);
        } else {
            btn3.textContent = `${col3Array[i] >= 0 ? '+' : ''}${col3Array[i]}`;
        }
        btn3.setAttribute('data-type', 'col3');
        btn3.setAttribute('data-value', col3Array[i]);
        btn3.onclick = () => selectExpandHardAnswer(btn3, 'col3', col3Array[i]);
        answerGrid.appendChild(btn3);
    }
}

function selectExpandHardAnswer(button, type, value) {
    // 同じ列の他のボタンの選択を解除
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn !== button && btn.getAttribute('data-type') === type && btn.classList.contains('selected')) {
            btn.classList.remove('selected');
        }
    });

    button.classList.toggle('selected');

    if (button.classList.contains('selected')) {
        selectedAnswers = selectedAnswers.filter(ans => ans.type !== type);
        selectedAnswers.push({ type, value });
    } else {
        selectedAnswers = selectedAnswers.filter(ans => !(ans.type === type && ans.value === value));
    }

    checkExpandHardAnswer();
}

function checkExpandHardAnswer() {
    const pattern = currentQuestion.hardPattern;
    let correctValues = {};

    if (pattern === 7) {
        // 共通因数パターン: col3はダミー（選択したら不正解）
        correctValues = { col1: currentQuestion.col1Value, col2: currentQuestion.col2Value };
    } else if (pattern === 1) {
        // xyCoeffが0の場合はcol2はダミー
        if (currentQuestion.xyCoeff === 0) {
            correctValues = { col1: 1, col3: currentQuestion.y2Coeff };
        } else {
            correctValues = { col1: 1, col2: currentQuestion.xyCoeff, col3: currentQuestion.y2Coeff };
        }
    } else if (pattern === 2) {
        correctValues = { col1: currentQuestion.x2Coeff, col2: currentQuestion.xCoeff, col3: currentQuestion.constant };
    } else if (pattern === 3) {
        correctValues = { col1: currentQuestion.x2Coeff, col2: currentQuestion.xyCoeff, col3: currentQuestion.y2Coeff };
    } else if (pattern === 4) {
        // パターン4: col2はダミー（選択したら不正解）、col3が定数
        correctValues = { col1: currentQuestion.x2Coeff, col3: currentQuestion.constant };
    } else if (pattern === 5) {
        // パターン5: col2はダミー（選択したら不正解）、col3がy²係数
        correctValues = { col1: currentQuestion.x2Coeff, col3: currentQuestion.y2Coeff };
    } else { // pattern === 6 (ノーマル形式だがハードモード)
        // (x+a)(x+b) = x² + xCoeff·x + constant
        if (currentQuestion.xCoeff === 0) {
            // xCoeffが0の場合はcol2はダミー
            correctValues = { col1: 1, col3: currentQuestion.constant };
        } else {
            correctValues = { col1: 1, col2: currentQuestion.xCoeff, col3: currentQuestion.constant };
        }
    }

    // 中間正解音のチェック
    if (selectedAnswers.length === 1) {
        const ans = selectedAnswers[0];
        if (correctValues[ans.type] === ans.value) {
            playSound(partialCorrectSound);
        }
    } else if (selectedAnswers.length === 2 && currentQuestion.requiredSelections === 3) {
        // 3つ必要な問題で2つ目が正解の場合
        const allCorrectSoFar = selectedAnswers.every(ans => correctValues[ans.type] === ans.value);
        if (allCorrectSoFar) {
            playSound(partialCorrectSound);
        }
    }

    // 不正解チェック（correctValuesに存在しないcol2を選択した場合も不正解）
    const hasWrong = selectedAnswers.some(ans => correctValues[ans.type] !== ans.value);
    if (hasWrong) {
        wrongAnswer();
        return;
    }

    // 正解チェック
    const requiredCount = currentQuestion.requiredSelections;
    if (selectedAnswers.length === requiredCount) {
        const allCorrect = selectedAnswers.every(ans => correctValues[ans.type] === ans.value);
        if (allCorrect) {
            correctAnswer();
        }
    }
}

function generateExpandAnswers() {
    const correctX = currentQuestion.xCoeff;
    const correctConst = currentQuestion.constant;

    const xChoices = new Set([correctX]);
    const constChoices = new Set([correctConst]);

    // x係数の選択肢を生成（0は除外）
    while (xChoices.size < 4) {
        const candidate = getRandomNonZero();
        xChoices.add(candidate);
    }
    // もし0が含まれていたら別の値に置き換え
    const xChoicesArray = Array.from(xChoices);
    if (xChoicesArray.includes(0)) {
        xChoices.delete(0);
        let replacement = getRandomNonZero();
        while (xChoices.has(replacement)) {
            replacement = getRandomNonZero();
        }
        xChoices.add(replacement);
    }
    while (constChoices.size < 4) {
        constChoices.add(getRandomNonZero());
    }

    const xArray = Array.from(xChoices).sort(() => Math.random() - 0.5);
    const constArray = Array.from(constChoices).sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';

    // 左側4個と右側4個を交互に配置して縦4×横2にする
    for (let i = 0; i < 4; i++) {
        // 左側: x項のボタン
        const xBtn = document.createElement('button');
        xBtn.className = 'answer-btn';
        xBtn.innerHTML = formatMathText(`${xArray[i] >= 0 ? '+' : ''}${xArray[i] === 1 ? '' : xArray[i] === -1 ? '-' : xArray[i]}x`);
        xBtn.setAttribute('data-type', 'x');
        xBtn.setAttribute('data-value', xArray[i]);
        xBtn.onclick = () => selectExpandAnswer(xBtn, 'x', xArray[i]);
        answerGrid.appendChild(xBtn);

        // 右側: 数項のボタン
        const constBtn = document.createElement('button');
        constBtn.className = 'answer-btn';
        constBtn.textContent = `${constArray[i] >= 0 ? '+' : ''}${constArray[i]}`;
        constBtn.setAttribute('data-type', 'const');
        constBtn.setAttribute('data-value', constArray[i]);
        constBtn.onclick = () => selectExpandAnswer(constBtn, 'const', constArray[i]);
        answerGrid.appendChild(constBtn);
    }
}

function selectExpandAnswer(button, type, value) {
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn !== button && btn.classList.contains('selected')) {
            const otherType = btn.textContent.includes('x') ? 'x' : 'const';
            if (otherType === type) {
                btn.classList.remove('selected');
            }
        }
    });

    button.classList.toggle('selected');

    if (button.classList.contains('selected')) {
        selectedAnswers = selectedAnswers.filter(ans => ans.type !== type);
        selectedAnswers.push({ type, value });
    } else {
        selectedAnswers = selectedAnswers.filter(ans => !(ans.type === type && ans.value === value));
    }

    checkExpandAnswer();
}

function checkExpandAnswer() {
    const needsX = currentQuestion.xCoeff !== 0;
    const needsConst = currentQuestion.constant !== 0;

    let hasCorrectX = !needsX;
    let hasCorrectConst = !needsConst;

    if (needsX) {
        hasCorrectX = selectedAnswers.some(ans => ans.type === 'x' && ans.value === currentQuestion.xCoeff);
    }
    if (needsConst) {
        hasCorrectConst = selectedAnswers.some(ans => ans.type === 'const' && ans.value === currentQuestion.constant);
    }

    // 中間正解音の再生チェック
    if (selectedAnswers.length === 1) {
        const firstAnswer = selectedAnswers[0];
        if ((firstAnswer.type === 'x' && firstAnswer.value === currentQuestion.xCoeff) ||
            (firstAnswer.type === 'const' && firstAnswer.value === currentQuestion.constant)) {
            playSound(partialCorrectSound);
        }
    }

    if (hasCorrectX && hasCorrectConst) {
        if ((!needsX || selectedAnswers.some(ans => ans.type === 'x')) &&
            (!needsConst || selectedAnswers.some(ans => ans.type === 'const'))) {

            const wrongSelection = selectedAnswers.some(ans =>
                (ans.type === 'x' && ans.value !== currentQuestion.xCoeff) ||
                (ans.type === 'const' && ans.value !== currentQuestion.constant)
            );

            if (!wrongSelection) {
                correctAnswer();
                return;
            }
        }
    }

    if (selectedAnswers.length > 0) {
        const wrongSelection = selectedAnswers.some(ans =>
            (ans.type === 'x' && ans.value !== currentQuestion.xCoeff) ||
            (ans.type === 'const' && ans.value !== currentQuestion.constant)
        );

        if (wrongSelection) {
            wrongAnswer();
        }
    }
}
