// チュートリアルのミニ問題（選択・数の組選び・手順選択・穴埋め）
(function () {
    const Tutorial = window.Tutorial = window.Tutorial || {};
    const { formula, rich } = Tutorial.render;

    const BLANK_LABELS = ['ア', 'イ', 'ウ', 'エ'];

    function sound(name) {
        if (typeof playSound !== 'function') return;
        if (name === 'correct' && typeof correctSound !== 'undefined') playSound(correctSound);
        if (name === 'wrong' && typeof wrongSound !== 'undefined') playSound(wrongSound);
    }

    function shuffled(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    // 負の数はかっこを付けて表示する（2+(−3) など）
    function signed(n, wrap) {
        if (n < 0) return wrap ? `(−${-n})` : `−${-n}`;
        return String(n);
    }

    function optionLabel(option) {
        return option.text !== undefined ? rich(option.text) : `<span class="tu-math">${formula(option.label)}</span>`;
    }

    function mathBlock(math) {
        if (!math) return '';
        const lines = Array.isArray(math) ? math : [math];
        return `<div class="tu-problem-math">${Tutorial.render.renderLines(lines)}</div>`;
    }

    /**
     * ミニ問題を描画する
     * opts.solved    すでに正解済みなら true（正解の状態で表示する）
     * opts.onSolved  正解したときに呼ばれる
     * opts.onReview  「解説を見直す」を押したときに呼ばれる
     */
    function renderProblem(container, problem, opts = {}) {
        const typeLabel = { choice: '選んで答えよう', step: '手順を選ぼう', pair: '2つの数を選ぼう', fill: '□に入る数を選ぼう' }[problem.type] || '';
        container.innerHTML = `
            <div class="tu-card tu-problem tu-problem-${problem.type}">
                <div class="tu-problem-type">${typeLabel}</div>
                <div class="tu-problem-question">${rich(problem.question)}</div>
                ${mathBlock(problem.math)}
                <div class="tu-problem-body"></div>
                <div class="tu-feedback" aria-live="polite"></div>
            </div>`;
        const body = container.querySelector('.tu-problem-body');
        const feedback = container.querySelector('.tu-feedback');
        const state = { solved: false };

        const showWrong = (hintText) => {
            sound('wrong');
            feedback.className = 'tu-feedback tu-feedback-ng';
            feedback.innerHTML = `
                <div class="tu-feedback-title">🤔 おしい！ もう一度考えてみよう</div>
                <div class="tu-feedback-text">${rich(hintText || problem.hint || '')}</div>
                ${opts.onReview ? '<button class="tu-btn tu-btn-sub tu-review-btn" data-action="review">📖 解説を見直す</button>' : ''}`;
            const review = feedback.querySelector('[data-action="review"]');
            if (review) review.addEventListener('click', () => opts.onReview());
        };

        const showCorrect = (silent) => {
            state.solved = true;
            if (!silent) sound('correct');
            container.querySelector('.tu-problem').classList.add('tu-problem-solved');
            body.querySelectorAll('button').forEach(b => { b.disabled = true; });
            feedback.className = 'tu-feedback tu-feedback-ok';
            feedback.innerHTML = `
                <div class="tu-feedback-title">⭕ 正解！</div>
                ${problem.explain ? `<div class="tu-feedback-text">${rich(problem.explain)}</div>` : ''}`;
            if (!silent && opts.onSolved) opts.onSolved();
        };

        const renderer = { choice: renderChoice, step: renderChoice, pair: renderPair, fill: renderFill }[problem.type];
        renderer(body, problem, { state, showWrong, showCorrect, solved: !!opts.solved });
        if (opts.solved) showCorrect(true);
    }

    // ===== A. 選択問題 / C. 手順選択（multiple: true で複数選択） =====
    function renderChoice(body, problem, ctx) {
        const options = problem.shuffle === false || ctx.solved ? problem.options.slice() : shuffled(problem.options);
        const multiple = !!problem.multiple;
        body.innerHTML = `
            ${problem.work ? `<div class="tu-work">${Tutorial.render.renderLines(problem.work)}</div>` : ''}
            <div class="tu-options ${options.length > 4 || problem.compact ? 'tu-options-compact' : ''}">
                ${options.map((o, i) => `<button class="tu-option" data-index="${i}">${optionLabel(o)}</button>`).join('')}
            </div>
            ${multiple ? '<button class="tu-btn tu-btn-primary tu-check-btn" data-action="check" disabled>答え合わせ</button>' : ''}`;
        const buttons = Array.from(body.querySelectorAll('.tu-option'));
        if (ctx.solved) {
            buttons.forEach((b, i) => { if (options[i].correct) b.classList.add('tu-correct'); });
            return;
        }

        if (!multiple) {
            buttons.forEach((button, i) => {
                button.addEventListener('click', () => {
                    if (ctx.state.solved) return;
                    const option = options[i];
                    if (option.correct) {
                        buttons.forEach(b => b.classList.remove('tu-wrong'));
                        button.classList.add('tu-correct');
                        ctx.showCorrect();
                    } else {
                        buttons.forEach(b => b.classList.remove('tu-wrong'));
                        button.classList.add('tu-wrong');
                        ctx.showWrong(option.hint);
                    }
                });
            });
            return;
        }

        const check = body.querySelector('[data-action="check"]');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (ctx.state.solved) return;
                button.classList.toggle('tu-selected');
                button.classList.remove('tu-wrong');
                check.disabled = !buttons.some(b => b.classList.contains('tu-selected'));
            });
        });
        check.addEventListener('click', () => {
            if (ctx.state.solved) return;
            const selected = buttons.map(b => b.classList.contains('tu-selected'));
            const wrongPick = options.findIndex((o, i) => selected[i] && !o.correct);
            const missing = options.some((o, i) => o.correct && !selected[i]);
            if (wrongPick === -1 && !missing) {
                buttons.forEach((b, i) => { if (selected[i]) b.classList.add('tu-correct'); });
                ctx.showCorrect();
                return;
            }
            if (wrongPick !== -1) {
                buttons[wrongPick].classList.add('tu-wrong');
                ctx.showWrong(options[wrongPick].hint);
            } else {
                ctx.showWrong(problem.hintMissing);
            }
        });
    }

    // ===== B. 数の組を選ぶ問題（足して sum、かけて product） =====
    function renderPair(body, problem, ctx) {
        body.innerHTML = `
            <div class="tu-pair-target">
                <span>足して <strong>${signed(problem.sum)}</strong></span>
                <span>かけて <strong>${signed(problem.product)}</strong></span>
            </div>
            <div class="tu-options tu-options-numbers">
                ${problem.numbers.map((n, i) => `<button class="tu-option tu-number" data-index="${i}">${signed(n)}</button>`).join('')}
            </div>
            <div class="tu-pair-calc" aria-live="polite"></div>
            ${problem.result ? '<div class="tu-pair-result"></div>' : ''}`;
        const buttons = Array.from(body.querySelectorAll('.tu-number'));
        const calc = body.querySelector('.tu-pair-calc');
        const resultBox = body.querySelector('.tu-pair-result');
        let picked = [];

        const showCalc = (a, b) => {
            const s = a + b;
            const p = a * b;
            const okS = s === problem.sum;
            const okP = p === problem.product;
            calc.innerHTML = `
                <div class="tu-calc-row ${okS ? 'ok' : 'ng'}"><span class="tu-math">${signed(a)}+${signed(b, true)}=${signed(s)}</span><span class="tu-mark">${okS ? '✓' : '✗'}</span></div>
                <div class="tu-calc-row ${okP ? 'ok' : 'ng'}"><span class="tu-math">${signed(a)}×${signed(b, true)}=${signed(p)}</span><span class="tu-mark">${okP ? '✓' : '✗'}</span></div>`;
            return { s, p, okS, okP };
        };

        if (ctx.solved) {
            const [a, b] = problem.answer;
            buttons.forEach((btn, i) => { if (problem.numbers[i] === a || problem.numbers[i] === b) btn.classList.add('tu-correct'); });
            showCalc(a, b);
            if (resultBox) resultBox.innerHTML = `<span class="tu-math">${formula(problem.result)}</span>`;
            return;
        }

        buttons.forEach((button, i) => {
            button.addEventListener('click', () => {
                if (ctx.state.solved) return;
                if (picked.includes(i)) {
                    picked = picked.filter(x => x !== i);
                } else {
                    if (picked.length === 2) picked = [];
                    picked.push(i);
                }
                buttons.forEach((b, j) => {
                    b.classList.toggle('tu-selected', picked.includes(j));
                    b.classList.remove('tu-wrong');
                });
                if (picked.length < 2) {
                    calc.innerHTML = picked.length ? '<div class="tu-calc-wait">もう1つ選ぼう</div>' : '';
                    return;
                }
                const [a, b] = picked.map(j => problem.numbers[j]);
                const r = showCalc(a, b);
                if (r.okS && r.okP) {
                    picked.forEach(j => buttons[j].classList.add('tu-correct'));
                    if (resultBox) resultBox.innerHTML = `<span class="tu-math">${formula(problem.result)}</span>`;
                    ctx.showCorrect();
                    return;
                }
                picked.forEach(j => buttons[j].classList.add('tu-wrong'));
                ctx.showWrong(pairHint(problem, a, b, r));
            });
        });
    }

    function pairHint(problem, a, b, r) {
        const A = signed(a);
        const B = signed(b, true);
        let text;
        if (r.okP) {
            text = `$${A}×${B}=${signed(r.p)}$ は合っているよ！ でも $${A}+${B}=${signed(r.s)}$ になるね。足し算も $${signed(problem.sum)}$ になる組み合わせを探そう！`;
        } else if (r.okS) {
            text = `$${A}+${B}=${signed(r.s)}$ は合っているよ！ でも $${A}×${B}=${signed(r.p)}$ になるね。かけて $${signed(problem.product)}$ になる組み合わせを探そう！`;
        } else {
            text = `足すと $${signed(r.s)}$、かけると $${signed(r.p)}$ だね。まず、かけて $${signed(problem.product)}$ になる組み合わせを探すと見つけやすいよ！`;
        }
        if (problem.product < 0 && r.p > 0) {
            text += '\nかけてマイナスになるのは、プラスの数とマイナスの数を1つずつ選んだときだよ。';
        } else if (problem.product > 0 && r.p < 0) {
            text += '\nかけてプラスになるのは、2つとも同じ符号（どちらもプラス、またはどちらもマイナス）のときだよ。';
        } else if (problem.product > 0 && problem.sum < 0 && a > 0 && b > 0) {
            text += '\nかけてプラス、足してマイナスになるのは、2つともマイナスの数のときだよ。';
        }
        return text;
    }

    // ===== D. 穴埋め問題 =====
    function renderFill(body, problem, ctx) {
        const blanks = problem.blanks;
        const multi = blanks.length > 1;
        const values = blanks.map(() => null);

        let template = formula(problem.template);
        template = template.replace(/\[\?(\d)\]/g, (m, n) =>
            `<span class="tu-blank" data-blank="${n}">${multi ? `<small>${BLANK_LABELS[n]}</small>` : ''}<span class="tu-blank-value">？</span></span>`);

        body.innerHTML = `
            <div class="tu-fill-template"><span class="tu-math">${template}</span></div>
            ${blanks.map((blank, n) => `
                <div class="tu-fill-row">
                    ${multi ? `<div class="tu-fill-label">${BLANK_LABELS[n]} に入るのは？</div>` : ''}
                    <div class="tu-options tu-options-numbers" data-row="${n}">
                        ${blank.options.map((o, i) => `<button class="tu-option tu-number" data-index="${i}"><span class="tu-math">${formula(o)}</span></button>`).join('')}
                    </div>
                </div>`).join('')}
            ${multi ? '<button class="tu-btn tu-btn-primary tu-check-btn" data-action="check" disabled>答え合わせ</button>' : ''}`;

        const blankEls = Array.from(body.querySelectorAll('.tu-blank'));
        const rows = Array.from(body.querySelectorAll('[data-row]'));
        const check = body.querySelector('[data-action="check"]');

        const setValue = (n, value) => {
            values[n] = value;
            blankEls.filter(el => el.getAttribute('data-blank') === String(n)).forEach(el => {
                el.querySelector('.tu-blank-value').innerHTML = value === null ? '？' : formula(value);
                el.classList.toggle('tu-blank-filled', value !== null);
                el.classList.remove('tu-wrong', 'tu-correct');
            });
        };

        if (ctx.solved) {
            blanks.forEach((blank, n) => {
                setValue(n, blank.answer);
                blankEls.forEach(el => { if (el.getAttribute('data-blank') === String(n)) el.classList.add('tu-correct'); });
                rows[n].querySelectorAll('.tu-option').forEach((b, i) => { if (blank.options[i] === blank.answer) b.classList.add('tu-correct'); });
            });
            return;
        }

        const judge = () => {
            const wrongIndex = blanks.findIndex((blank, n) => values[n] !== blank.answer);
            blanks.forEach((blank, n) => {
                const ok = values[n] === blank.answer;
                blankEls.forEach(el => {
                    if (el.getAttribute('data-blank') === String(n)) {
                        el.classList.toggle('tu-correct', ok);
                        el.classList.toggle('tu-wrong', !ok);
                    }
                });
                rows[n].querySelectorAll('.tu-option').forEach((b, i) => {
                    b.classList.toggle('tu-wrong', !ok && blank.options[i] === values[n]);
                    if (ok && blank.options[i] === values[n]) b.classList.add('tu-correct');
                });
            });
            if (wrongIndex === -1) {
                ctx.showCorrect();
            } else {
                const blank = blanks[wrongIndex];
                const prefix = multi ? `${BLANK_LABELS[wrongIndex]}：` : '';
                ctx.showWrong(prefix + ((blank.hints && blank.hints[values[wrongIndex]]) || blank.hint || problem.hint || ''));
            }
        };

        rows.forEach((row, n) => {
            const buttons = Array.from(row.querySelectorAll('.tu-option'));
            buttons.forEach((button, i) => {
                button.addEventListener('click', () => {
                    if (ctx.state.solved) return;
                    buttons.forEach(b => b.classList.remove('tu-selected', 'tu-wrong', 'tu-correct'));
                    button.classList.add('tu-selected');
                    setValue(n, blanks[n].options[i]);
                    if (multi) {
                        check.disabled = values.some(v => v === null);
                    } else {
                        judge();
                    }
                });
            });
        });
        if (check) check.addEventListener('click', () => { if (!ctx.state.solved) judge(); });
    }

    Tutorial.interactions = { renderProblem, pairHint, signed };
})();
