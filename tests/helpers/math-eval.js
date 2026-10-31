// 数式を数値として評価して、等しいかどうかを調べる（教材と出題の数学的な正しさの検証用）
//
// 対応している書き方：
//   教材マークアップ [[項|色|ID]]・√{…}・{{分子||分母}}
//   + - − × ÷ / · ( ) ² ³ √ と、数・英小文字1文字の変数、かけ算記号の省略（2x, xy, 2√3, (x+1)(x+2)）

function stripMarkup(text) {
    let t = String(text).replace(/\[\[(.+?)\]\]/g, (m, inner) => inner.split('|')[0]);
    let prev;
    do {
        prev = t;
        t = t.replace(/√\{([^{}]*)\}/g, '√($1)');
        t = t.replace(/\{\{(.*?)\|\|(.*?)\}\}/g, '(($1)/($2))');
    } while (t !== prev);
    return t;
}

function normalize(text) {
    return stripMarkup(text)
        .replace(/[−–]/g, '-')
        .replace(/[×·]/g, '*')
        .replace(/÷/g, '/')
        .replace(/\s+/g, '');
}

// 数式として評価できる文字だけでできているか
function isEvaluable(text) {
    const t = normalize(text);
    return t.length > 0 && /^[0-9a-z+\-*/()²³√.]+$/.test(t);
}

function parse(text) {
    const s = normalize(text);
    let i = 0;
    const peek = () => s[i];
    const fail = (msg) => { throw new Error(`${msg} at ${i} in "${s}" (from "${text}")`); };

    function expr() {
        let node = term();
        while (peek() === '+' || peek() === '-') {
            const op = s[i++];
            const right = term();
            const left = node;
            node = op === '+' ? (v) => left(v) + right(v) : (v) => left(v) - right(v);
        }
        return node;
    }

    function startsFactor(c) {
        return c !== undefined && /[0-9a-z(√.]/.test(c);
    }

    function term() {
        let node = unary();
        for (;;) {
            const c = peek();
            let op;
            if (c === '*' || c === '/') {
                op = c;
                i++;
            } else if (startsFactor(c)) {
                op = '*';
            } else {
                break;
            }
            const right = unary();
            const left = node;
            node = op === '*' ? (v) => left(v) * right(v) : (v) => left(v) / right(v);
        }
        return node;
    }

    function unary() {
        if (peek() === '-') {
            i++;
            const inner = unary();
            return (v) => -inner(v);
        }
        if (peek() === '+') {
            i++;
            return unary();
        }
        return power();
    }

    function power() {
        let node = primary();
        while (peek() === '²' || peek() === '³') {
            const n = s[i++] === '²' ? 2 : 3;
            const base = node;
            node = (v) => base(v) ** n;
        }
        return node;
    }

    function primary() {
        const c = peek();
        if (c === undefined) fail('unexpected end');
        if (c === '(') {
            i++;
            const inner = expr();
            if (peek() !== ')') fail('missing )');
            i++;
            return inner;
        }
        if (c === '√') {
            i++;
            const inner = power();
            return (v) => Math.sqrt(inner(v));
        }
        if (/[0-9.]/.test(c)) {
            const m = s.slice(i).match(/^\d+(\.\d+)?/);
            if (!m) fail('bad number');
            i += m[0].length;
            const value = Number(m[0]);
            return () => value;
        }
        if (/[a-z]/.test(c)) {
            i++;
            return (v) => {
                if (!(c in v)) throw new Error(`no value for ${c}`);
                return v[c];
            };
        }
        return fail(`unexpected "${c}"`);
    }

    const node = expr();
    if (i !== s.length) fail('trailing input');
    return node;
}

// 文字に正の値を入れて評価するための値の組（決まった値で再現性を保つ）
const SAMPLE_POINTS = [1.37, 2.11, 0.73, 3.29, 1.91, 2.57].map((base, k) => {
    const v = {};
    'abcdefghijklmnopqrstuvwxyz'.split('').forEach((ch, j) => {
        v[ch] = base + ((j * 0.613 + k * 0.271) % 1.7);
    });
    return v;
});

function evaluate(text, values) {
    return parse(text)(values || SAMPLE_POINTS[0]);
}

function close(a, b) {
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

// 2つの式がどの値でも等しいか（値の組をいくつか試す）
function equivalent(a, b) {
    const fa = parse(a);
    const fb = parse(b);
    return SAMPLE_POINTS.every((v) => {
        const x = fa(v);
        const y = fb(v);
        return Number.isFinite(x) && Number.isFinite(y) && close(x, y);
    });
}

module.exports = { stripMarkup, normalize, isEvaluable, parse, evaluate, equivalent };
