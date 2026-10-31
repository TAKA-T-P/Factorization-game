// チュートリアルの画面・操作・進捗保存のテスト
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('../helpers/load-app');

const KEY = 'factorizationFight.tutorial.v1';
const active = (window, id) => window.document.getElementById(id).classList.contains('active');
const content = window => window.document.getElementById('tutorialLessonContent');
const nextButton = window => window.document.querySelector('#tutorialNavBar .tu-nav-next');
const session = window => window.Tutorial.getSession();
const currentPosition = window => { const s = session(window); return s.positions[s.pos]; };
const storageCopy = window => Object.fromEntries(Object.keys(window.localStorage).map(k => [k, window.localStorage.getItem(k)]));

function clickByText(root, selector, text) {
    const el = Array.from(root.querySelectorAll(selector)).find(e => e.textContent.includes(text));
    assert.ok(el, `「${text}」のボタンがない`);
    el.click();
    return el;
}

function feedback(window) {
    const el = content(window).querySelector('.tu-feedback');
    return { ok: el.classList.contains('tu-feedback-ok'), ng: el.classList.contains('tu-feedback-ng'), text: el.textContent };
}

// 表示中のミニ問題を解く。wrongFirst なら先に1回まちがえて、ヒントが出ることも確かめる
function solveProblem(window, problem, wrongFirst, where = '') {
    const { render } = window.Tutorial;
    const box = content(window).querySelector('.tu-problem');
    const plain = html => { const d = window.document.createElement('div'); d.innerHTML = html; return d.textContent; };

    if (problem.type === 'choice' || problem.type === 'step') {
        const buttons = Array.from(box.querySelectorAll('.tu-option'));
        const html = o => (o.text !== undefined ? render.rich(o.text) : `<span class="tu-math">${render.formula(o.label)}</span>`);
        const find = o => { const b = buttons.find(x => x.innerHTML === html(o)); assert.ok(b, `選択肢 ${o.label || o.text}`); return b; };
        const check = () => box.querySelector('[data-action="check"]').click();
        if (wrongFirst) {
            const wrong = problem.options.find(o => !o.correct);
            find(wrong).click();
            if (problem.multiple) check();
            assert.ok(feedback(window).ng, '不正解のフィードバック');
            assert.ok(feedback(window).text.includes(plain(render.rich(wrong.hint))), 'その選択肢専用のヒント');
            assert.ok(!feedback(window).text.includes('正解！'));
            assert.ok(nextButton(window).disabled, '正解するまで次へ進めない');
            if (problem.multiple) find(wrong).click(); // 選択を外す
        }
        problem.options.filter(o => o.correct).forEach(o => find(o).click());
        if (problem.multiple) check();
    } else if (problem.type === 'pair') {
        const buttons = Array.from(box.querySelectorAll('.tu-number'));
        const index = n => problem.numbers.indexOf(n);
        if (wrongFirst) {
            const [a] = problem.answer;
            const other = problem.numbers.find(n => n !== a && !(a + n === problem.sum && a * n === problem.product));
            buttons[index(a)].click();
            buttons[index(other)].click();
            assert.ok(feedback(window).ng, '不正解のフィードバック');
            assert.ok(/合っているよ|足すと/.test(feedback(window).text), '足し算・かけ算のどちらが違うかを説明する');
            assert.ok(nextButton(window).disabled);
            // 選んだ数をもう一度押すと選択が外れる
            buttons[index(other)].click();
            buttons[index(a)].click();
            assert.equal(box.querySelectorAll('.tu-number.tu-selected').length, 0);
        }
        problem.answer.forEach(n => buttons[index(n)].click());
    } else if (problem.type === 'fill') {
        const rows = Array.from(box.querySelectorAll('[data-row]'));
        const pick = (n, value) => rows[n].querySelectorAll('.tu-option')[problem.blanks[n].options.indexOf(value)].click();
        const check = () => { const c = box.querySelector('[data-action="check"]'); if (c) c.click(); };
        if (wrongFirst) {
            const wrong = problem.blanks[0].options.find(o => o !== problem.blanks[0].answer);
            pick(0, wrong);
            problem.blanks.slice(1).forEach((b, k) => pick(k + 1, b.answer));
            check();
            assert.ok(feedback(window).ng, '不正解のフィードバック');
            const hint = (problem.blanks[0].hints || {})[wrong] || problem.blanks[0].hint;
            assert.ok(feedback(window).text.includes(plain(render.rich(hint))), '選んだ数に合わせたヒント');
            assert.ok(nextButton(window).disabled);
        }
        problem.blanks.forEach((b, n) => pick(n, b.answer));
        check();
    }
    assert.ok(feedback(window).ok, `${where} 正解のフィードバック: ${feedback(window).text}`);
    assert.ok(!nextButton(window).disabled, `${where} 正解したら次へ進める`);
}

// レッスンを最初から最後まで進める
function playLesson(window, lessonId, wrongFirst = true) {
    window.Tutorial.startLesson(lessonId);
    const { lesson } = window.Tutorial.findLesson(lessonId);
    for (let guard = 0; guard < 100; guard++) {
        const at = currentPosition(window);
        const heading = window.document.getElementById('tutorialLessonHeading').textContent;
        assert.ok(heading.includes(lesson.title), '上部にレッスン名');
        assert.ok(window.document.querySelector('.tu-step.is-current').textContent.includes(String(at.step)), 'STEP表示');
        if (at.kind === 'complete') return;
        if (at.kind === 'problem') solveProblem(window, lesson.problems[at.index], wrongFirst, `${lessonId} 問${at.index + 1}`);
        nextButton(window).click();
    }
    assert.fail('レッスンが終わらない');
}

test('タイトルの入口から講座選択・レッスン一覧へ進める', async () => {
    const window = await loadApp();
    const { document } = window;
    const entry = document.getElementById('tutorialEntryBtn');
    assert.ok(entry.textContent.includes('📘 はじめての因数×展開講座'));
    entry.click();
    assert.ok(active(window, 'tutorialCoursesScreen'));
    const cards = document.querySelectorAll('.tu-course-card');
    assert.equal(cards.length, 3);
    ['展開マスター講座', '因数分解マスター講座', '平方根マスター講座'].forEach((t, i) => {
        assert.ok(cards[i].textContent.includes(t));
        assert.ok(cards[i].textContent.includes('全5レッスン'));
        assert.ok(cards[i].textContent.includes('完了 0 / 5'));
    });
    clickByText(cards[1], 'button', '学習する');
    assert.ok(active(window, 'tutorialLessonsScreen'));
    const items = document.querySelectorAll('.tu-lesson-item');
    assert.equal(items.length, 5);
    items.forEach((item, i) => {
        assert.ok(item.textContent.includes(`LESSON ${i + 1}`));
        assert.ok(item.textContent.includes('未完了'));
        assert.ok(item.textContent.includes('始める'));
    });
    // 前のレッスンを終えていなくても、どのレッスンからでも始められる
    clickByText(items[4], 'button', '始める');
    assert.ok(active(window, 'tutorialLessonScreen'));
    assert.equal(session(window).lesson.id, 'factorization-05');
    clickByText(document.getElementById('tutorialLessonScreen'), '.tu-topbar button', 'レッスン一覧');
    assert.ok(active(window, 'tutorialLessonsScreen'));
    clickByText(document.getElementById('tutorialLessonsScreen'), '.tu-topbar button', '講座一覧');
    clickByText(document.getElementById('tutorialCoursesScreen'), '.tu-topbar button', 'タイトル');
    assert.ok(active(window, 'titleScreen'));
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('全15レッスンを、まちがえながらでも最後まで進めて完了できる', async () => {
    const window = await loadApp({ seed: 4, storage: { highScore_expand_60_normal: '800' } });
    const courses = window.Tutorial.getCourses();
    for (const course of courses) {
        for (const [i, lesson] of course.lessons.entries()) {
            playLesson(window, lesson.id, true);
            const done = content(window).querySelector('.tu-complete');
            assert.ok(done.textContent.includes('クリア！'));
            assert.ok(done.textContent.includes(lesson.clearMessage.replace(/\*\*/g, '').replace(/\$/g, '').slice(0, 6)));
            assert.ok(done.textContent.includes('もう一度復習する'));
            assert.ok(done.textContent.includes('講座一覧へ戻る'));
            const isLast = i === course.lessons.length - 1;
            assert.equal(done.textContent.includes('次のレッスンへ'), !isLast, lesson.id);
            assert.equal(done.textContent.includes('ゲームに挑戦！'), isLast, lesson.id);
            const saved = JSON.parse(window.localStorage.getItem(KEY));
            assert.equal(saved.version, 1);
            assert.equal(saved.lessons[lesson.id], true);
            assert.equal(saved.lastLesson, lesson.id);
            assert.equal(saved.lastStep, 4);
            assert.ok(!Number.isNaN(Date.parse(saved.updatedAt)));
        }
    }
    assert.equal(Object.keys(JSON.parse(window.localStorage.getItem(KEY)).lessons).length, 15);
    // ハイスコアには触れない
    assert.equal(window.localStorage.getItem('highScore_expand_60_normal'), '800');
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('再読み込みしても進捗が残り、完了状態と「復習する」が表示される', async () => {
    const first = await loadApp({ seed: 6 });
    playLesson(first, 'expansion-01');
    playLesson(first, 'expansion-02');
    const storage = storageCopy(first);
    first.close();

    const window = await loadApp({ storage });
    window.Tutorial.openCourses();
    const cards = window.document.querySelectorAll('.tu-course-card');
    assert.ok(cards[0].textContent.includes('完了 2 / 5'));
    assert.ok(cards[1].textContent.includes('完了 0 / 5'));
    window.Tutorial.openCourse('expansion');
    const items = window.document.querySelectorAll('.tu-lesson-item');
    assert.ok(items[0].textContent.includes('✅ 完了') && items[0].textContent.includes('復習する'));
    assert.ok(items[1].textContent.includes('✅ 完了'));
    assert.ok(items[2].textContent.includes('未完了') && items[2].textContent.includes('始める'));
    window.close();
});

test('途中でやめても、次回は同じSTEPから再開できる', async () => {
    const first = await loadApp();
    first.Tutorial.startLesson('factorization-02');
    while (currentPosition(first).step < 2) nextButton(first).click();
    nextButton(first).click(); // STEP 2 の2コマ目
    first.Tutorial.goTitle();
    const storage = storageCopy(first);
    first.close();
    assert.equal(JSON.parse(storage[KEY]).lastStep, 2);

    const window = await loadApp({ storage });
    window.Tutorial.openCourses();
    const resume = window.document.querySelector('.tu-resume');
    assert.ok(resume.textContent.includes('因数分解マスター講座') && resume.textContent.includes('STEP 2'));
    window.Tutorial.openCourse('factorization');
    const item = window.document.querySelectorAll('.tu-lesson-item')[1];
    assert.ok(item.textContent.includes('学習中（STEP 2）'));
    clickByText(item, 'button', '続きから');
    assert.equal(session(window).lesson.id, 'factorization-02');
    assert.deepEqual({ ...currentPosition(window) }, { step: 2, kind: 'frame', index: 0 });
    window.close();
});

test('「戻る」「次へ」「もう一度見る」・キー操作・連打で表示が壊れない', async () => {
    const window = await loadApp();
    window.Tutorial.startLesson('expansion-02');
    const { lesson } = window.Tutorial.findLesson('expansion-02');
    const back = () => window.document.querySelector('#tutorialNavBar .tu-nav-back');
    assert.ok(back().disabled, '最初のページでは戻れない');
    for (let i = 0; i < lesson.learn.length; i++) nextButton(window).click();
    assert.deepEqual({ ...currentPosition(window) }, { step: 2, kind: 'frame', index: 0 });
    back().click();
    assert.deepEqual({ ...currentPosition(window) }, { step: 1, kind: 'learn', index: lesson.learn.length - 1 });

    // キー操作
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    window.document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight' }));
    assert.deepEqual({ ...currentPosition(window) }, { step: 2, kind: 'frame', index: 2 });
    assert.ok(content(window).textContent.includes(`3 / ${lesson.animation.frames.length}`));

    // もう一度見る → アニメーションの最初へ
    content(window).querySelector('[data-action="replay"]').click();
    assert.deepEqual({ ...currentPosition(window) }, { step: 2, kind: 'frame', index: 0 });

    // 問題まで進めて、正解前に連打しても進まない
    for (let i = 0; i < lesson.animation.frames.length; i++) nextButton(window).click();
    assert.equal(currentPosition(window).kind, 'problem');
    for (let i = 0; i < 10; i++) {
        nextButton(window).click();
        window.Tutorial.next();
    }
    assert.deepEqual({ ...currentPosition(window) }, { step: 3, kind: 'problem', index: 0 });
    // 選択肢の連打でも1回だけ正解扱い
    const correct = Array.from(content(window).querySelectorAll('.tu-option')).find(b => b.textContent.trim() === 'x²+5x+4');
    for (let i = 0; i < 5; i++) correct.click();
    assert.equal(content(window).querySelectorAll('.tu-option.tu-correct').length, 1);
    // 解説を見直す → STEP 1 へ
    window.Tutorial.back();
    window.Tutorial.next();
    assert.equal(currentPosition(window).kind, 'problem');
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('不正解のとき「解説を見直す」で STEP 1 に戻れる', async () => {
    const window = await loadApp();
    window.Tutorial.startLesson('square-root-02');
    while (currentPosition(window).kind !== 'problem') nextButton(window).click();
    const wrong = Array.from(content(window).querySelectorAll('.tu-option')).find(b => b.textContent.trim() === '2');
    wrong.click();
    content(window).querySelector('[data-action="review"]').click();
    assert.deepEqual({ ...currentPosition(window) }, { step: 1, kind: 'learn', index: 0 });
    window.close();
});

test('講座の最終レッスンから、ノーマルでゲームを始められる（時間設定は引き継ぐ）', async () => {
    const window = await loadApp({ seed: 9 });
    window.document.getElementById('time180').click();
    window.document.getElementById('difficultyHard').click();
    playLesson(window, 'square-root-05', false);
    clickByText(content(window), 'button', 'ゲームに挑戦！');
    assert.equal(window.run('gameMode'), 'squareRoot');
    assert.equal(window.run('difficultyMode'), 'normal');
    assert.equal(window.run('timeMode'), 180);
    assert.ok(!window.document.body.classList.contains('hard-mode'));
    assert.ok(window.document.getElementById('countdownOverlay').classList.contains('show'));
    window.run('goToTitle()');
    window.close();
});

test('「？」解説の下のリンクから、その分野のレッスン一覧へ移動できる', async () => {
    const window = await loadApp();
    for (const [mode, title] of [['expand', '展開マスター講座'], ['factorize', '因数分解マスター講座'], ['squareRoot', '平方根マスター講座']]) {
        window.run(`showHelp('${mode}')`);
        const link = window.document.querySelector('#helpScreen .tu-help-link button');
        assert.ok(link.textContent.includes('基礎からじっくり学ぶ → チュートリアルへ'));
        link.click();
        assert.ok(active(window, 'tutorialLessonsScreen'));
        assert.equal(window.document.getElementById('tutorialLessonsTitle').textContent, title);
    }
    window.close();
});

test('保存データが壊れていても起動でき、ほかの保存データは消さない', async () => {
    for (const broken of ['{oops', '"text"', 'null', '{"version":2,"lessons":{"expansion-01":true}}', '{"version":1,"lessons":{"expansion-01":"yes","expansion-02":true},"lastStep":9}']) {
        const window = await loadApp({ storage: { [KEY]: broken, highScore_factorize_180_hard: '4321' } });
        window.Tutorial.openCourses();
        assert.ok(active(window, 'tutorialCoursesScreen'));
        const expected = broken.includes('"expansion-02":true') ? 1 : 0;
        assert.ok(window.document.querySelector('.tu-course-card').textContent.includes(`完了 ${expected} / 5`), broken);
        playLesson(window, 'expansion-03', false);
        assert.equal(window.localStorage.getItem('highScore_factorize_180_hard'), '4321');
        assert.equal(JSON.parse(window.localStorage.getItem(KEY)).lessons['expansion-03'], true);
        assert.deepEqual(window.__errors, []);
        window.close();
    }
});

test('保存できない環境でも、進捗保存なしで学習できる', async () => {
    const window = await loadApp({
        setup(w) {
            w.Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };
            w.Storage.prototype.getItem = () => { throw new Error('SecurityError'); };
        },
    });
    window.Tutorial.openCourses();
    playLesson(window, 'factorization-01');
    window.Tutorial.openCourse('factorization');
    assert.ok(window.document.querySelector('.tu-lesson-item').textContent.includes('✅ 完了'), 'その場では完了が反映される');
    assert.deepEqual(window.__errors, []);
    window.close();
});

test('アニメーション：新しい行・項が動き、動きを減らす設定では動かさない', async () => {
    const normal = await loadApp();
    normal.Tutorial.startLesson('expansion-01');
    while (currentPosition(normal).kind !== 'frame') nextButton(normal).click();
    nextButton(normal).click();
    assert.ok(content(normal).querySelector('.tu-line.tu-enter'), '新しい行が現れる');
    assert.ok(content(normal).querySelector('[data-t="r1"].tu-pop'), '新しい項が現れる');
    normal.close();

    const reduced = await loadApp({ reducedMotion: true });
    reduced.Tutorial.startLesson('expansion-01');
    while (currentPosition(reduced).kind !== 'frame') nextButton(reduced).click();
    nextButton(reduced).click();
    assert.equal(content(reduced).querySelectorAll('.tu-enter, .tu-pop').length, 0);
    assert.ok(content(reduced).querySelector('[data-t="r1"]'), '内容はそのまま表示される');
    reduced.close();
});

test('効果音OFFのときはチュートリアルでも音を鳴らさない', async () => {
    const window = await loadApp();
    window.document.getElementById('audioToggleBtn').click();
    const before = window.__soundsPlayed || 0;
    playLesson(window, 'expansion-01');
    assert.equal(window.__soundsPlayed || 0, before);
    window.close();
});

test('数式マークアップの表示：色付きの項・根号・分数・マイナス記号', async () => {
    const window = await loadApp();
    const { formula, rich } = window.Tutorial.render;
    const html = formula('[[2|1*|k]]([[x|2|a]]-3)');
    assert.ok(html.includes('class="tu-term tu-c1 tu-focus" data-t="k"'));
    assert.ok(html.includes('<i class="tu-var">x</i>'));
    assert.ok(html.includes('−3'));
    assert.ok(formula('√{12}').includes('tu-sqrt-body">12<'));
    assert.ok(formula('{{3||√{3}}}').includes('tu-frac-den"><span class="tu-sqrt">'));
    assert.ok(rich('**強調** と $x²$').includes('<strong>強調</strong>'));
    assert.ok(!rich('<script>').includes('<script>'), 'HTML はエスケープする');
    window.close();
});
