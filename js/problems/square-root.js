// 平方根ラッシュの問題生成・正誤判定

// 平方根を簡単化する関数（√x を a√b の形にする）
function simplifySquareRoot(x) {
    let a = 1;
    let b = x;

    // 完全平方数かチェック
    const sqrt = Math.sqrt(x);
    if (Number.isInteger(sqrt)) {
        return { a: sqrt, b: 1 };
    }

    // 平方数で割っていく
    for (let i = 2; i * i <= b; i++) {
        while (b % (i * i) === 0) {
            a *= i;
            b /= (i * i);
        }
    }

    return { a, b };
}

// 平方数の因数を含む8-100の数をランダム生成（√の中身は17未満に制限）
function getRandomSquareRootNumber() {
    const shouldBeHighB = Math.random() < 0.2; // 20%の確率でb≧11
    let num;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        num = Math.floor(Math.random() * 93) + 8; // 8から100までの整数
        const simplified = simplifySquareRoot(num);

        // 平方数の因数を含む（a > 1が必須）数で、かつb < 17、かつb≧11またはb≦10の条件を満たす
        const isSimplifiable = simplified.a > 1;
        const isBUnder17 = simplified.b < 17; // √の中身は17未満に制限
        const meetsCondition = shouldBeHighB ? (simplified.b >= 11 && simplified.b < 17) : (simplified.b <= 10);

        if (isSimplifiable && isBUnder17 && meetsCondition) {
            break;
        }

        attempts++;
    } while (attempts < maxAttempts);

    // 最大試行回数を超えた場合は条件を緩和して任意の簡単化可能な数（a > 1, b < 17）を返す
    if (attempts >= maxAttempts) {
        do {
            num = Math.floor(Math.random() * 93) + 8;
            const simplified = simplifySquareRoot(num);
        } while (simplifySquareRoot(num).a <= 1 || simplifySquareRoot(num).b >= 17);
    }

    return num;
}

// 平方根問題を生成
function generateSquareRootQuestion() {
    // ハードモードで35%の確率で分数問題を出題
    if (difficultyMode === 'hard' && Math.random() < 0.35) {
        generateSquareRootHardQuestion();
        return;
    }

    let x;
    do {
        x = getRandomSquareRootNumber();
        // 直前の問題と同じでないかチェック
    } while (lastQuestionValues && lastQuestionValues.x === x);

    const simplified = simplifySquareRoot(x);
    const correctA = simplified.a;
    const correctB = simplified.b;

    currentQuestion = {
        x: x,
        a: correctA,
        b: correctB,
        original: `√${x}`,
        answer: correctB === 1 ? `${correctA}` : `${correctA}√${correctB}`,
        isFraction: false
    };

    // 現在の問題の値を保存
    lastQuestionValues = { x };

    document.getElementById('question').innerHTML = `${formatSquareRoot(x)} = ____`;
    generateSquareRootAnswers();
}

// 平方根ハード問題を生成（分数形式: ab/√b = a√b）
function generateSquareRootHardQuestion() {
    // aは1〜9、bは2,3,5,6,7,10のいずれか
    const possibleB = [2, 3, 5, 6, 7, 10];
    let a, b;

    do {
        a = Math.floor(Math.random() * 9) + 1; // 1〜9
        b = possibleB[Math.floor(Math.random() * possibleB.length)];
    } while (lastQuestionValues && lastQuestionValues.isFraction &&
             lastQuestionValues.a === a && lastQuestionValues.b === b);

    // 分子 = a * b
    const numerator = a * b;

    currentQuestion = {
        a: a,
        b: b,
        numerator: numerator,
        original: `${numerator}/√${b}`,
        answer: a === 1 ? `√${b}` : `${a}√${b}`,
        isFraction: true,
        singleSelection: a === 1 // a=1の場合は√bのみ選択で正解
    };

    lastQuestionValues = { isFraction: true, a, b };

    // 分数表示
    const questionHTML = `<span class="fraction"><span class="numerator">${numerator}</span><span class="denominator">${formatSquareRoot(b)}</span></span> = ____`;
    document.getElementById('question').innerHTML = questionHTML;

    generateSquareRootHardAnswers();
}

// 平方根ハード問題の解答ボタンを生成
function generateSquareRootHardAnswers() {
    const correctA = currentQuestion.a;
    const correctB = currentQuestion.b;
    const singleSelection = currentQuestion.singleSelection;

    // 整数の選択肢を生成（左側4つ）
    const aChoices = new Set([correctA]);
    while (aChoices.size < 4) {
        const candidate = Math.floor(Math.random() * 9) + 1; // 1〜9
        aChoices.add(candidate);
    }

    // √の選択肢を生成（右側4つ）- 正解を含む
    const possibleB = [2, 3, 5, 6, 7, 10];
    const bChoices = new Set([correctB]);
    while (bChoices.size < 4) {
        const candidate = possibleB[Math.floor(Math.random() * possibleB.length)];
        bChoices.add(candidate);
    }

    const aArray = Array.from(aChoices).sort(() => Math.random() - 0.5);
    const bArray = Array.from(bChoices).sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';
    answerGrid.className = 'answer-grid';

    for (let i = 0; i < 4; i++) {
        // 左側: 整数
        const aBtn = document.createElement('button');
        aBtn.className = 'answer-btn';
        aBtn.textContent = aArray[i];
        aBtn.setAttribute('data-type', 'a');
        aBtn.setAttribute('data-value', aArray[i]);
        aBtn.onclick = () => selectSquareRootHardAnswer(aBtn, 'a', aArray[i]);
        answerGrid.appendChild(aBtn);

        // 右側: √b
        const bBtn = document.createElement('button');
        bBtn.className = 'answer-btn';
        bBtn.innerHTML = formatSquareRoot(bArray[i]);
        bBtn.setAttribute('data-type', 'b');
        bBtn.setAttribute('data-value', bArray[i]);
        bBtn.onclick = () => selectSquareRootHardAnswer(bBtn, 'b', bArray[i]);
        answerGrid.appendChild(bBtn);
    }
}

function selectSquareRootHardAnswer(button, type, value) {
    // 同じタイプの既存選択を解除
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn !== button && btn.classList.contains('selected')) {
            const btnType = btn.getAttribute('data-type');
            if (btnType === type) {
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

    checkSquareRootHardAnswer();
}

function checkSquareRootHardAnswer() {
    const correctA = currentQuestion.a;
    const correctB = currentQuestion.b;
    const singleSelection = currentQuestion.singleSelection;

    const hasCorrectA = selectedAnswers.some(ans => ans.type === 'a' && ans.value === correctA);
    const hasCorrectB = selectedAnswers.some(ans => ans.type === 'b' && ans.value === correctB);

    if (singleSelection) {
        // a=1の場合: √bのみ選択で正解
        if (selectedAnswers.length === 1) {
            const ans = selectedAnswers[0];
            if (ans.type === 'b' && ans.value === correctB) {
                correctAnswer();
            } else if (ans.type === 'a') {
                // 整数を選択したら不正解
                wrongAnswer();
            } else if (ans.type === 'b' && ans.value !== correctB) {
                wrongAnswer();
            }
        }
        // 2つ選択した場合は不正解
        if (selectedAnswers.length >= 2) {
            wrongAnswer();
        }
    } else {
        // a>1の場合: aとbの両方選択で正解
        if (selectedAnswers.length === 1) {
            const ans = selectedAnswers[0];
            if ((ans.type === 'a' && ans.value === correctA) ||
                (ans.type === 'b' && ans.value === correctB)) {
                playSound(partialCorrectSound);
            } else {
                wrongAnswer();
                return;
            }
        }

        if (selectedAnswers.length === 2) {
            if (hasCorrectA && hasCorrectB) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }
    }
}

// 平方根の解答ボタンを生成（4×2レイアウト）
function generateSquareRootAnswers() {
    const correctA = currentQuestion.a;
    const correctB = currentQuestion.b;
    const isPerfectSquare = correctB === 1;

    // 整数の選択肢を生成（左側4つ）- 1は除外
    const aChoices = new Set([correctA]);
    while (aChoices.size < 4) {
        const candidate = Math.floor(Math.random() * 9) + 2; // 2-10の整数
        aChoices.add(candidate);
    }

    // √の選択肢を生成（右側4つ）
    const bChoices = new Set();
    if (!isPerfectSquare) {
        bChoices.add(correctB);
    }

    // 簡単化できない数（素数や平方数の因数を含まない数）を選択肢に追加
    const possibleB = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15, 17, 19, 21, 22, 23];
    while (bChoices.size < 4) {
        const candidate = possibleB[Math.floor(Math.random() * possibleB.length)];
        bChoices.add(candidate);
    }

    const aArray = Array.from(aChoices).sort(() => Math.random() - 0.5);
    const bArray = Array.from(bChoices).sort(() => Math.random() - 0.5);

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.innerHTML = '';
    answerGrid.className = 'answer-grid'; // 4×2グリッド

    // 左側4個と右側4個を交互に配置して縦4×横2にする
    for (let i = 0; i < 4; i++) {
        // 左側: 整数（a の部分）
        const aBtn = document.createElement('button');
        aBtn.className = 'answer-btn';
        aBtn.textContent = aArray[i];
        aBtn.setAttribute('data-type', 'a');
        aBtn.setAttribute('data-value', aArray[i]);
        aBtn.onclick = () => selectSquareRootAnswer(aBtn, 'a', aArray[i]);
        answerGrid.appendChild(aBtn);

        // 右側: √の数（√b の部分）
        const bBtn = document.createElement('button');
        bBtn.className = 'answer-btn';
        bBtn.innerHTML = formatSquareRoot(bArray[i]);
        bBtn.setAttribute('data-type', 'b');
        bBtn.setAttribute('data-value', bArray[i]);
        bBtn.onclick = () => selectSquareRootAnswer(bBtn, 'b', bArray[i]);
        answerGrid.appendChild(bBtn);
    }
}

// 平方根の解答を選択
function selectSquareRootAnswer(button, type, value) {
    // 同じタイプの既存選択を解除
    document.querySelectorAll('.answer-btn').forEach(btn => {
        if (btn !== button && btn.classList.contains('selected')) {
            const isLeftColumn = Array.from(btn.parentElement.children).indexOf(btn) % 2 === 0;
            const otherType = isLeftColumn ? 'a' : 'b';
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

    checkSquareRootAnswer();
}

// 平方根の解答をチェック
function checkSquareRootAnswer() {
    const isPerfectSquare = currentQuestion.b === 1;

    if (isPerfectSquare) {
        // 完全平方数の場合、整数のみで正解
        const hasCorrectA = selectedAnswers.some(ans => ans.type === 'a' && ans.value === currentQuestion.a);

        // 整数のみを選択している場合
        if (selectedAnswers.length === 1 && selectedAnswers[0].type === 'a') {
            if (hasCorrectA) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        } else if (selectedAnswers.length >= 1) {
            // √を選んでいる場合は即座に不正解
            const hasWrongB = selectedAnswers.some(ans => ans.type === 'b');
            if (hasWrongB) {
                wrongAnswer();
            } else if (selectedAnswers.length === 2) {
                // 整数を2つ選んでいる場合も不正解
                wrongAnswer();
            }
        }
    } else {
        // 平方数でない場合、a√bの形で解答
        const hasCorrectA = selectedAnswers.some(ans => ans.type === 'a' && ans.value === currentQuestion.a);
        const hasCorrectB = selectedAnswers.some(ans => ans.type === 'b' && ans.value === currentQuestion.b);

        // 中間正解音の再生チェック / 不正解判定
        if (selectedAnswers.length === 1) {
            const firstAnswer = selectedAnswers[0];
            if ((firstAnswer.type === 'a' && firstAnswer.value === currentQuestion.a) ||
                (firstAnswer.type === 'b' && firstAnswer.value === currentQuestion.b)) {
                playSound(partialCorrectSound);
            } else {
                // 不正解の選択肢を1つ選んだ時点で不正解
                wrongAnswer();
                return;
            }
        }

        // 両方選択している場合
        if (selectedAnswers.length === 2) {
            if (hasCorrectA && hasCorrectB) {
                correctAnswer();
            } else {
                wrongAnswer();
            }
        }
    }
}
