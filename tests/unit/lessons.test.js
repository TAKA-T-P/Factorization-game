// 教材データの整合性と数学的な正しさのテスト
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('../helpers/load-app');
const { isEvaluable, equivalent, evaluate } = require('../helpers/math-eval');

let courses;
test.before(async () => {
    const window = await loadApp();
    // JSON を通して jsdom 側のオブジェクトを Node 側の普通のオブジェクトにする
    courses = JSON.parse(JSON.stringify(window.TutorialCourses));
    window.close();
});

const allLessons = () => courses.flatMap(c => c.lessons.map(l => ({ course: c, lesson: l })));
const lineText = line => (typeof line === 'string' ? line : (line.m !== undefined ? line.m : null));
const inlineMath = text => String(text || '').split('$').filter((_, i) => i % 2 === 1);
const isSquare = n => Number.isInteger(Math.sqrt(n));

// 「=」でつながった式が、すべて同じ値か（評価できる部分だけ）
function checkEqualities(text, where) {
    const parts = text.split('=').map(p => p.trim()).filter(p => p !== '');
    const evaluable = parts.filter(isEvaluable);
    for (let k = 1; k < evaluable.length; k++) {
        assert.ok(equivalent(evaluable[0], evaluable[k]), `${where}: 「${evaluable[0]}」と「${evaluable[k]}」が等しくない（${text}）`);
    }
}

// 行のならび：「= …」で始まる行は、直前の式の続きとして等しいか
function checkChain(lines, where) {
    let previous = null;
    for (const line of lines || []) {
        if (typeof line === 'object' && line.arrow !== undefined) continue;
        const text = lineText(line);
        if (text === null) continue;
        checkEqualities(text, where);
        const parts = text.split('=').map(p => p.trim());
        if (parts[0] === '' && previous && isEvaluable(previous)) {
            const first = parts.slice(1).find(p => p !== '' && isEvaluable(p));
            if (first) {
                assert.ok(equivalent(previous, first), `${where}: 前の行の「${previous}」と「${first}」が等しくない`);
            }
        }
        const last = parts.filter(p => p !== '').pop();
        previous = last && isEvaluable(last) ? last : null;
    }
}

// 教材の中の解説文（$…$ の中の数式もチェックする）
function richTexts(lesson) {
    const texts = [lesson.goal, lesson.clearMessage, lesson.animation.title];
    lesson.learn.forEach(p => texts.push(p.heading, p.point, ...(p.text || []), ...(p.after || []),
        ...(p.math || []).map(l => (typeof l === 'object' ? l.note || l.arrow : null))));
    lesson.animation.frames.forEach(f => texts.push(f.caption, ...(f.lines || []).map(l => (typeof l === 'object' ? l.note || l.arrow : null))));
    lesson.problems.forEach(p => {
        texts.push(p.question, p.explain, p.hint, p.hintMissing);
        (p.options || []).forEach(o => texts.push(o.text, o.hint));
        (p.blanks || []).forEach(b => texts.push(b.hint, ...Object.values(b.hints || {})));
    });
    return texts.filter(t => typeof t === 'string');
}

test('3講座・各5レッスン・全15レッスンがある', () => {
    assert.deepEqual(courses.map(c => c.id).sort(), ['expansion', 'factorization', 'square-root']);
    courses.forEach(c => assert.equal(c.lessons.length, 5, c.id));
    const ids = allLessons().map(x => x.lesson.id);
    assert.equal(new Set(ids).size, 15);
    ids.forEach(id => assert.match(id, /^(expansion|factorization|square-root)-0[1-5]$/));
});

test('講座に色・説明が設定されている', () => {
    const themes = { expansion: 'expand', factorization: 'factor', 'square-root': 'root' };
    courses.forEach(c => {
        assert.equal(c.theme, themes[c.id]);
        assert.ok(c.title && c.description && c.icon);
    });
});

test('各レッスンに STEP 1〜3 の内容とクリアメッセージがある', () => {
    allLessons().forEach(({ lesson }) => {
        assert.ok(lesson.title && lesson.goal && lesson.clearMessage, lesson.id);
        assert.ok(lesson.learn.length >= 1, `${lesson.id} learn`);
        lesson.learn.forEach(p => assert.ok(p.heading && (p.text || p.math), `${lesson.id} learn page`));
        assert.ok(lesson.animation.frames.length >= 3, `${lesson.id} frames`);
        lesson.animation.frames.forEach(f => assert.ok(f.lines.length && f.caption, `${lesson.id} frame`));
        assert.ok(lesson.problems.length >= 2 && lesson.problems.length <= 4, `${lesson.id} problems`);
    });
});

test('アニメーションの矢印は、同じコマの中にある項どうしを結んでいる', () => {
    allLessons().forEach(({ lesson }) => {
        lesson.animation.frames.forEach((frame, i) => {
            const ids = new Set();
            frame.lines.forEach(l => (lineText(l) || '').replace(/\[\[(.+?)\]\]/g, (m, inner) => { const id = inner.split('|')[2]; if (id) ids.add(id); return m; }));
            (frame.links || []).forEach(([a, b, color]) => {
                assert.ok(ids.has(a) && ids.has(b), `${lesson.id} コマ${i + 1}: ${a}→${b}`);
                assert.ok(Number.isInteger(color) && color >= 0 && color <= 6);
            });
        });
    });
});

test('解説ページの式はすべて正しい（= の両側が等しい）', () => {
    allLessons().forEach(({ lesson }) => {
        lesson.learn.forEach((page, i) => checkChain(page.math, `${lesson.id} 解説${i + 1}`));
    });
});

test('アニメーションの式はすべて正しい', () => {
    allLessons().forEach(({ lesson }) => {
        const frames = lesson.animation.frames;
        // 途中のコマは作りかけの式があるので1行ごと、最後のコマは行のつながりも確かめる
        frames.forEach((f, i) => f.lines.forEach(l => { const t = lineText(l); if (t) checkEqualities(t, `${lesson.id} コマ${i + 1}`); }));
        checkChain(frames[frames.length - 1].lines, `${lesson.id} 最後のコマ`);
    });
});

test('文章中の数式（$…$）もすべて正しい', () => {
    let checked = 0;
    allLessons().forEach(({ lesson }) => {
        richTexts(lesson).forEach(text => inlineMath(text).forEach(m => {
            if (m.includes('=')) {
                checkEqualities(m, `${lesson.id} 文中「${m}」`);
                checked++;
            }
        }));
    });
    assert.ok(checked > 40, `チェックした式が少なすぎる: ${checked}`);
});

test('選択問題：正解がちょうど1つ（複数選択は1つ以上）で、不正解には必ずヒントがある', () => {
    allLessons().forEach(({ lesson }) => lesson.problems.forEach((p, i) => {
        if (p.type !== 'choice' && p.type !== 'step') return;
        const where = `${lesson.id} 問${i + 1}`;
        const correct = p.options.filter(o => o.correct);
        if (p.multiple) {
            assert.ok(correct.length >= 1, where);
            assert.ok(p.hintMissing, `${where} hintMissing`);
        } else {
            assert.equal(correct.length, 1, where);
        }
        p.options.filter(o => !o.correct).forEach(o => assert.ok(o.hint, `${where} 「${o.label || o.text}」にヒントがない`));
        const labels = p.options.map(o => o.label || o.text);
        assert.equal(new Set(labels).size, labels.length, `${where} 同じ選択肢がある`);
        assert.ok(p.explain, `${where} 正解時の解説`);
        // 式の選択肢には必ず数学的な検証を付ける
        if (p.options.every(o => o.label !== undefined)) assert.ok(p.verify, `${where} に verify がない`);
    }));
});

test('選択問題：正解は問題の式と等しく、不正解の式は等しくない', () => {
    let checked = 0;
    allLessons().forEach(({ lesson }) => lesson.problems.forEach((p, i) => {
        if (!p.verify) return;
        const where = `${lesson.id} 問${i + 1}`;
        const v = p.verify;
        p.options.forEach(o => {
            if (o.label === undefined) return;
            const value = Number(o.label);
            let ok;
            if (v.expr) {
                ok = equivalent(v.expr, o.label);
                if (!o.correct && o.sameValue) {
                    // 値は等しいが「答えの形」として不十分な選択肢
                    assert.ok(ok, `${where} 「${o.label}」は sameValue なのに値が等しくない`);
                    checked++;
                    return;
                }
            } else if (v.squareDivisorsOf) {
                ok = value > 1 && isSquare(value) && v.squareDivisorsOf % value === 0;
            } else if (v.largestSquareDivisorOf) {
                const n = v.largestSquareDivisorOf;
                let largest = 1;
                for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) largest = k * k;
                ok = value === largest;
            } else if (v.perfectSquares) {
                ok = isSquare(value);
            } else if (v.squareTrinomial) {
                ok = false;
                for (let k = -20; k <= 20; k++) if (equivalent(o.label, `(x+(${k}))²`)) ok = true;
            } else if (v.makesIntegerWith) {
                const product = evaluate(`(${o.label})×(${v.makesIntegerWith})`);
                ok = Math.abs(product - Math.round(product)) < 1e-9;
            } else {
                assert.fail(`${where} 不明な verify`);
            }
            assert.equal(!!o.correct, ok, `${where} 「${o.label}」の正誤が数学的に合っていない`);
            checked++;
        });
    }));
    assert.ok(checked > 80, `検証した選択肢が少なすぎる: ${checked}`);
});

test('数の組を選ぶ問題：答えは条件を満たし、条件を満たす組はほかにない', () => {
    let count = 0;
    allLessons().forEach(({ lesson }) => lesson.problems.forEach((p, i) => {
        if (p.type !== 'pair') return;
        count++;
        const where = `${lesson.id} 問${i + 1}`;
        const [a, b] = p.answer;
        assert.equal(a + b, p.sum, where);
        assert.equal(a * b, p.product, where);
        assert.ok(p.numbers.includes(a) && p.numbers.includes(b), where);
        assert.equal(new Set(p.numbers).size, p.numbers.length, `${where} 同じ数がある`);
        const valid = [];
        p.numbers.forEach((m, j) => p.numbers.forEach((n, k) => {
            if (j < k && m + n === p.sum && m * n === p.product) valid.push([m, n]);
        }));
        assert.equal(valid.length, 1, `${where} 正解になる組が ${valid.length} 個`);
        // 結果の式：左辺が x²+(和)x+(積)、右辺がその因数分解
        const [left, right] = p.result.split('=').map(s => s.trim());
        assert.ok(equivalent(left, `x²+(${p.sum})x+(${p.product})`), `${where} 左辺`);
        assert.ok(equivalent(right, `(x+(${a}))(x+(${b}))`), `${where} 右辺`);
    }));
    assert.ok(count >= 4);
});

test('穴埋め問題：正解を入れると等式が成り立ち、ほかの選択肢では成り立たない', () => {
    let count = 0;
    allLessons().forEach(({ lesson }) => lesson.problems.forEach((p, i) => {
        if (p.type !== 'fill') return;
        count++;
        const where = `${lesson.id} 問${i + 1}`;
        assert.ok(p.template.includes('='), where);
        // 符号つきの数（-2 など）は係数としてそのまま入れる。それ以外はかっこで囲む
        const fillIn = (values) => p.template.replace(/\[\?(\d)\]/g, (m, n) => (/^[+\-−]/.test(values[n]) ? values[n] : `(${values[n]})`));
        const answers = p.blanks.map(b => b.answer);
        const [l, r] = fillIn(answers).split('=');
        assert.ok(equivalent(l, r), `${where} 正解を入れても等しくない`);
        p.blanks.forEach((blank, n) => {
            assert.ok(blank.options.includes(blank.answer), `${where} 正解が選択肢にない`);
            assert.equal(new Set(blank.options).size, blank.options.length, `${where} 同じ選択肢がある`);
            Object.keys(blank.hints || {}).forEach(key => assert.ok(blank.options.includes(key), `${where} ヒントの対象「${key}」が選択肢にない`));
            blank.options.filter(o => o !== blank.answer).forEach(o => {
                const values = answers.slice();
                values[n] = o;
                const [l2, r2] = fillIn(values).split('=');
                assert.ok(!equivalent(l2, r2), `${where} 「${o}」を入れても等式が成り立ってしまう`);
                assert.ok((blank.hints && blank.hints[o]) || blank.hint || p.hint, `${where} 「${o}」にヒントがない`);
            });
        });
    }));
    assert.ok(count >= 6);
});

test('ハードモードの出題形式（係数つき・y・共通因数・有理化）を講座で扱っている', () => {
    const text = JSON.stringify(courses);
    ['(2x+3)²', '(2x+3)(2x-3)', '(x+2y)(x+3y)', '2xy(3x-y)', '3x²+6x', '4x²-9', 'x²+5xy+6y²', '{{6||√{2}}}'].forEach(s => {
        assert.ok(text.includes(s), `「${s}」が教材にない`);
    });
});
