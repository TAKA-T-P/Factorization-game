// 因数分解ラッシュの問題生成・正誤判定

function generateFactorizeQuestion() {
    // ハードモードの場合
    if (difficultyMode === 'hard') {
        // 共通因数パターン: 約15%の確率
        if (Math.random() < 0.15) {
            generateFactorizeCommonFactorPattern();
            return;
        }
        // 残り85%のうち50%でハード問題を出題
        if (Math.random() < 0.5) {
            generateFactorizeHardQuestion();
            return;
        }
    }

    // ノーマル問題: 20%の確率で2乗の答えになる問題を生成
    const isSquare = Math.random() < 0.2;

    let p, q;
    do {
        if (isSquare) {
            p = getRandomNonZero();
            q = p; // 同じ値にして2乗の答えにする
        } else {
            p = getRandomNonZero();
            q = getRandomNonZero();
            // 偶然同じ値にならないよう調整
            while (q === p) {
                q = getRandomNonZero();
            }
        }
        // 直前の問題と同じでないかチェック（順序は問わない）
    } while (lastQuestionValues &&
             ((lastQuestionValues.p === p && lastQuestionValues.q === q) ||
              (lastQuestionValues.p === q && lastQuestionValues.q === p)));

    const xCoeff = p + q;
    const constant = p * q;

    const questionText = `x²${xCoeff !== 0 ? (xCoeff >= 0 ? '+' : '') + (xCoeff === 1 ? '' : xCoeff === -1 ? '-' : xCoeff) + 'x' : ''}${constant >= 0 ? '+' : ''}${constant} = ______`;

    currentQuestion = {
        text: questionText,
        p: p,
        q: q,
        original: `x²${xCoeff !== 0 ? (xCoeff >= 0 ? '+' : '') + (xCoeff === 1 ? '' : xCoeff === -1 ? '-' : xCoeff) + 'x' : ''}${constant >= 0 ? '+' : ''}${constant}`,
        answer: p === q ? `(x${p >= 0 ? '+' : ''}${p})²` : `(x${p >= 0 ? '+' : ''}${p})(x${q >= 0 ? '+' : ''}${q})`,
        hardPattern: 0 // ノーマル問題
    };

    // 現在の問題の値を保存
    lastQuestionValues = { p, q };

    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeAnswers();
}

function generateFactorizeHardQuestion() {
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
        case 1: generateFactorizePattern1(); break; // x²+(a+b)xy+ab·y² = (x+ay)(x+by)
        case 2: generateFactorizePattern2(); break; // c²x²+2cdx+d² = (cx+d)²
        case 3: generateFactorizePattern3(); break; // c²x²+2cdxy+d²y² = (cx+dy)²
        case 4: generateFactorizePattern4(); break; // c²x²-d² = (cx+d)(cx-d)
        case 5: generateFactorizePattern5(); break; // c²x²-d²y² = (cx+dy)(cx-dy)
    }
}

// 因数分解パターン1: x²+(a+b)xy+ab·y² = (x+ay)(x+by)
function generateFactorizePattern1() {
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

    let questionText = `x²`;
    if (xyCoeff !== 0) {
        questionText += `${xyCoeff >= 0 ? '+' : ''}${xyCoeff === 1 ? '' : xyCoeff === -1 ? '-' : xyCoeff}xy`;
    }
    // y²係数が1の場合は省略
    const y2Display = y2Coeff === 1 ? '+' : y2Coeff === -1 ? '-' : (y2Coeff >= 0 ? '+' : '') + y2Coeff;
    questionText += `${y2Display}y² = ______`;

    // y係数が1や-1の場合は省略表示
    const aDisplay = a === 1 ? '+' : a === -1 ? '-' : (a >= 0 ? '+' : '') + a;
    const bDisplay = b === 1 ? '+' : b === -1 ? '-' : (b >= 0 ? '+' : '') + b;

    currentQuestion = {
        text: questionText,
        a: a,
        b: b,
        original: questionText.replace(' = ______', ''),
        answer: `(x${aDisplay}y)(x${bDisplay}y)`,
        hardPattern: 1,
        hasY: true
    };

    lastQuestionValues = { pattern: 1, a, b };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

// 因数分解パターン2: c²x²+2cdx+d² = (cx+d)²
function generateFactorizePattern2() {
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

    const questionText = `${x2Coeff}x²${xCoeff >= 0 ? '+' : ''}${xCoeff}x+${constant} = ______`;
    const dSign = d >= 0 ? '+' : '';

    currentQuestion = {
        text: questionText,
        c: c,
        d: d,
        original: questionText.replace(' = ______', ''),
        answer: `(${c}x${dSign}${d})²`,
        hardPattern: 2,
        isSquareAnswer: true,
        hasY: false
    };

    lastQuestionValues = { pattern: 2, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

// 因数分解パターン3: c²x²+2cdxy+d²y² = (cx+dy)²
function generateFactorizePattern3() {
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

    // y²係数が1の場合は省略
    const y2Display = y2Coeff === 1 ? '+' : '+' + y2Coeff;
    const questionText = `${x2Coeff}x²${xyCoeff >= 0 ? '+' : ''}${xyCoeff}xy${y2Display}y² = ______`;
    // y係数が1や-1の場合は省略表示
    const dDisplay = d === 1 ? '+' : d === -1 ? '-' : (d >= 0 ? '+' : '') + d;

    currentQuestion = {
        text: questionText,
        c: c,
        d: d,
        original: questionText.replace(' = ______', ''),
        answer: `(${c}x${dDisplay}y)²`,
        hardPattern: 3,
        isSquareAnswer: true,
        hasY: true
    };

    lastQuestionValues = { pattern: 3, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

// 因数分解パターン4: c²x²-d² = (cx+d)(cx-d)
function generateFactorizePattern4() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = Math.abs(pair.d);
    } while (lastQuestionValues && lastQuestionValues.pattern === 4 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const constant = d * d;

    const questionText = `${x2Coeff}x²-${constant} = ______`;

    currentQuestion = {
        text: questionText,
        c: c,
        d: d,
        original: questionText.replace(' = ______', ''),
        answer: `(${c}x+${d})(${c}x-${d})`,
        hardPattern: 4,
        isDifference: true,
        hasY: false
    };

    lastQuestionValues = { pattern: 4, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

// 因数分解パターン5: c²x²-d²y² = (cx+dy)(cx-dy)
function generateFactorizePattern5() {
    let c, d;
    do {
        const pair = getCoprimeCD();
        c = pair.c;
        d = Math.abs(pair.d);
    } while (lastQuestionValues && lastQuestionValues.pattern === 5 &&
             lastQuestionValues.c === c && lastQuestionValues.d === d);

    const x2Coeff = c * c;
    const y2Coeff = d * d;

    // y²係数が1の場合は省略
    const y2Display = y2Coeff === 1 ? '' : y2Coeff;
    const questionText = `${x2Coeff}x²-${y2Display}y² = ______`;
    // y係数が1の場合は省略表示
    const dDisplay = d === 1 ? '' : d;

    currentQuestion = {
        text: questionText,
        c: c,
        d: d,
        original: questionText.replace(' = ______', ''),
        answer: `(${c}x+${dDisplay}y)(${c}x-${dDisplay}y)`,
        hardPattern: 5,
        isDifference: true,
        hasY: true
    };

    lastQuestionValues = { pattern: 5, c, d };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

// 因数分解共通因数パターン: abx²±acx = ax(bx±c) 等
function generateFactorizeCommonFactorPattern() {
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

    const t1Coeff = a * b; // 高次項の係数
    const t2Coeff = a * c; // 低次項の係数
    const isPlus = (subPattern % 2 === 1); // 奇数サブパターンは+
    const sign = isPlus ? '+' : '-';

    // 問題テキスト（展開形）
    const t1Display = t1Coeff === 1 ? '' : t1Coeff;
    const t2Display = t2Coeff === 1 ? '' : t2Coeff;
    let questionText;
    if (subPattern <= 2) {
        questionText = `${t1Display}x²${sign}${t2Display}x = ______`;
    } else if (subPattern <= 4) {
        questionText = `${t1Display}x²${sign}${t2Display}xy = ______`;
    } else {
        questionText = `${t1Display}x²y${sign}${t2Display}xy² = ______`;
    }

    // 答え（因数分解形）
    const aDisplay = a === 1 ? '' : a;
    const bDisplay = b === 1 ? '' : b;
    const cDisplay = c === 1 ? '' : c;
    let answerText;
    if (subPattern <= 2) {
        answerText = `${aDisplay}x(${bDisplay}x${sign}${c})`;
    } else if (subPattern <= 4) {
        answerText = `${aDisplay}x(${bDisplay}x${sign}${cDisplay}y)`;
    } else {
        answerText = `${aDisplay}xy(${bDisplay}x${sign}${cDisplay}y)`;
    }

    currentQuestion = {
        text: questionText,
        a: a,
        b: b,
        c: c,
        subPattern: subPattern,
        isPlus: isPlus,
        original: questionText.replace(' = ______', ''),
        answer: answerText,
        hardPattern: 6,
        isCommonFactor: true
    };

    lastQuestionValues = { pattern: 'cf', a, b, c, subPattern };
    document.getElementById('question').innerHTML = formatMathText(questionText);
    generateFactorizeHardAnswers();
}

function generateFactorizeHardAnswers() {
    const pattern = currentQuestion.hardPattern;
    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';
    answerGrid.className = 'factors-grid';

    if (pattern === 6) {
        // 共通因数パターン - 2つ選択
        generateFactorizeCommonFactorAnswers();
    } else if (pattern === 1) {
        // (x+ay)(x+by) 形式 - 2つ選択
        generateFactorizePattern1Answers();
    } else if (pattern === 2 || pattern === 3) {
        // (cx+d)² または (cx+dy)² 形式 - 1つ+²選択
        generateFactorizeSquareAnswers();
    } else {
        // (cx+d)(cx-d) または (cx+dy)(cx-dy) 形式 - 2つ選択
        generateFactorizeDifferenceAnswers();
    }
}

function generateFactorizeCommonFactorAnswers() {
    // 共通因数パターンの解答選択肢
    const correctA = currentQuestion.a;
    const correctB = currentQuestion.b;
    const correctC = currentQuestion.c;
    const subPattern = currentQuestion.subPattern;
    const isPlus = currentQuestion.isPlus;
    const sign = isPlus ? '+' : '-';
    const hasXY = subPattern >= 5; // ⑤⑥はaxyが共通因数
    const hasY = subPattern >= 3; // ③〜⑥は残りの因数にyが含まれる

    // 左列: 共通因数の選択肢（ax または axy）
    const leftChoices = new Set([correctA]);
    while (leftChoices.size < 4) {
        const candidate = Math.floor(Math.random() * 9) + 1; // 1〜9
        leftChoices.add(candidate);
    }

    // 右列: 残りの因数の選択肢（(bx+c) 等）
    const rightChoices = [{ b: correctB, c: correctC }];
    while (rightChoices.length < 4) {
        const pair = getCoprimePositivePair();
        if (!rightChoices.some(ch => ch.b === pair.b && ch.c === pair.c)) {
            rightChoices.push({ b: pair.b, c: pair.c });
        }
    }

    // シャッフル
    const leftArray = Array.from(leftChoices).sort(() => Math.random() - 0.5);
    rightChoices.sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');
    const varLabel = hasXY ? 'xy' : 'x';

    for (let i = 0; i < 4; i++) {
        // 左側: 共通因数
        const leftBtn = document.createElement('button');
        leftBtn.className = 'answer-btn';
        const aDisp = leftArray[i] === 1 ? '' : leftArray[i];
        leftBtn.innerHTML = formatMathText(`${aDisp}${varLabel}`);
        leftBtn.setAttribute('data-position', 'left');
        leftBtn.setAttribute('data-value', leftArray[i]);
        leftBtn.onclick = () => selectFactorizeHardAnswer(leftBtn, leftArray[i], 'commonFactor');
        answerGrid.appendChild(leftBtn);

        // 右側: 残りの因数
        const rightBtn = document.createElement('button');
        rightBtn.className = 'answer-btn';
        const rb = rightChoices[i].b;
        const rc = rightChoices[i].c;
        const rbDisp = rb === 1 ? '' : rb;
        if (hasY) {
            const rcDisp = rc === 1 ? '' : rc;
            rightBtn.innerHTML = formatMathText(`(${rbDisp}x${sign}${rcDisp}y)`);
        } else {
            rightBtn.innerHTML = formatMathText(`(${rbDisp}x${sign}${rc})`);
        }
        rightBtn.setAttribute('data-position', 'right');
        rightBtn.setAttribute('data-b', rb);
        rightBtn.setAttribute('data-c', rc);
        rightBtn.onclick = () => selectFactorizeHardAnswer(rightBtn, { b: rb, c: rc }, 'commonFactor');
        answerGrid.appendChild(rightBtn);
    }
}

function generateFactorizePattern1Answers() {
    // (x+ay)(x+by) 形式の解答選択肢
    const correctA = currentQuestion.a;
    const correctB = currentQuestion.b;

    // 左右にランダムに振り分け
    const leftCorrect = Math.random() < 0.5 ? correctA : correctB;
    const rightCorrect = leftCorrect === correctA ? correctB : correctA;

    // 左側の選択肢
    const leftChoices = new Set([leftCorrect]);
    while (leftChoices.size < 4) {
        const candidate = getRandomNonZeroSmall();
        if (candidate !== correctA && candidate !== correctB) {
            leftChoices.add(candidate);
        }
    }

    // 右側の選択肢
    const rightChoices = new Set([rightCorrect]);
    while (rightChoices.size < 3) {
        const candidate = getRandomNonZeroSmall();
        if (candidate !== correctA && candidate !== correctB && !leftChoices.has(candidate)) {
            rightChoices.add(candidate);
        }
    }

    const leftArray = Array.from(leftChoices).sort(() => Math.random() - 0.5);
    const rightArray = Array.from(rightChoices).sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');

    for (let i = 0; i < 4; i++) {
        // 左側
        const leftBtn = document.createElement('button');
        leftBtn.className = 'answer-btn';
        // y係数が1や-1の場合は省略表示
        const leftCoeffDisplay = leftArray[i] === 1 ? '+' : leftArray[i] === -1 ? '-' : (leftArray[i] >= 0 ? '+' : '') + leftArray[i];
        leftBtn.innerHTML = formatMathText(`(x${leftCoeffDisplay}y)`);
        leftBtn.setAttribute('data-position', 'left');
        leftBtn.setAttribute('data-value', leftArray[i]);
        leftBtn.onclick = () => selectFactorizeHardAnswer(leftBtn, leftArray[i], 'pattern1');
        answerGrid.appendChild(leftBtn);

        // 右側
        if (i < 3) {
            const rightBtn = document.createElement('button');
            rightBtn.className = 'answer-btn';
            // y係数が1や-1の場合は省略表示
            const rightCoeffDisplay = rightArray[i] === 1 ? '+' : rightArray[i] === -1 ? '-' : (rightArray[i] >= 0 ? '+' : '') + rightArray[i];
            rightBtn.innerHTML = formatMathText(`(x${rightCoeffDisplay}y)`);
            rightBtn.setAttribute('data-position', 'right');
            rightBtn.setAttribute('data-value', rightArray[i]);
            rightBtn.onclick = () => selectFactorizeHardAnswer(rightBtn, rightArray[i], 'pattern1');
            answerGrid.appendChild(rightBtn);
        } else {
            // 右下に²ボタン（使わないがUIの統一性のため配置）
            const squareBtn = document.createElement('button');
            squareBtn.className = 'answer-btn';
            squareBtn.textContent = '²';
            squareBtn.setAttribute('data-position', 'right');
            squareBtn.setAttribute('data-value', 'square');
            squareBtn.onclick = () => selectFactorizeHardSquare(squareBtn);
            answerGrid.appendChild(squareBtn);
        }
    }
}

function generateFactorizeSquareAnswers() {
    // (cx+d)² または (cx+dy)² 形式
    const correctC = currentQuestion.c;
    const correctD = currentQuestion.d;
    const hasY = currentQuestion.hasY;

    // 左側: (cx+d) または (cx+dy) 形式の選択肢
    const leftChoices = [{ c: correctC, d: correctD }];
    while (leftChoices.length < 4) {
        let newC, newD;
        do {
            const pair = getCoprimeCD();
            newC = pair.c;
            newD = pair.d;
        } while (leftChoices.some(ch => ch.c === newC && ch.d === newD));
        leftChoices.push({ c: newC, d: newD });
    }

    // シャッフル
    leftChoices.sort(() => Math.random() - 0.5);

    // 右側: ダミーの選択肢（正解は²ボタン）
    const rightChoices = [];
    while (rightChoices.length < 3) {
        let newC, newD;
        do {
            const pair = getCoprimeCD();
            newC = pair.c;
            newD = pair.d;
        } while (rightChoices.some(ch => ch.c === newC && ch.d === newD) ||
                 leftChoices.some(ch => ch.c === newC && ch.d === newD));
        rightChoices.push({ c: newC, d: newD });
    }

    const answerGrid = document.getElementById('answerGrid');

    for (let i = 0; i < 4; i++) {
        // 左側
        const leftBtn = document.createElement('button');
        leftBtn.className = 'answer-btn';
        const lc = leftChoices[i].c;
        const ld = leftChoices[i].d;
        if (hasY) {
            // y係数が1や-1の場合は省略表示
            const ldDisplay = ld === 1 ? '+' : ld === -1 ? '-' : (ld >= 0 ? '+' : '') + ld;
            leftBtn.innerHTML = formatMathText(`(${lc}x${ldDisplay}y)`);
        } else {
            const ldSign = ld >= 0 ? '+' : '';
            leftBtn.innerHTML = formatMathText(`(${lc}x${ldSign}${ld})`);
        }
        leftBtn.setAttribute('data-position', 'left');
        leftBtn.setAttribute('data-c', lc);
        leftBtn.setAttribute('data-d', ld);
        leftBtn.onclick = () => selectFactorizeHardAnswer(leftBtn, { c: lc, d: ld }, 'square');
        answerGrid.appendChild(leftBtn);

        // 右側
        if (i < 3) {
            const rightBtn = document.createElement('button');
            rightBtn.className = 'answer-btn';
            const rc = rightChoices[i].c;
            const rd = rightChoices[i].d;
            if (hasY) {
                // y係数が1や-1の場合は省略表示
                const rdDisplay = rd === 1 ? '+' : rd === -1 ? '-' : (rd >= 0 ? '+' : '') + rd;
                rightBtn.innerHTML = formatMathText(`(${rc}x${rdDisplay}y)`);
            } else {
                const rdSign = rd >= 0 ? '+' : '';
                rightBtn.innerHTML = formatMathText(`(${rc}x${rdSign}${rd})`);
            }
            rightBtn.setAttribute('data-position', 'right');
            rightBtn.setAttribute('data-c', rc);
            rightBtn.setAttribute('data-d', rd);
            rightBtn.onclick = () => selectFactorizeHardAnswer(rightBtn, { c: rc, d: rd }, 'square');
            answerGrid.appendChild(rightBtn);
        } else {
            // ²ボタン
            const squareBtn = document.createElement('button');
            squareBtn.className = 'answer-btn';
            squareBtn.textContent = '²';
            squareBtn.setAttribute('data-position', 'right');
            squareBtn.setAttribute('data-value', 'square');
            squareBtn.onclick = () => selectFactorizeHardSquare(squareBtn);
            answerGrid.appendChild(squareBtn);
        }
    }
}

function generateFactorizeDifferenceAnswers() {
    // (cx+d)(cx-d) または (cx+dy)(cx-dy) 形式
    const correctC = currentQuestion.c;
    const correctD = currentQuestion.d;
    const hasY = currentQuestion.hasY;

    // 正解のペア: (cx+d) と (cx-d)
    // 左右にランダムに振り分け
    const isLeftPlus = Math.random() < 0.5;

    // 左側の選択肢
    const leftChoices = [{ c: correctC, d: isLeftPlus ? correctD : -correctD, isCorrect: true }];
    while (leftChoices.length < 4) {
        let newC, newD;
        do {
            const pair = getCoprimeCD();
            newC = pair.c;
            newD = pair.d;
        } while (leftChoices.some(ch => ch.c === newC && Math.abs(ch.d) === Math.abs(newD)));
        leftChoices.push({ c: newC, d: newD, isCorrect: false });
    }

    // 右側の選択肢
    const rightChoices = [{ c: correctC, d: isLeftPlus ? -correctD : correctD, isCorrect: true }];
    while (rightChoices.length < 3) {
        let newC, newD;
        do {
            const pair = getCoprimeCD();
            newC = pair.c;
            newD = pair.d;
        } while (rightChoices.some(ch => ch.c === newC && Math.abs(ch.d) === Math.abs(newD)) ||
                 leftChoices.some(ch => ch.c === newC && Math.abs(ch.d) === Math.abs(newD)));
        rightChoices.push({ c: newC, d: newD, isCorrect: false });
    }

    // シャッフル
    leftChoices.sort(() => Math.random() - 0.5);
    rightChoices.sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');

    for (let i = 0; i < 4; i++) {
        // 左側
        const leftBtn = document.createElement('button');
        leftBtn.className = 'answer-btn';
        const lc = leftChoices[i].c;
        const ld = leftChoices[i].d;
        if (hasY) {
            // y係数が1や-1の場合は省略表示
            const ldDisplay = ld === 1 ? '+' : ld === -1 ? '-' : (ld >= 0 ? '+' : '') + ld;
            leftBtn.innerHTML = formatMathText(`(${lc}x${ldDisplay}y)`);
        } else {
            const ldSign = ld >= 0 ? '+' : '';
            leftBtn.innerHTML = formatMathText(`(${lc}x${ldSign}${ld})`);
        }
        leftBtn.setAttribute('data-position', 'left');
        leftBtn.setAttribute('data-c', lc);
        leftBtn.setAttribute('data-d', ld);
        leftBtn.setAttribute('data-correct', leftChoices[i].isCorrect);
        leftBtn.onclick = () => selectFactorizeHardAnswer(leftBtn, { c: lc, d: ld }, 'difference');
        answerGrid.appendChild(leftBtn);

        // 右側
        if (i < 3) {
            const rightBtn = document.createElement('button');
            rightBtn.className = 'answer-btn';
            const rc = rightChoices[i].c;
            const rd = rightChoices[i].d;
            if (hasY) {
                // y係数が1や-1の場合は省略表示
                const rdDisplay = rd === 1 ? '+' : rd === -1 ? '-' : (rd >= 0 ? '+' : '') + rd;
                rightBtn.innerHTML = formatMathText(`(${rc}x${rdDisplay}y)`);
            } else {
                const rdSign = rd >= 0 ? '+' : '';
                rightBtn.innerHTML = formatMathText(`(${rc}x${rdSign}${rd})`);
            }
            rightBtn.setAttribute('data-position', 'right');
            rightBtn.setAttribute('data-c', rc);
            rightBtn.setAttribute('data-d', rd);
            rightBtn.setAttribute('data-correct', rightChoices[i].isCorrect);
            rightBtn.onclick = () => selectFactorizeHardAnswer(rightBtn, { c: rc, d: rd }, 'difference');
            answerGrid.appendChild(rightBtn);
        } else {
            // ²ボタン（差の積では使わない）
            const squareBtn = document.createElement('button');
            squareBtn.className = 'answer-btn';
            squareBtn.textContent = '²';
            squareBtn.setAttribute('data-position', 'right');
            squareBtn.setAttribute('data-value', 'square');
            squareBtn.onclick = () => selectFactorizeHardSquare(squareBtn);
            answerGrid.appendChild(squareBtn);
        }
    }
}

function selectFactorizeHardAnswer(button, value, answerType) {
    const pattern = currentQuestion.hardPattern;

    if (answerType === 'pattern1') {
        // (x+ay)(x+by) 形式 - 2つ選択
        if (selectedAnswers.find(ans => ans.value === value)) {
            selectedAnswers = selectedAnswers.filter(ans => ans.value !== value);
            button.classList.remove('selected');
        } else if (selectedAnswers.filter(ans => !ans.isSquare).length < 2) {
            selectedAnswers.push({ value, isSquare: false });
            button.classList.add('selected');
        }
    } else if (answerType === 'square') {
        // (cx+d)² 形式 - 1つ選択
        // 他の非²ボタンの選択を解除
        document.querySelectorAll('.answer-btn').forEach(btn => {
            if (btn !== button && btn.getAttribute('data-value') !== 'square' && btn.classList.contains('selected')) {
                btn.classList.remove('selected');
            }
        });
        selectedAnswers = selectedAnswers.filter(ans => ans.isSquare);

        if (button.classList.contains('selected')) {
            button.classList.remove('selected');
        } else {
            button.classList.add('selected');
            selectedAnswers.push({ value, isSquare: false });
        }
    } else if (answerType === 'difference') {
        // (cx+d)(cx-d) 形式 - 2つ選択
        if (selectedAnswers.find(ans => ans.value && ans.value.c === value.c && ans.value.d === value.d)) {
            selectedAnswers = selectedAnswers.filter(ans => !(ans.value && ans.value.c === value.c && ans.value.d === value.d));
            button.classList.remove('selected');
        } else if (selectedAnswers.filter(ans => !ans.isSquare).length < 2) {
            selectedAnswers.push({ value, isSquare: false });
            button.classList.add('selected');
        }
    } else if (answerType === 'commonFactor') {
        // 共通因数パターン - 2つ選択（左:数値, 右:オブジェクト）
        if (typeof value === 'number') {
            // 左列（共通因数の係数）
            if (selectedAnswers.find(ans => ans.value === value && typeof ans.value === 'number')) {
                selectedAnswers = selectedAnswers.filter(ans => !(typeof ans.value === 'number' && ans.value === value));
                button.classList.remove('selected');
            } else {
                // 同じ列の既存選択を解除
                selectedAnswers.filter(ans => typeof ans.value === 'number').forEach(ans => {
                    document.querySelectorAll('.answer-btn[data-position="left"].selected').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                });
                selectedAnswers = selectedAnswers.filter(ans => typeof ans.value !== 'number');
                selectedAnswers.push({ value, isSquare: false });
                button.classList.add('selected');
            }
        } else {
            // 右列（残りの因数）
            if (selectedAnswers.find(ans => ans.value && ans.value.b === value.b && ans.value.c === value.c)) {
                selectedAnswers = selectedAnswers.filter(ans => !(ans.value && ans.value.b === value.b && ans.value.c === value.c));
                button.classList.remove('selected');
            } else {
                // 同じ列の既存選択を解除
                selectedAnswers.filter(ans => typeof ans.value === 'object' && ans.value.b !== undefined).forEach(ans => {
                    document.querySelectorAll('.answer-btn[data-position="right"].selected').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                });
                selectedAnswers = selectedAnswers.filter(ans => !(typeof ans.value === 'object' && ans.value.b !== undefined));
                selectedAnswers.push({ value, isSquare: false });
                button.classList.add('selected');
            }
        }
    }

    checkFactorizeHardAnswer();
}

function selectFactorizeHardSquare(button) {
    const hasSquare = selectedAnswers.some(ans => ans.isSquare);

    if (hasSquare) {
        selectedAnswers = selectedAnswers.filter(ans => !ans.isSquare);
        button.classList.remove('selected');
    } else {
        selectedAnswers.push({ value: 'square', isSquare: true });
        button.classList.add('selected');
    }

    checkFactorizeHardAnswer();
}

function checkFactorizeHardAnswer() {
    const pattern = currentQuestion.hardPattern;

    if (pattern === 6) {
        // 共通因数パターン
        const correctA = currentQuestion.a;
        const correctB = currentQuestion.b;
        const correctC = currentQuestion.c;
        const nonSquareAnswers = selectedAnswers.filter(ans => !ans.isSquare);

        // 左の値（数値）と右の値（オブジェクト）を分離
        const leftAns = nonSquareAnswers.find(ans => typeof ans.value === 'number');
        const rightAns = nonSquareAnswers.find(ans => typeof ans.value === 'object' && ans.value.b !== undefined);

        // 1つ選択で正解なら中間音
        if (nonSquareAnswers.length === 1) {
            if (leftAns && leftAns.value === correctA) {
                playSound(partialCorrectSound);
            } else if (rightAns && rightAns.value.b === correctB && rightAns.value.c === correctC) {
                playSound(partialCorrectSound);
            } else {
                wrongAnswer();
                return;
            }
        }

        // 2つ選択で判定
        if (nonSquareAnswers.length === 2) {
            if (leftAns && rightAns &&
                leftAns.value === correctA &&
                rightAns.value.b === correctB &&
                rightAns.value.c === correctC) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }

        // ²ボタンを押したら不正解
        if (selectedAnswers.some(ans => ans.isSquare)) {
            wrongAnswer();
        }

    } else if (pattern === 1) {
        // (x+ay)(x+by) 形式
        const correctA = currentQuestion.a;
        const correctB = currentQuestion.b;
        const nonSquareAnswers = selectedAnswers.filter(ans => !ans.isSquare);

        // 1つ選択で正解なら中間音
        if (nonSquareAnswers.length === 1) {
            const val = nonSquareAnswers[0].value;
            if (val === correctA || val === correctB) {
                playSound(partialCorrectSound);
            } else {
                wrongAnswer();
                return;
            }
        }

        // 2つ選択で判定
        if (nonSquareAnswers.length === 2) {
            const values = nonSquareAnswers.map(ans => ans.value);
            if (values.includes(correctA) && values.includes(correctB)) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }

        // ²ボタンを押したら不正解
        if (selectedAnswers.some(ans => ans.isSquare)) {
            wrongAnswer();
        }

    } else if (pattern === 2 || pattern === 3) {
        // (cx+d)² または (cx+dy)² 形式
        const correctC = currentQuestion.c;
        const correctD = currentQuestion.d;
        const hasSquare = selectedAnswers.some(ans => ans.isSquare);
        const nonSquareAnswers = selectedAnswers.filter(ans => !ans.isSquare);

        if (nonSquareAnswers.length === 1 && !hasSquare) {
            const val = nonSquareAnswers[0].value;
            if (val.c === correctC && val.d === correctD) {
                playSound(partialCorrectSound);
            } else {
                wrongAnswer();
                return;
            }
        }

        if (nonSquareAnswers.length === 1 && hasSquare) {
            const val = nonSquareAnswers[0].value;
            if (val.c === correctC && val.d === correctD) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }

        // 2つの非²選択は不正解
        if (nonSquareAnswers.length >= 2) {
            wrongAnswer();
        }

    } else if (pattern === 4 || pattern === 5) {
        // (cx+d)(cx-d) 形式
        const correctC = currentQuestion.c;
        const correctD = currentQuestion.d;
        const nonSquareAnswers = selectedAnswers.filter(ans => !ans.isSquare);

        // 1つ選択で正解なら中間音
        if (nonSquareAnswers.length === 1) {
            const val = nonSquareAnswers[0].value;
            if (val.c === correctC && Math.abs(val.d) === correctD) {
                playSound(partialCorrectSound);
            } else {
                wrongAnswer();
                return;
            }
        }

        // 2つ選択で判定
        if (nonSquareAnswers.length === 2) {
            const vals = nonSquareAnswers.map(ans => ans.value);
            // 両方がcorrectCで、dが+correctDと-correctDであること
            const hasPlus = vals.some(v => v.c === correctC && v.d === correctD);
            const hasMinus = vals.some(v => v.c === correctC && v.d === -correctD);
            if (hasPlus && hasMinus) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }

        // ²ボタンを押したら不正解
        if (selectedAnswers.some(ans => ans.isSquare)) {
            wrongAnswer();
        }
    }
}

function generateFactorizeAnswers() {
    const correctP = currentQuestion.p;
    const correctQ = currentQuestion.q;
    const isSquare = correctP === correctQ;

    let leftChoices, rightChoices;

    if (isSquare) {
        // 2乗問題の場合：正解は1つだけ、²と組み合わせる
        // 左側の選択肢（正解1つ + ダミー3つ）
        leftChoices = new Set([correctP]);
        while (leftChoices.size < 4) {
            const candidate = getRandomNonZero();
            if (candidate !== correctP) {
                leftChoices.add(candidate);
            }
        }

        // 右側の選択肢（ダミー3つのみ、正解は含めない）
        rightChoices = new Set();
        while (rightChoices.size < 3) {
            const candidate = getRandomNonZero();
            if (candidate !== correctP && !leftChoices.has(candidate)) {
                rightChoices.add(candidate);
            }
        }
    } else {
        // 通常問題の場合：正解の2つをランダムに左右に振り分け
        const leftCorrect = Math.random() < 0.5 ? correctP : correctQ;
        const rightCorrect = leftCorrect === correctP ? correctQ : correctP;

        // 左側の選択肢（正解1つ + ダミー3つ）
        leftChoices = new Set([leftCorrect]);
        while (leftChoices.size < 4) {
            const candidate = getRandomNonZero();
            if (candidate !== correctP && candidate !== correctQ) {
                leftChoices.add(candidate);
            }
        }

        // 右側の選択肢（正解1つ + ダミー2つ）
        rightChoices = new Set([rightCorrect]);
        while (rightChoices.size < 3) {
            const candidate = getRandomNonZero();
            if (candidate !== correctP && candidate !== correctQ && !leftChoices.has(candidate)) {
                rightChoices.add(candidate);
            }
        }
    }

    const leftArray = Array.from(leftChoices).sort(() => Math.random() - 0.5);
    const rightArray = Array.from(rightChoices).sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';

    // 左側4個と右側4個を交互に配置して縦4×横2にする
    for (let i = 0; i < 4; i++) {
        // 左側のボタン
        const leftBtn = document.createElement('button');
        leftBtn.className = 'answer-btn';
        leftBtn.innerHTML = formatMathText(`(x${leftArray[i] >= 0 ? '+' : ''}${leftArray[i]})`);
        leftBtn.setAttribute('data-position', 'left');
        leftBtn.setAttribute('data-value', leftArray[i]);
        leftBtn.onclick = () => selectFactorizeAnswer(leftBtn, leftArray[i]);
        answerGrid.appendChild(leftBtn);

        // 右側のボタン
        if (i < 3) {
            const rightBtn = document.createElement('button');
            rightBtn.className = 'answer-btn';
            rightBtn.innerHTML = formatMathText(`(x${rightArray[i] >= 0 ? '+' : ''}${rightArray[i]})`);
            rightBtn.setAttribute('data-position', 'right');
            rightBtn.setAttribute('data-value', rightArray[i]);
            rightBtn.onclick = () => selectFactorizeAnswer(rightBtn, rightArray[i]);
            answerGrid.appendChild(rightBtn);
        } else {
            // 右下に²ボタンを配置
            const squareBtn = document.createElement('button');
            squareBtn.className = 'answer-btn';
            squareBtn.textContent = '²';
            squareBtn.setAttribute('data-position', 'right');
            squareBtn.setAttribute('data-value', 'square');
            squareBtn.onclick = () => selectSquare(squareBtn);
            answerGrid.appendChild(squareBtn);
        }
    }
}

function selectFactorizeAnswer(button, value) {
    if (selectedAnswers.find(ans => ans.value === value)) {
        selectedAnswers = selectedAnswers.filter(ans => ans.value !== value);
        button.classList.remove('selected');
    } else if (selectedAnswers.length < 2) {
        selectedAnswers.push({ value, isSquare: false });
        button.classList.add('selected');
    }

    checkFactorizeAnswer();
}

function selectSquare(button) {
    if (selectedAnswers.find(ans => ans.isSquare)) {
        selectedAnswers = selectedAnswers.filter(ans => !ans.isSquare);
        button.classList.remove('selected');
    } else if (selectedAnswers.length === 1) {
        selectedAnswers.push({ isSquare: true });
        button.classList.add('selected');
    }

    checkFactorizeAnswer();
}

function checkFactorizeAnswer() {
    // 中間正解音の再生チェック / 不正解判定
    if (selectedAnswers.length === 1) {
        const firstAnswer = selectedAnswers[0];
        if (!firstAnswer.isSquare) {
            // 数値選択肢の場合
            if (firstAnswer.value === currentQuestion.p || firstAnswer.value === currentQuestion.q) {
                // 正解の選択肢
                playSound(partialCorrectSound);
            } else {
                // 不正解の選択肢を選んだら即座に不正解判定
                wrongAnswer();
                return;
            }
        }
    }

    if (selectedAnswers.length === 2) {
        const values = selectedAnswers.filter(ans => !ans.isSquare).map(ans => ans.value);
        const hasSquare = selectedAnswers.some(ans => ans.isSquare);

        if (hasSquare && values.length === 1) {
            if (values[0] === currentQuestion.p && currentQuestion.p === currentQuestion.q) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        } else if (!hasSquare && values.length === 2) {
            if ((values.includes(currentQuestion.p) && values.includes(currentQuestion.q)) &&
                currentQuestion.p !== currentQuestion.q) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        } else {
            wrongAnswer();
        }
    }
}
