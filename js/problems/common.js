// 問題生成で共通に使う乱数・選択肢・表示用ヘルパー

// 最大公約数を計算（互いに素判定用）
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        const temp = b;
        b = a % b;
        a = temp;
    }
    return a;
}

// -9〜+9の0以外の整数を生成
function getRandomNonZeroSmall() {
    let val;
    do {
        val = Math.floor(Math.random() * 19) - 9; // -9 to 9
    } while (val === 0);
    return val;
}

// 2〜5の整数を生成
function getRandomCoefficient() {
    return Math.floor(Math.random() * 4) + 2; // 2 to 5
}

// 互いに素になるc,dのペアを生成
function getCoprimeCD() {
    let c, d;
    do {
        c = getRandomCoefficient(); // 2〜5
        d = getRandomNonZeroSmall(); // -9〜+9（0除外）
    } while (gcd(c, Math.abs(d)) !== 1);
    return { c, d };
}

// 互いに素になるb,cのペアを生成（共通因数パターン用、1〜9の正整数）
function getCoprimePositivePair() {
    let b, c;
    do {
        b = Math.floor(Math.random() * 9) + 1; // 1〜9
        c = Math.floor(Math.random() * 9) + 1; // 1〜9
    } while (gcd(b, c) !== 1);
    return { b, c };
}

// x²の係数用の選択肢を生成（1桁の正の整数）
function generateX2Choices(correctValue) {
    const choices = new Set([correctValue]);
    // 1桁の正の平方数や小さい数を候補に
    const candidates = [1, 2, 4, 9, 16, 25, 3, 5, 6, 8];
    while (choices.size < 4) {
        const candidate = candidates[Math.floor(Math.random() * candidates.length)];
        if (candidate !== correctValue) {
            choices.add(candidate);
        }
    }
    return choices;
}

// 正の整数の選択肢を生成（共通因数パターン用）
function generatePositiveChoices(correctValue) {
    const choices = new Set([correctValue]);
    while (choices.size < 4) {
        const offset = Math.floor(Math.random() * 20) - 10;
        let candidate = correctValue + offset;
        if (candidate <= 0) candidate = Math.floor(Math.random() * 9) + 1;
        choices.add(candidate);
    }
    return choices;
}

// ダミー選択肢を生成（0を含まない）
function generateDummyChoicesNonZero() {
    const choices = new Set();
    while (choices.size < 4) {
        const val = Math.floor(Math.random() * 19) - 9;
        if (val !== 0) {
            choices.add(val);
        }
    }
    return choices;
}

// 正解を含む4つの選択肢を生成
function generateChoicesForValue(correctValue, isFixed) {
    const choices = new Set([correctValue]);
    if (isFixed) {
        // パターン1のx²係数は固定（1）なので、似た値を生成
        while (choices.size < 4) {
            choices.add(Math.floor(Math.random() * 8) + 1); // 1〜8
        }
    } else {
        while (choices.size < 4) {
            // 正解に近い値を生成
            const offset = Math.floor(Math.random() * 20) - 10;
            let candidate = correctValue + offset;
            if (candidate === 0 && correctValue !== 0) {
                candidate = correctValue > 0 ? 1 : -1;
            }
            choices.add(candidate);
        }
    }
    return choices;
}

function getRandomNonZero() {
    let num;
    do {
        num = Math.floor(Math.random() * 21) - 10;
    } while (num === 0);
    return num;
}

// xを数学的フォントで表示するためのヘルパー関数
function formatMathText(text) {
    return text.replace(/x/g, '<span class="math-x">x</span>')
               .replace(/y/g, '<span class="math-x">y</span>');
}

// √記号を数学用フォントで表示するヘルパー関数
function formatSqrtSymbol(text) {
    return text.replace(/√/g, '<span class="sqrt-symbol">√</span>');
}

// 平方根を適切な形式で表示するヘルパー関数（横棒付き）
function formatSquareRoot(number) {
    return `<span class="sqrt-wrapper"><span class="sqrt-symbol">√</span><span class="sqrt-content">${number}</span></span>`;
}

// テキスト内の√記号を適切な形式に変換する関数
function formatTextWithSquareRoot(text) {
    // 分数形式（例: "9/√3"）を検出して分数表示に変換
    text = text.replace(/(\d+)\/√(\d+)/g, (match, numerator, denominator) => {
        return `<span class="history-fraction"><span class="numerator">${numerator}</span><span class="denominator">${formatSquareRoot(denominator)}</span></span>`;
    });
    // √の後の数字を抽出して適切に表示（分数内で既に処理されたものは除く）
    return text.replace(/√(\d+)/g, (match, number) => formatSquareRoot(number));
}
