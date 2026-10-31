// ゲーム進行（状態・時間・コンボ・得点・結果画面）

let gameMode = '';
let timeMode = 60; // 60秒 or 180秒
let isPracticeMode = false; // 練習モード（時間制限・スコアなし）。timeMode は1分/3分の設定のまま残す
let difficultyMode = 'normal'; // 'normal' または 'hard'
let score = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let timeLeft = 60;
let timer = null;
let currentQuestion = null;
let selectedAnswers = [];
let questionHistory = [];
let audioEnabled = true;
let isLastQuestion = false;
let consecutiveCorrect = 0;
let maxCombo = 0; // 最大コンボ数
let lastQuestionValues = null; // 直前の問題の値を保存
let answeredCurrentQuestion = false; // 現在の問題に回答済みかどうか
let questionStartTime = 0; // 問題開始時刻

// ヘルプボタン関連
let helpButtonTimeout = null; // 10秒後にヘルプボタンを表示するタイマー
let lastQuestionTimeout = null; // 最終問題の20秒タイムアウト
let helpUsed = false; // ヘルプを使用したかどうか

// コンボゲージ関連
let comboGaugeTimer = null;
let comboGaugeValue = 100; // 0-100
let comboGaugeDuration = 10000; // 基本10秒
let comboGaugeUpdateInterval = 100; // 100msごとに更新

// タイムアウトID管理
let pendingTimeouts = [];

// カウントダウン実行中フラグ
let isCountdownRunning = false;

// すべての保留中のタイムアウトをクリア
function clearAllTimeouts() {
    pendingTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeouts = [];
}

// タイムアウトを追跡して設定
function setTrackedTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        try {
            callback();
        } catch (error) {
            console.error('Error in tracked timeout:', error);
        }
        // 完了したタイムアウトを配列から削除
        pendingTimeouts = pendingTimeouts.filter(id => id !== timeoutId);
    }, delay);
    pendingTimeouts.push(timeoutId);
    return timeoutId;
}

// コンボゲージの減少速度を計算
function getGaugeSpeedMultiplier() {
    let multiplier;
    if (timeMode === 60) {
        // 1分モード: (1 + 0.1n) 倍
        multiplier = 1 + (0.1 * consecutiveCorrect);
    } else {
        // 3分モード: (1 + 0.04n) 倍
        multiplier = 1 + (0.04 * consecutiveCorrect);
    }

    // モードと難易度による速度調整（数値が小さいほど遅くなる）
    if (difficultyMode === 'hard') {
        // ハードモード
        if (gameMode === 'expand') {
            multiplier *= 0.75; // 展開ハードは0.75倍（遅い）
        } else if (gameMode === 'factorize') {
            multiplier *= 0.9; // 因数分解ハードは0.9倍
        }
        // 平方根ハードはそのまま
    } else {
        // ノーマルモード
        if (gameMode === 'factorize') {
            multiplier *= 0.8; // 因数分解ノーマルは0.8倍
        }
        // 平方根・展開ノーマルはそのまま
    }

    return multiplier;
}

// コンボゲージを開始
function startComboGauge() {
    stopComboGauge(); // 既存のタイマーをクリア

    comboGaugeValue = 100;
    updateComboGaugeDisplay();

    const speedMultiplier = getGaugeSpeedMultiplier();
    const actualDuration = comboGaugeDuration / speedMultiplier;
    const decrementPerUpdate = (100 / actualDuration) * comboGaugeUpdateInterval;

    comboGaugeTimer = setInterval(() => {
        comboGaugeValue -= decrementPerUpdate;

        if (comboGaugeValue <= 0) {
            comboGaugeValue = 0;
            stopComboGauge();
            // ゲージが0になったらコンボリセット
            consecutiveCorrect = 0;
            // 画面を暗くする
            document.body.classList.add('gauge-depleted');
        }

        updateComboGaugeDisplay();
    }, comboGaugeUpdateInterval);
}

// コンボゲージを停止
function stopComboGauge() {
    if (comboGaugeTimer) {
        clearInterval(comboGaugeTimer);
        comboGaugeTimer = null;
    }
}

// コンボゲージの表示を更新
function updateComboGaugeDisplay() {
    const gaugeFill = document.getElementById('comboGaugeFill');
    gaugeFill.style.width = comboGaugeValue + '%';

    // 色の変更
    gaugeFill.className = 'combo-gauge-fill';
    if (comboGaugeValue <= 30) {
        gaugeFill.classList.add('danger');
    } else if (comboGaugeValue <= 50) {
        gaugeFill.classList.add('warning');
    }
}

// コンボゲージを表示/非表示
function showComboGauge(show) {
    const container = document.getElementById('comboGaugeContainer');
    container.style.display = show ? 'block' : 'none';
}

// time は 60 / 180 / 'practice'
function selectTime(time) {
    isPracticeMode = time === 'practice';
    if (!isPracticeMode) {
        timeMode = time;
    }
    document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(isPracticeMode ? 'timePractice' : `time${time}`).classList.add('active');
}

function selectDifficulty(difficulty) {
    difficultyMode = difficulty;
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`difficulty${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`).classList.add('active');
    const gameTitle = document.getElementById('gameTitle');
    // ハードモード選択時に背景とタイトルを赤っぽくする
    if (difficulty === 'hard') {
        document.body.classList.add('hard-mode');
        gameTitle.style.color = '#dc2626';
        gameTitle.style.textShadow = '2px 2px 4px rgba(220, 38, 38, 0.3)';
    } else {
        document.body.classList.remove('hard-mode');
        gameTitle.style.color = '#3b82f6';
        gameTitle.style.textShadow = '2px 2px 4px rgba(59, 130, 246, 0.3)';
    }
}

// ヘルプボタン表示
function showHelpButton() {
    const helpButton = document.getElementById('helpButton');
    if (helpButton && !helpUsed) {
        helpButton.classList.add('show');
    }
}

// ヘルプボタン非表示
function hideHelpButton() {
    const helpButton = document.getElementById('helpButton');
    if (helpButton) {
        helpButton.classList.remove('show');
    }
    if (helpButtonTimeout) {
        clearTimeout(helpButtonTimeout);
        helpButtonTimeout = null;
    }
}

// 最終問題の20秒タイムアウト処理
function startLastQuestionTimeout() {
    if (lastQuestionTimeout) {
        clearTimeout(lastQuestionTimeout);
    }

    lastQuestionTimeout = setTrackedTimeout(() => {
        handleQuestionTimeout();
    }, 20000); // 20秒
}

// タイムアウト処理
function handleQuestionTimeout() {
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.innerHTML = '<span>時間切れ</span>';
    comboDisplay.classList.add('show');

    setTrackedTimeout(() => {
        comboDisplay.classList.remove('show');
        wrongAnswer();
    }, 1000);
}

function startGame(mode) {
    // すべての保留中のタイムアウトをクリア
    clearAllTimeouts();

    // タイマーをクリア
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // カウントダウンオーバーレイを確実に非表示にする
    const overlay = document.getElementById('countdownOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // カウントダウンフラグをリセット
    isCountdownRunning = false;

    gameMode = mode;
    score = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    timeLeft = timeMode;
    selectedAnswers = [];
    questionHistory = [];
    isLastQuestion = false;
    consecutiveCorrect = 0;
    maxCombo = 0;
    lastQuestionValues = null;

    // コンボゲージをリセット
    stopComboGauge();
    comboGaugeValue = 100;
    showComboGauge(false);

    // コンボ表示をクリア
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.textContent = '';
    comboDisplay.classList.remove('show');

    // 前回のボタンの状態をクリア
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong');
    });

    // 画面の明るさとエフェクトをリセット
    document.body.classList.remove('gauge-depleted');
    document.body.classList.remove('celebration');

    document.getElementById('score').textContent = score;
    document.getElementById('timerDisplay').innerHTML = '残り時間: <span id="timeLeft">' + timeLeft.toFixed(1) + '</span>秒';

    document.body.classList.remove('practice-mode');
    showScreen('gameScreen');

    // 練習モードはカウントダウン・タイマーなしで始める
    if (isPracticeMode) {
        startPractice();
        return;
    }

    // カウントダウンを開始
    showCountdown();
}

function showCountdown() {
    // 既にカウントダウンが実行中の場合は中断
    if (isCountdownRunning) {
        return;
    }

    isCountdownRunning = true;
    const overlay = document.getElementById('countdownOverlay');
    const numberDisplay = document.getElementById('countdownNumber');

    const countdownSequence = [3, 2, 1, 'START!'];
    let currentIndex = 0;

    overlay.classList.add('show');

    function displayNext() {
        if (currentIndex < countdownSequence.length) {
            const value = countdownSequence[currentIndex];
            numberDisplay.textContent = value;

            // アニメーションをリセットして再開
            numberDisplay.style.animation = 'none';
            setTrackedTimeout(() => {
                numberDisplay.style.animation = 'countdown-pulse 1s ease';
            }, 10);

            // 音を再生
            if (value === 'START!') {
                playSound(startBeep);
            } else {
                playSound(countdownBeep);
            }

            currentIndex++;

            if (currentIndex < countdownSequence.length) {
                setTrackedTimeout(displayNext, 1000);
            } else {
                setTrackedTimeout(() => {
                    overlay.classList.remove('show');
                    isCountdownRunning = false;
                    // カウントダウン終了後にゲーム開始
                    generateQuestion();
                    startTimer();
                }, 1000);
            }
        }
    }

    displayNext();
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft -= 0.1;
        if (timeLeft < 0) timeLeft = 0;
        document.getElementById('timeLeft').textContent = timeLeft.toFixed(1);

        if (timeLeft <= 0) {
            clearInterval(timer);
            isLastQuestion = true;
            document.getElementById('timerDisplay').innerHTML = '最終問題';
            // 最終問題の20秒タイムアウトを開始
            startLastQuestionTimeout();
        }
    }, 100);
}

function generateQuestion() {
    selectedAnswers = [];
    answeredCurrentQuestion = false; // 回答済みフラグをリセット

    // 問題開始時刻を記録
    questionStartTime = Date.now();

    // 前回のボタンの状態とヘルプボタン関連をクリア
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected', 'correct', 'wrong', 'hint-highlight');
    });

    // ヘルプボタンを非表示にして、タイマーをクリア
    hideHelpButton();
    helpUsed = false;

    // 10秒後にヘルプボタンを表示
    helpButtonTimeout = setTrackedTimeout(() => {
        showHelpButton();
    }, 10000);

    // 最終問題の場合、20秒のタイムアウトタイマーを開始
    if (isLastQuestion && lastQuestionTimeout) {
        clearTimeout(lastQuestionTimeout);
        lastQuestionTimeout = null;
    }
    if (isLastQuestion) {
        startLastQuestionTimeout();
    }

    const answerGrid = document.getElementById('answerGrid');
    answerGrid.className = gameMode === 'factorize' ? 'factors-grid' : 'answer-grid';

    // 1コンボ目からゲージを表示（満タン）、2コンボ目以降は減少開始（練習モードはゲージなし）
    showComboGauge(!isPracticeMode);
    comboGaugeValue = 100;
    updateComboGaugeDisplay();

    // 2コンボ目以降のみゲージを減らす
    if (isPracticeMode) {
        stopComboGauge();
    } else if (consecutiveCorrect >= 1) {
        startComboGauge();
    } else {
        // 1コンボ目はゲージを停止（満タンのまま）
        stopComboGauge();
    }

    if (gameMode === 'expand') {
        generateExpandQuestion();
    } else if (gameMode === 'factorize') {
        generateFactorizeQuestion();
    } else {
        generateSquareRootQuestion();
    }
}


function correctAnswer() {
    // すでに回答済みの場合は処理しない（複数回カウントを防止）
    if (answeredCurrentQuestion) {
        return;
    }
    answeredCurrentQuestion = true;

    if (isPracticeMode) {
        practiceCorrectAnswer();
        return;
    }

    // ヘルプボタンを非表示にし、タイマーをクリア
    hideHelpButton();

    // 最終問題のタイムアウトをクリア
    if (lastQuestionTimeout) {
        clearTimeout(lastQuestionTimeout);
        lastQuestionTimeout = null;
    }

    playSound(correctSound);

    // 画面の明るさを戻す
    document.body.classList.remove('gauge-depleted');

    // コンボゲージが残っているかチェック
    if (comboGaugeValue > 0) {
        // コンボ継続
        consecutiveCorrect++;
    } else {
        // コンボリセット（1から数え直し）
        consecutiveCorrect = 1;
    }

    // 最大コンボを更新
    if (consecutiveCorrect > maxCombo) {
        maxCombo = consecutiveCorrect;
    }

    correctAnswers++;

    // 得点計算: (10+n)²点
    const totalPoints = Math.pow(10 + consecutiveCorrect, 2);
    score += totalPoints;

    // 解答時間を計算（0.1秒単位）
    const answerTime = ((Date.now() - questionStartTime) / 1000).toFixed(1);

    questionHistory.push({
        question: currentQuestion.original,
        answer: currentQuestion.answer,
        correct: true,
        time: answerTime
    });

    document.getElementById('score').textContent = score;

    // コンボ表示
    showComboAnimation(consecutiveCorrect);

    // 10コンボごとの紙吹雪演出
    if (consecutiveCorrect % 10 === 0 && consecutiveCorrect > 0) {
        triggerConfetti();
    }

    // 5問連続正解の演出
    if (consecutiveCorrect % 5 === 0 && consecutiveCorrect > 0) {
        triggerCelebration();
    }

    document.querySelectorAll('.answer-btn.selected').forEach(btn => {
        btn.classList.add('correct');
    });

    // ゲージを停止（次の問題が表示されるまで待つ）
    stopComboGauge();

    // 最終問題は1秒待ってから結果画面へ、それ以外はすぐに次の問題へ
    if (isLastQuestion) {
        setTrackedTimeout(() => {
            endGame();
        }, 1000);
    } else {
        generateQuestion();
    }
}

function showComboAnimation(comboCount) {
    const comboDisplay = document.getElementById('comboDisplay');
    if (comboCount >= 1) {
        // 得点計算: (10+n)²点
        const totalPoints = Math.pow(10 + comboCount, 2);

        // 10コンボごとにクラッカー絵文字を追加
        const celebration = (comboCount % 10 === 0 && comboCount > 0) ? '🎉 ' : '';

        if (comboCount === 1) {
            comboDisplay.innerHTML = `<span>正解!</span><br><span style="font-size: 0.7em; color: #10b981;">+${totalPoints}点</span>`;
        } else {
            comboDisplay.innerHTML = `<span>${celebration}${comboCount}Combo!</span><br><span style="font-size: 0.7em; color: #10b981;">+${totalPoints}点</span>`;
        }
        comboDisplay.classList.add('show');

        setTrackedTimeout(() => {
            comboDisplay.classList.remove('show');
        }, 1000);
    }
}

function wrongAnswer() {
    // すでに回答済みの場合は処理しない（複数回カウントを防止）
    if (answeredCurrentQuestion) {
        return;
    }
    answeredCurrentQuestion = true;

    // 練習モードは問題を変えずに、正解するまで選び直せる
    if (isPracticeMode) {
        practiceWrongAnswer();
        return;
    }

    // ヘルプボタンを非表示にし、タイマーをクリア
    hideHelpButton();

    // 最終問題のタイムアウトをクリア
    if (lastQuestionTimeout) {
        clearTimeout(lastQuestionTimeout);
        lastQuestionTimeout = null;
    }

    playSound(wrongSound);
    score = Math.max(0, score - 200);  // -200点
    consecutiveCorrect = 0;  // コンボリセット
    wrongAnswers++;

    // 解答時間を計算（0.1秒単位）
    const answerTime = ((Date.now() - questionStartTime) / 1000).toFixed(1);

    questionHistory.push({
        question: currentQuestion.original,
        answer: currentQuestion.answer,
        correct: false,
        time: answerTime
    });

    document.getElementById('score').textContent = score;

    // コンボ表示をクリア
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.textContent = '';
    comboDisplay.classList.remove('show');

    // コンボゲージを停止
    stopComboGauge();

    // 画面の明るさを戻す
    document.body.classList.remove('gauge-depleted');

    document.querySelectorAll('.answer-btn.selected').forEach(btn => {
        btn.classList.add('wrong');
    });

    setTrackedTimeout(() => {
        if (isLastQuestion) {
            endGame();
        } else {
            document.querySelectorAll('.answer-btn').forEach(btn => {
                btn.classList.remove('selected', 'wrong');
            });
            selectedAnswers = [];
            // 次の問題を生成（ゲージは1コンボ目なので非表示）
            generateQuestion();
        }
    }, 1000);
}

function endGame() {
    // すべてのタイムアウトをクリア
    clearAllTimeouts();

    // タイマーをクリア
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // カウントダウンオーバーレイを確実に非表示にする
    const overlay = document.getElementById('countdownOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // カウントダウンフラグをリセット
    isCountdownRunning = false;

    // コンボゲージを停止
    stopComboGauge();
    showComboGauge(false);

    // 画面の明るさとエフェクトをリセット
    document.body.classList.remove('gauge-depleted');
    document.body.classList.remove('celebration');

    // ゲーム終了時のジングルを再生
    playSound(gameOverJingle);

    const newHighScore = updateHighScore(gameMode, timeMode, difficultyMode, score);

    // 段位を計算して表示
    const rank = calculateRank(correctAnswers, wrongAnswers, maxCombo);
    const modeName = getModeName();
    const difficultyName = difficultyMode === 'hard' ? 'ハード' : '';
    const plusMark = timeMode === 180 ? '＋' : '';
    document.getElementById('rankDisplay').textContent = `${modeName}${difficultyName} ${rank}${plusMark}`;

    // 段位カードの色を設定
    const rankCard = document.getElementById('rankCard');
    const rankLabel = document.getElementById('rankLabel');
    if (difficultyMode === 'hard') {
        // ハードモード: 赤系グラデーション
        rankCard.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 50%, #ef4444 100%)';
        rankCard.style.borderColor = '#dc2626';
        rankCard.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
        rankLabel.style.color = '#7f1d1d';
        document.getElementById('rankDisplay').style.color = '#7f1d1d';
    } else {
        // ノーマルモード: 黄色系グラデーション（デフォルト）
        rankCard.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fbbf24 100%)';
        rankCard.style.borderColor = '#f59e0b';
        rankCard.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
        rankLabel.style.color = '#92400e';
        document.getElementById('rankDisplay').style.color = '#78350f';
    }

    document.getElementById('correctCount').textContent = correctAnswers;
    document.getElementById('wrongCount').textContent = wrongAnswers;
    document.getElementById('maxComboCount').textContent = maxCombo;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('highScore').textContent = newHighScore;

    // 正解した問題の平均解答時間を計算
    const correctItems = questionHistory.filter(item => item.correct);
    const historyTitle = document.getElementById('historyTitle');
    if (correctItems.length > 0) {
        const totalTime = correctItems.reduce((sum, item) => sum + parseFloat(item.time), 0);
        const averageTime = (totalTime / correctItems.length).toFixed(2);
        historyTitle.innerHTML = `<span class="history-title-center">問題履歴</span><span class="history-title-right">平均　${averageTime}秒</span>`;
    } else {
        historyTitle.innerHTML = '<span class="history-title-center">問題履歴</span>';
    }

    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    questionHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = `history-item ${item.correct ? 'correct' : 'wrong'}`;
        const text = `${item.question} = ${item.answer}`;

        // 問題内容と解答時間を分けて表示
        const contentSpan = document.createElement('span');
        contentSpan.className = 'history-item-content';
        contentSpan.innerHTML = formatTextWithSquareRoot(formatMathText(text));

        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-item-time';
        timeSpan.textContent = `${item.time}秒`;

        div.appendChild(contentSpan);
        div.appendChild(timeSpan);
        historyList.appendChild(div);
    });

    showScreen('resultScreen');
}

function retryGame() {
    clearAllTimeouts();
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // カウントダウンオーバーレイを確実に非表示にする
    const overlay = document.getElementById('countdownOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // カウントダウンフラグをリセット
    isCountdownRunning = false;

    startGame(gameMode);
}

function goToTitle() {
    clearAllTimeouts();
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    // カウントダウンオーバーレイを確実に非表示にする
    const overlay = document.getElementById('countdownOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // カウントダウンフラグをリセット
    isCountdownRunning = false;

    stopComboGauge();
    showComboGauge(false);
    hidePracticeControls();
    document.body.classList.remove('practice-mode');
    // 画面の明るさとエフェクトをリセット
    document.body.classList.remove('gauge-depleted');
    document.body.classList.remove('celebration');
    showScreen('titleScreen');
}

// 5問連続正解の演出
function triggerCelebration() {
    document.body.classList.add('celebration');

    // 1.5秒後に演出を終了
    setTrackedTimeout(() => {
        document.body.classList.remove('celebration');
    }, 1500);
}

// 紙吹雪の演出（10コンボごと）
function triggerConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    const confettiCount = 50;

    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');

        // 左右どちらから発射するかをランダムに決定
        const fromLeft = i < confettiCount / 2;
        confetti.className = fromLeft ? 'confetti from-left' : 'confetti from-right';

        // ランダムな色
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];

        // 開始位置を左中央または右中央に設定
        if (fromLeft) {
            // 左中央から（left: 0-5%, top: 40-60%）
            confetti.style.left = Math.random() * 5 + '%';
            confetti.style.top = (40 + Math.random() * 20) + '%';
        } else {
            // 右中央から（left: 95-100%, top: 40-60%）
            confetti.style.left = (95 + Math.random() * 5) + '%';
            confetti.style.top = (40 + Math.random() * 20) + '%';
        }

        // ランダムなサイズ
        const size = Math.random() * 8 + 6;
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';

        // ランダムな遅延
        confetti.style.animationDelay = Math.random() * 0.15 + 's';

        // ランダムな形（四角または円）
        if (Math.random() > 0.5) {
            confetti.style.borderRadius = '50%';
        }

        container.appendChild(confetti);
    }

    // 1秒後にコンテナごと削除
    setTrackedTimeout(() => {
        document.body.removeChild(container);
    }, 1200);
}
