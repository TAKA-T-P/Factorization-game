// 検証に使う数式評価器そのもののテスト
const test = require('node:test');
const assert = require('node:assert/strict');
const { equivalent, evaluate, isEvaluable, stripMarkup } = require('../helpers/math-eval');

test('多項式の等しい・等しくないを判定できる', () => {
    assert.ok(equivalent('(x+2)(x+3)', 'x²+5x+6'));
    assert.ok(equivalent('(x−5)(x+5)', 'x²−25'));
    assert.ok(equivalent('(2x+3y)²', '4x²+12xy+9y²'));
    assert.ok(equivalent('2xy(3x-y)', '6x²y-2xy²'));
    assert.ok(!equivalent('(x+2)(x+3)', 'x²+6x+5'));
    assert.ok(!equivalent('(x-3)²', 'x²-9'));
    assert.ok(!equivalent('x²+3x', 'x³+3x'));
});

test('平方根・分数を評価できる', () => {
    assert.ok(equivalent('√12', '2√3'));
    assert.ok(equivalent('√{72}', '6√{2}'));
    assert.ok(equivalent('{{6||√{2}}}', '3√{2}'));
    assert.ok(equivalent('15/√3', '5√3'));
    assert.ok(!equivalent('√{20}', '4√{5}'));
    assert.equal(evaluate('√{9}'), 3);
    assert.equal(evaluate('(-3)²'), 9);
    assert.equal(evaluate('-3²'), -9);
});

test('教材マークアップを取り除ける', () => {
    assert.equal(stripMarkup('[[2|1*|k]]([[x|2|a]]+[[3||b]])'), '2(x+3)');
    assert.equal(stripMarkup('{{[[6|1|a]]||[[√{2}|2*|b]]}}'), '((6)/(√(2)))');
    assert.ok(equivalent('x²[[-ax|3~]][[+ax|3~]]-a²', 'x²-a²'));
});

test('日本語や記号をふくむ式は評価対象外になる', () => {
    assert.ok(!isEvaluable('9の平方根は 3 と -3'));
    assert.ok(!isEvaluable('√{18} = √{□×□}'));
    assert.ok(!isEvaluable('±3'));
    assert.ok(isEvaluable('x²-4²'));
});
