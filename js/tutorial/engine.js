// チュートリアルの進行管理（講座選択・レッスン一覧・STEPの移動・進捗保存）
(function () {
    const Tutorial = window.Tutorial = window.Tutorial || {};
    const { rich, renderAnimationFrame } = Tutorial.render;
    const { renderProblem } = Tutorial.interactions;

    const STEP_NAMES = ['考え方を知ろう', '動きを見て理解しよう', '自分で解いてみよう', 'レッスン完了'];
    // 「？」解説のモード → 講座ID
    const HELP_TO_COURSE = { expand: 'expansion', factorize: 'factorization', squareRoot: 'square-root' };

    let progress = null;
    // 学習中のレッスン
    const session = { course: null, lesson: null, lessonIndex: 0, positions: [], pos: 0, solved: new Set(), reviewing: false };

    function getCourses() {
        return (window.TutorialCourses || []).slice().sort((a, b) => a.order - b.order);
    }

    function getProgress() {
        if (!progress) progress = loadTutorialProgress();
        return progress;
    }

    function persist() {
        progress.updatedAt = new Date().toISOString();
        saveTutorialProgress(progress);
    }

    function findLesson(lessonId) {
        for (const course of getCourses()) {
            const index = course.lessons.findIndex(l => l.id === lessonId);
            if (index !== -1) return { course, lesson: course.lessons[index], index };
        }
        return null;
    }

    function isDone(lessonId) {
        return getProgress().lessons[lessonId] === true;
    }

    function countDone(course) {
        return course.lessons.filter(l => isDone(l.id)).length;
    }

    // レッスン内の位置（STEP 1 の各ページ → STEP 2 の各コマ → STEP 3 の各問題 → 完了）
    function buildPositions(lesson) {
        const list = [];
        lesson.learn.forEach((page, index) => list.push({ step: 1, kind: 'learn', index }));
        lesson.animation.frames.forEach((frame, index) => list.push({ step: 2, kind: 'frame', index }));
        lesson.problems.forEach((problem, index) => list.push({ step: 3, kind: 'problem', index }));
        list.push({ step: 4, kind: 'complete', index: 0 });
        return list;
    }

    function scrollTop(id) {
        const el = document.getElementById(id);
        if (el) el.scrollTop = 0;
    }

    function progressBar(done, total) {
        const percent = total ? Math.round((done / total) * 100) : 0;
        return `
            <div class="tu-progress">
                <div class="tu-progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}"><span style="width: ${percent}%"></span></div>
                <span class="tu-progress-text">完了 ${done} / ${total}</span>
            </div>`;
    }

    // ===== 講座選択 =====
    function openCourses() {
        const p = getProgress();
        const last = p.lastLesson ? findLesson(p.lastLesson) : null;
        let resume = '';
        if (last && !isDone(last.lesson.id)) {
            resume = `
                <div class="tu-resume tu-theme-${last.course.theme}">
                    <div class="tu-resume-text">前回の続き：${last.course.title} LESSON ${last.index + 1}「${last.lesson.title}」${p.lastStep ? `（STEP ${p.lastStep}）` : ''}</div>
                    <button class="tu-btn tu-btn-primary" onclick="Tutorial.startLesson('${last.lesson.id}', true)">続きから学ぶ</button>
                </div>`;
        }
        document.getElementById('tutorialCoursesContent').innerHTML = `
            <p class="tu-lead">学びたい分野を選ぼう。どのレッスンからでも始められるよ。</p>
            ${resume}
            <div class="tu-course-list">
                ${getCourses().map(course => `
                    <div class="tu-course-card tu-theme-${course.theme}">
                        <div class="tu-course-head">
                            <span class="tu-course-icon" aria-hidden="true">${course.icon}</span>
                            <h2 class="tu-course-title">${course.title}</h2>
                        </div>
                        <p class="tu-course-desc">${rich(course.description)}</p>
                        <div class="tu-course-meta">全${course.lessons.length}レッスン</div>
                        ${progressBar(countDone(course), course.lessons.length)}
                        <button class="tu-btn tu-btn-primary tu-course-btn" onclick="Tutorial.openCourse('${course.id}')">学習する</button>
                    </div>`).join('')}
            </div>`;
        showScreen('tutorialCoursesScreen');
        scrollTop('tutorialCoursesScreen');
    }

    // ===== レッスン一覧 =====
    function openCourse(courseId) {
        const course = getCourses().find(c => c.id === courseId);
        if (!course) {
            openCourses();
            return;
        }
        const p = getProgress();
        document.getElementById('tutorialLessonsTitle').textContent = course.title;
        document.getElementById('tutorialLessonsContent').innerHTML = `
            <div class="tu-lessons-head tu-theme-${course.theme}">
                <p class="tu-course-desc">${rich(course.description)}</p>
                ${progressBar(countDone(course), course.lessons.length)}
            </div>
            <ol class="tu-lesson-list">
                ${course.lessons.map((lesson, i) => {
                    const done = isDone(lesson.id);
                    const inProgress = !done && p.lastLesson === lesson.id && p.lastStep;
                    let status = '<span class="tu-status">未完了</span>';
                    if (done) status = '<span class="tu-status tu-status-done">✅ 完了</span>';
                    else if (inProgress) status = `<span class="tu-status tu-status-doing">学習中（STEP ${p.lastStep}）</span>`;
                    let buttons = `<button class="tu-btn tu-btn-primary" onclick="Tutorial.startLesson('${lesson.id}')">${done ? '復習する' : '始める'}</button>`;
                    if (inProgress) {
                        buttons = `<button class="tu-btn tu-btn-primary" onclick="Tutorial.startLesson('${lesson.id}', true)">続きから</button>
                                   <button class="tu-btn tu-btn-sub" onclick="Tutorial.startLesson('${lesson.id}')">最初から</button>`;
                    }
                    return `
                        <li class="tu-lesson-item tu-theme-${course.theme} ${done ? 'is-done' : ''}">
                            <div class="tu-lesson-num">LESSON ${i + 1}</div>
                            <div class="tu-lesson-info">
                                <div class="tu-lesson-title">${lesson.title}</div>
                                <div class="tu-lesson-goal">${rich(lesson.goal)}</div>
                                ${status}
                            </div>
                            <div class="tu-lesson-actions">${buttons}</div>
                        </li>`;
                }).join('')}
            </ol>`;
        showScreen('tutorialLessonsScreen');
        scrollTop('tutorialLessonsScreen');
    }

    // ===== レッスン =====
    function startLesson(lessonId, resume) {
        const found = findLesson(lessonId);
        if (!found) return;
        const p = getProgress();
        session.course = found.course;
        session.lesson = found.lesson;
        session.lessonIndex = found.index;
        session.positions = buildPositions(found.lesson);
        session.solved = new Set();
        session.reviewing = isDone(lessonId);
        session.pos = 0;
        if (resume && p.lastLesson === lessonId && p.lastStep) {
            const first = session.positions.findIndex(x => x.step === p.lastStep);
            // 完了画面からは再開しない（問題に答えないと完了できないため STEP 3 の最初に戻す）
            if (first !== -1 && p.lastStep < 4) session.pos = first;
        }
        showScreen('tutorialLessonScreen');
        renderPosition(false);
    }

    function current() {
        return session.positions[session.pos];
    }

    function canGoNext() {
        const at = current();
        if (!at || at.kind === 'complete') return false;
        if (at.kind === 'problem') return session.solved.has(at.index) || session.reviewing;
        return true;
    }

    function next() {
        if (!canGoNext()) return;
        session.pos++;
        renderPosition(true);
    }

    function back() {
        if (session.pos === 0) return;
        session.pos--;
        renderPosition(false);
    }

    function goToStep(step, forward) {
        const index = session.positions.findIndex(x => x.step === step);
        if (index === -1) return;
        session.pos = index;
        renderPosition(!!forward);
    }

    function renderPosition(forward) {
        const { course, lesson, lessonIndex } = session;
        const at = current();
        const content = document.getElementById('tutorialLessonContent');
        const screen = document.getElementById('tutorialLessonScreen');
        screen.className = `screen tu-screen active tu-theme-${course.theme}`;

        document.getElementById('tutorialLessonHeading').innerHTML =
            `<span class="tu-heading-course">${course.title}</span><span class="tu-heading-lesson">LESSON ${lessonIndex + 1}　${lesson.title}</span>`;
        renderStepBar(at);

        if (at.kind === 'learn') {
            renderLearnPage(content, lesson.learn[at.index], at.index, lesson.learn.length);
        } else if (at.kind === 'frame') {
            let prevFrame = null;
            if (forward) prevFrame = at.index === 0 ? { lines: [] } : lesson.animation.frames[at.index - 1];
            renderAnimationFrame(content, lesson.animation, at.index, prevFrame);
            const replay = content.querySelector('[data-action="replay"]');
            if (replay) replay.addEventListener('click', () => goToStep(2, true));
        } else if (at.kind === 'problem') {
            content.innerHTML = `<div class="tu-section-label">ミニ問題 ${at.index + 1} / ${lesson.problems.length}</div><div class="tu-problem-slot"></div>`;
            renderProblem(content.querySelector('.tu-problem-slot'), lesson.problems[at.index], {
                solved: session.solved.has(at.index),
                onSolved: () => {
                    session.solved.add(at.index);
                    renderNavBar();
                },
                onReview: () => goToStep(1, false),
            });
        } else {
            completeLesson(content);
        }
        Tutorial.render.fitFormulas(content);

        // 再開用に現在のSTEPを保存
        const p = getProgress();
        p.lastLesson = lesson.id;
        p.lastStep = at.step;
        persist();

        renderNavBar();
        scrollTop('tutorialLessonScroll');
    }

    function renderStepBar(at) {
        const total = session.positions.length;
        const percent = Math.round((session.pos / (total - 1)) * 100);
        document.getElementById('tutorialStepBar').innerHTML = `
            <ol class="tu-steps">
                ${STEP_NAMES.map((name, i) => {
                    const step = i + 1;
                    const cls = step === at.step ? 'is-current' : (step < at.step ? 'is-past' : '');
                    return `<li class="tu-step ${cls}"${step === at.step ? ' aria-current="step"' : ''}><span class="tu-step-num">${step < at.step ? '✓' : step}</span><span class="tu-step-name">${name}</span></li>`;
                }).join('')}
            </ol>
            <div class="tu-step-progress"><span style="width: ${percent}%"></span></div>`;
    }

    function renderLearnPage(content, page, index, count) {
        const paragraphs = (page.text || []).map(t => `<p>${rich(t)}</p>`).join('');
        const math = page.math ? `<div class="tu-learn-math">${Tutorial.render.renderLines(page.math)}</div>` : '';
        const after = (page.after || []).map(t => `<p>${rich(t)}</p>`).join('');
        const point = page.point ? `<div class="tu-point"><span class="tu-point-label">ポイント</span>${rich(page.point)}</div>` : '';
        content.innerHTML = `
            <div class="tu-section-label">STEP 1　考え方を知ろう（${index + 1} / ${count}）</div>
            <div class="tu-card tu-learn">
                <h2 class="tu-learn-heading">${rich(page.heading)}</h2>
                ${paragraphs}${math}${after}${point}
            </div>`;
    }

    function completeLesson(content) {
        const { course, lesson, lessonIndex } = session;
        const p = getProgress();
        p.lessons[lesson.id] = true;
        session.reviewing = true;
        if (typeof playSound === 'function' && typeof gameOverJingle !== 'undefined') playSound(gameOverJingle);

        const nextLesson = course.lessons[lessonIndex + 1];
        content.innerHTML = `
            <div class="tu-card tu-complete">
                <div class="tu-complete-icon" aria-hidden="true">🎉</div>
                <h2 class="tu-complete-title">クリア！</h2>
                <p class="tu-complete-message">${rich(lesson.clearMessage)}</p>
                ${progressBar(countDone(course), course.lessons.length)}
                <div class="tu-complete-actions">
                    ${nextLesson ? `<button class="tu-btn tu-btn-primary" onclick="Tutorial.startLesson('${nextLesson.id}')">次のレッスンへ →</button>` : ''}
                    <button class="tu-btn tu-btn-sub" onclick="Tutorial.startLesson('${lesson.id}')">もう一度復習する</button>
                    <button class="tu-btn tu-btn-sub" onclick="Tutorial.openCourse('${course.id}')">講座一覧へ戻る</button>
                </div>
            </div>`;
    }

    function renderNavBar() {
        const at = current();
        const nav = document.getElementById('tutorialNavBar');
        if (at.kind === 'complete') {
            nav.innerHTML = `<button class="tu-btn tu-btn-sub tu-nav-back" onclick="Tutorial.back()">← 戻る</button><span></span>`;
            return;
        }
        let label = '次へ →';
        if (at.kind === 'problem' && !canGoNext()) label = '正解すると進めるよ';
        else if (at.kind === 'problem' && !session.solved.has(at.index)) label = 'スキップ →';
        else if (at.kind === 'problem' && at.index === session.lesson.problems.length - 1) label = 'クリア！ →';
        nav.innerHTML = `
            <button class="tu-btn tu-btn-sub tu-nav-back" onclick="Tutorial.back()" ${session.pos === 0 ? 'disabled' : ''}>← 戻る</button>
            <span class="tu-nav-count">${session.pos + 1} / ${session.positions.length}</span>
            <button class="tu-btn tu-btn-primary tu-nav-next" onclick="Tutorial.next()" ${canGoNext() ? '' : 'disabled'}>${label}</button>`;
    }

    // ===== 画面移動 =====
    function goTitle() {
        showScreen('titleScreen');
    }

    function backToLessons() {
        if (session.course) openCourse(session.course.id);
        else openCourses();
    }

    function openFromHelp() {
        const courseId = typeof currentHelpMode !== 'undefined' ? HELP_TO_COURSE[currentHelpMode] : null;
        if (courseId) openCourse(courseId);
        else openCourses();
    }

    // PCでは ← → キーでも移動できる
    document.addEventListener('keydown', (event) => {
        const screen = document.getElementById('tutorialLessonScreen');
        if (!screen || !screen.classList.contains('active')) return;
        if (event.key === 'ArrowRight') next();
        if (event.key === 'ArrowLeft') back();
    });

    Object.assign(Tutorial, {
        openCourses, openCourse, startLesson, next, back, goTitle, backToLessons, openFromHelp,
        getCourses, findLesson,
        getSession: () => session,
        reloadProgress: () => { progress = null; return getProgress(); },
    });
})();
