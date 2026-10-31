// 保存データ管理（localStorage）

// ハイスコアの保存キー（既存データとの互換のため形式は変更しない）
function getHighScoreKey(mode, time, difficulty) {
    return `highScore_${mode}_${time}_${difficulty}`;
}

// ハイスコアを読み込む（保存がない・読めない場合は0）
function loadHighScore(mode, time, difficulty) {
    try {
        return parseInt(localStorage.getItem(getHighScoreKey(mode, time, difficulty)) || '0');
    } catch (error) {
        return 0;
    }
}

// 今回のスコアと比較して高い方を保存し、その値を返す
function updateHighScore(mode, time, difficulty, newScore) {
    const newHighScore = Math.max(newScore, loadHighScore(mode, time, difficulty));
    try {
        localStorage.setItem(getHighScoreKey(mode, time, difficulty), newHighScore.toString());
    } catch (error) {
        // 保存できない環境ではハイスコアを記録しない
    }
    return newHighScore;
}

// ===== チュートリアルの学習進捗 =====
// ハイスコアとは別のキーに保存する（既存データには触れない）
const TUTORIAL_PROGRESS_KEY = 'factorizationFight.tutorial.v1';

function createEmptyTutorialProgress() {
    return { version: 1, lessons: {}, lastLesson: null, lastStep: null, updatedAt: null };
}

// 進捗を読み込む（保存がない・壊れている・読めない場合は空の進捗）
function loadTutorialProgress() {
    const progress = createEmptyTutorialProgress();
    let data;
    try {
        data = JSON.parse(localStorage.getItem(TUTORIAL_PROGRESS_KEY));
    } catch (error) {
        return progress;
    }
    if (!data || typeof data !== 'object' || data.version !== 1) {
        return progress;
    }
    if (data.lessons && typeof data.lessons === 'object') {
        Object.keys(data.lessons).forEach(id => {
            if (data.lessons[id] === true) progress.lessons[id] = true;
        });
    }
    if (typeof data.lastLesson === 'string') progress.lastLesson = data.lastLesson;
    if (Number.isInteger(data.lastStep) && data.lastStep >= 1 && data.lastStep <= 4) progress.lastStep = data.lastStep;
    if (typeof data.updatedAt === 'string') progress.updatedAt = data.updatedAt;
    return progress;
}

// 進捗を保存する（保存できない環境では false を返し、学習はそのまま続けられる）
function saveTutorialProgress(progress) {
    try {
        localStorage.setItem(TUTORIAL_PROGRESS_KEY, JSON.stringify(progress));
        return true;
    } catch (error) {
        return false;
    }
}
