// 段位関連の処理

// 段位システム
const ranks = [
    '10級', '9級', '8級', '7級', '6級', '5級', '4級', '3級', '2級', '1級',
    '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段', '皆伝'
];

// モードごとの係数
function getRankCoefficient() {
    if (difficultyMode === 'hard') {
        // ハードモードの係数
        if (gameMode === 'expand') {
            return timeMode === 60 ? 0.95 : 2.75;
        } else if (gameMode === 'factorize') {
            return timeMode === 60 ? 1.1 : 3.2;
        } else { // squareRoot
            return timeMode === 60 ? 1.7 : 4.9;
        }
    } else {
        // ノーマルモードの係数
        if (gameMode === 'expand') {
            return timeMode === 60 ? 1.5 : 4.2;
        } else if (gameMode === 'factorize') {
            return timeMode === 60 ? 1.2 : 3.4;
        } else { // squareRoot
            return timeMode === 60 ? 1.8 : 5.0;
        }
    }
}

// 段位を計算
function calculateRank(correctCount, wrongCount, maxComboCount) {
    const coefficient = getRankCoefficient();
    // n = (最大コンボ数-1) × 0.1、最大値は0.9
    const n = Math.min((maxComboCount - 1) * 0.1, 0.9);
    const netScore = Math.max(0, correctCount - wrongCount + n);
    const rankIndex = Math.floor(netScore / coefficient);
    return ranks[Math.min(rankIndex, ranks.length - 1)];
}

// モード名を取得
function getModeName() {
    if (gameMode === 'expand') return '展開';
    if (gameMode === 'factorize') return '因数分解';
    return '平方根';
}
