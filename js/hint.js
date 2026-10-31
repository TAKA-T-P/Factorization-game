// ゲーム中の「ヒント」ボタン（正解の選択肢をハイライト）

// ヘルプボタン押下時の処理
function showCorrectAnswerHint() {
    helpUsed = true;
    hideHelpButton();

    // すべての選択肢からhint-highlightを削除
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('hint-highlight');
    });

    if (gameMode === 'expand') {
        // 正解の選択肢を集める
        const correctButtons = [];

        if (difficultyMode === 'hard' && currentQuestion.hardPattern) {
            // ハードモード: col1, col2, col3 から正解を探す
            const pattern = currentQuestion.hardPattern;
            let correctValues = {};

            if (pattern === 7) {
                // 共通因数パターン: col3はダミー
                correctValues = { col1: currentQuestion.col1Value, col2: currentQuestion.col2Value };
            } else if (pattern === 1) {
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
                correctValues = { col1: currentQuestion.x2Coeff, col3: currentQuestion.constant };
            } else if (pattern === 5) {
                correctValues = { col1: currentQuestion.x2Coeff, col3: currentQuestion.y2Coeff };
            } else if (pattern === 6) {
                if (currentQuestion.xCoeff === 0) {
                    correctValues = { col1: 1, col3: currentQuestion.constant };
                } else {
                    correctValues = { col1: 1, col2: currentQuestion.xCoeff, col3: currentQuestion.constant };
                }
            }

            document.querySelectorAll('.answer-btn').forEach(btn => {
                const value = parseInt(btn.getAttribute('data-value'));
                const type = btn.getAttribute('data-type');
                if (correctValues[type] === value) {
                    correctButtons.push(btn);
                }
            });
        } else {
            // ノーマルモード
            const correctX = currentQuestion.xCoeff;
            const correctConst = currentQuestion.constant;

            document.querySelectorAll('.answer-btn').forEach(btn => {
                const value = parseInt(btn.getAttribute('data-value'));
                const type = btn.getAttribute('data-type');

                if ((type === 'x' && value === correctX) ||
                    (type === 'const' && value === correctConst)) {
                    correctButtons.push(btn);
                }
            });
        }

        // ハードモードは2つ、ノーマルモードは1つ光らせる
        if (correctButtons.length > 0) {
            if (difficultyMode === 'hard' && correctButtons.length >= 2) {
                // ハードモード: ランダムに2つ選んで光らせる
                const shuffled = correctButtons.sort(() => Math.random() - 0.5);
                shuffled[0].classList.add('hint-highlight');
                shuffled[1].classList.add('hint-highlight');
            } else {
                // ノーマルモード: ランダムに1つだけ光らせる
                const randomIndex = Math.floor(Math.random() * correctButtons.length);
                correctButtons[randomIndex].classList.add('hint-highlight');
            }
        }
    } else if (gameMode === 'factorize') {
        // 正解の選択肢を集める
        const correctButtons = [];

        if (difficultyMode === 'hard' && currentQuestion.hardPattern) {
            // ハードモード
            const pattern = currentQuestion.hardPattern;

            if (pattern === 6) {
                // 共通因数パターン: 左は共通因数の係数a、右は残りの因数(bx±c)
                document.querySelectorAll('.answer-btn').forEach(btn => {
                    const position = btn.getAttribute('data-position');
                    if (position === 'left' && parseInt(btn.getAttribute('data-value')) === currentQuestion.a) {
                        correctButtons.push(btn);
                    } else if (position === 'right' &&
                               parseInt(btn.getAttribute('data-b')) === currentQuestion.b &&
                               parseInt(btn.getAttribute('data-c')) === currentQuestion.c) {
                        correctButtons.push(btn);
                    }
                });
            } else if (pattern === 1) {
                // (x+ay)(x+by) 形式
                const correctA = currentQuestion.a;
                const correctB = currentQuestion.b;
                document.querySelectorAll('.answer-btn').forEach(btn => {
                    const value = parseInt(btn.getAttribute('data-value'));
                    if (value === correctA || value === correctB) {
                        correctButtons.push(btn);
                    }
                });
            } else {
                // (cx+d)², (cx+dy)², (cx+d)(cx-d), (cx+dy)(cx-dy) 形式
                const correctC = currentQuestion.c;
                const correctD = currentQuestion.d;
                document.querySelectorAll('.answer-btn').forEach(btn => {
                    const c = parseInt(btn.getAttribute('data-c'));
                    const d = parseInt(btn.getAttribute('data-d'));
                    if (c === correctC && (d === correctD || d === -correctD)) {
                        correctButtons.push(btn);
                    }
                });
            }
        } else {
            // ノーマルモード
            const correctP = currentQuestion.p;
            const correctQ = currentQuestion.q;

            document.querySelectorAll('.answer-btn').forEach(btn => {
                const value = parseInt(btn.getAttribute('data-value'));
                const position = btn.getAttribute('data-position');

                // 2乗問題の場合
                if (correctP === correctQ && position === 'left' && value === correctP) {
                    correctButtons.push(btn);
                }
                // 通常問題の場合
                else if (correctP !== correctQ && (value === correctP || value === correctQ)) {
                    correctButtons.push(btn);
                }
            });
        }

        // ランダムに1つだけ選んで光らせる
        if (correctButtons.length > 0) {
            const randomIndex = Math.floor(Math.random() * correctButtons.length);
            correctButtons[randomIndex].classList.add('hint-highlight');
        }
    } else if (gameMode === 'squareRoot') {
        // 平方根問題の場合、正解のaとbのうち1つだけをランダムに光らせる
        const correctA = currentQuestion.a;
        const correctB = currentQuestion.b;
        const isPerfectSquare = correctB === 1;

        // 正解の選択肢を集める
        const correctButtons = [];
        document.querySelectorAll('.answer-btn').forEach(btn => {
            const dataValue = btn.getAttribute('data-value');
            const dataType = btn.getAttribute('data-type');
            const value = parseInt(dataValue);

            // 完全平方数の場合はaのみ、そうでない場合はaとb両方を候補にする
            if (dataType === 'a' && value === correctA) {
                correctButtons.push(btn);
            } else if (!isPerfectSquare && dataType === 'b' && value === correctB) {
                correctButtons.push(btn);
            }
        });

        // ランダムに1つだけ選んで光らせる
        if (correctButtons.length > 0) {
            const randomIndex = Math.floor(Math.random() * correctButtons.length);
            correctButtons[randomIndex].classList.add('hint-highlight');
        }
    }
}
