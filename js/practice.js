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

// 「次へ」
function nextPracticeQuestion() {
    hidePracticeControls();
    generateQuestion();
}

function hidePracticeControls() {
    document.getElementById('practiceControls').classList.remove('show');
    document.getElementById('answerGrid').classList.remove('practice-locked');
    const comboDisplay = document.getElementById('comboDisplay');
    comboDisplay.textContent = '';
    comboDisplay.classList.remove('show');
}
