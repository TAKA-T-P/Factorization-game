// チュートリアルの表示（数式・解説文・アニメーション）
(function () {
    const Tutorial = window.Tutorial = window.Tutorial || {};

    // 項の色（1〜6）。矢印の先端の色にも使う
    const LINK_COLORS = ['#475569', '#2563eb', '#ea580c', '#059669', '#9333ea', '#db2777', '#0891b2'];

    // 根号の記号。フォントの √ だと横棒とつながらないので、中身の高さに合わせて線で描く
    // （文字の √ は読み上げ・コピー用に見えない形で残す）
    const SQRT_SIGN_SVG = '<svg class="tu-sqrt-svg" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
        + '<path d="M0.6 12.2 L2.6 11 L5.4 19.4 L9.4 0 L10 0"></path></svg>';

    function escapeHtml(text) {
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // 数式マークアップをHTMLにする
    //   [[文字|色|ID]]  色付きの項（色は1〜6。* を付けると枠で囲む、~ を付けると打ち消し線）
    //   √{12}           根号（中身の上に横棒）
    //   {{分子||分母}}   分数
    //   - は − に、英小文字は斜体の文字になる
    function formula(markup) {
        let html = escapeHtml(markup);
        html = html.replace(/√\{([^{}]*)\}/g, (m, body) =>
            `<span class="tu-sqrt"><span class="tu-sqrt-sign"><span class="tu-sqrt-text">√</span>${SQRT_SIGN_SVG}</span><span class="tu-sqrt-body">${body}</span></span>`);
        html = html.replace(/\{\{(.*?)\|\|(.*?)\}\}/g, (m, num, den) =>
            `<span class="tu-frac"><span class="tu-frac-num">${num}</span><span class="tu-frac-den">${den}</span></span>`);
        html = html.replace(/\[\[(.+?)\]\]/g, (m, inner) => {
            const [text, style = '', id = ''] = inner.split('|');
            const classes = ['tu-term'];
            const color = style.match(/\d/);
            if (color) classes.push(`tu-c${color[0]}`);
            if (style.includes('*')) classes.push('tu-focus');
            if (style.includes('~')) classes.push('tu-strike');
            const idAttr = id ? ` data-t="${id}"` : '';
            return `<span class="${classes.join(' ')}"${idAttr}>${text}</span>`;
        });
        // タグの外側の文字だけを整形する
        return html.split(/(<[^>]+>)/).map(part => {
            if (part.startsWith('<')) return part;
            return part
                .replace(/-/g, '−')
                .replace(/&[a-z]+;|[a-z]/g, m => (m.length > 1 ? m : `<i class="tu-var">${m}</i>`));
        }).join('');
    }

    // 解説文をHTMLにする（$...$ は数式、**...** は強調、改行は <br>）
    function rich(text) {
        if (text === undefined || text === null) return '';
        return String(text).split('$').map((part, i) => {
            if (i % 2 === 1) return `<span class="tu-math">${formula(part)}</span>`;
            return escapeHtml(part)
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        }).join('');
    }

    // 数式の行（文字列 または {m, note, cls} / {arrow, up}）をHTMLにする
    function renderLines(lines, enterFrom) {
        return (lines || []).map((line, i) => {
            const l = typeof line === 'string' ? { m: line } : line;
            const classes = ['tu-line'];
            if (l.cls) classes.push(`tu-line-${l.cls}`);
            if (enterFrom !== undefined && i >= enterFrom) classes.push('tu-enter');
            if (l.arrow !== undefined) {
                const label = l.arrow === true ? '' : `<span class="tu-arrow-label">${rich(l.arrow)}</span>`;
                return `<div class="${classes.join(' ')} tu-line-arrow"><span class="tu-arrow-down" aria-hidden="true">${l.up ? '↑' : '↓'}</span>${label}</div>`;
            }
            const note = l.note ? `<span class="tu-line-note">${rich(l.note)}</span>` : '';
            return `<div class="${classes.join(' ')}"><span class="tu-formula">${formula(l.m)}</span>${note}</div>`;
        }).join('');
    }

    // ===== アニメーション（STEP 2） =====
    let activeStage = null;
    let activeLinks = [];
    let drawToken = 0;

    function prefersReducedMotion() {
        try {
            return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        } catch (error) {
            return false;
        }
    }

    /**
     * アニメーションの1コマを描画する
     * frame: { lines, caption, links: [[項ID, 項ID, 色], ...] }
     * prevFrame: 1つ前のコマ（「次へ」で進んだときだけ渡す。新しく出た行・項を動かす）
     */
    function renderAnimationFrame(container, anim, index, prevFrame) {
        const frame = anim.frames[index];
        const animate = !!prevFrame && !prefersReducedMotion();
        const enterFrom = prevFrame ? (prevFrame.lines || []).length : undefined;
        const prevIds = prevFrame ? collectTermIds(prevFrame.lines) : null;

        container.innerHTML = `
            <div class="tu-card tu-anim">
                ${anim.title ? `<div class="tu-anim-title">${rich(anim.title)}</div>` : ''}
                <div class="tu-anim-stage">
                    <svg class="tu-links" aria-hidden="true"></svg>
                    <div class="tu-anim-lines">${renderLines(frame.lines, animate ? enterFrom : undefined)}</div>
                </div>
                <div class="tu-anim-caption" aria-live="polite">${rich(frame.caption)}</div>
                <div class="tu-anim-footer">
                    <span class="tu-anim-count">${index + 1} / ${anim.frames.length}</span>
                    <button class="tu-btn tu-btn-sub" data-action="replay">↺ もう一度見る</button>
                </div>
            </div>`;

        const stage = container.querySelector('.tu-anim-stage');
        if (animate && prevIds) {
            stage.querySelectorAll('[data-t]').forEach(el => {
                if (!prevIds.has(el.getAttribute('data-t'))) el.classList.add('tu-pop');
            });
        }
        activeStage = stage;
        activeLinks = frame.links || [];
        scheduleLinks(animate);
    }

    function collectTermIds(lines) {
        const ids = new Set();
        (lines || []).forEach(line => {
            const m = typeof line === 'string' ? line : (line.m || '');
            m.replace(/\[\[(.+?)\]\]/g, (all, inner) => {
                const id = inner.split('|')[2];
                if (id) ids.add(id);
                return all;
            });
        });
        return ids;
    }

    function scheduleLinks(animate) {
        const token = ++drawToken;
        const run = () => {
            if (token !== drawToken) return;
            drawLinks(activeStage, activeLinks, animate);
        };
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(() => window.requestAnimationFrame(run));
        } else {
            setTimeout(run, 0);
        }
    }

    // 項どうしを矢印で結ぶ
    function drawLinks(stage, links, animate) {
        if (!stage || !stage.isConnected) return;
        const svg = stage.querySelector('.tu-links');
        if (!svg) return;
        svg.innerHTML = '';
        const base = stage.getBoundingClientRect();
        if (!links.length || !base.width) return;

        svg.setAttribute('width', base.width);
        svg.setAttribute('height', base.height);
        svg.setAttribute('viewBox', `0 0 ${base.width} ${base.height}`);

        const NS = 'http://www.w3.org/2000/svg';
        const defs = document.createElementNS(NS, 'defs');
        LINK_COLORS.forEach((color, i) => {
            const marker = document.createElementNS(NS, 'marker');
            marker.setAttribute('id', `tu-arrowhead-${i}`);
            marker.setAttribute('viewBox', '0 0 10 10');
            marker.setAttribute('refX', '8');
            marker.setAttribute('refY', '5');
            marker.setAttribute('markerWidth', '7');
            marker.setAttribute('markerHeight', '7');
            marker.setAttribute('orient', 'auto-start-reverse');
            const head = document.createElementNS(NS, 'path');
            head.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
            head.setAttribute('fill', color);
            marker.appendChild(head);
            defs.appendChild(marker);
        });
        svg.appendChild(defs);

        const rel = el => {
            const r = el.getBoundingClientRect();
            return { cx: r.left - base.left + r.width / 2, top: r.top - base.top, bottom: r.bottom - base.top };
        };

        links.forEach(([from, to, color = 0], i) => {
            const a = stage.querySelector(`[data-t="${from}"]`);
            const b = stage.querySelector(`[data-t="${to}"]`);
            if (!a || !b) return;
            const ra = rel(a);
            const rb = rel(b);
            let d;
            if (Math.abs(ra.top - rb.top) < 6) {
                // 同じ行：上側に弧を描く
                const y = Math.min(ra.top, rb.top) - 2;
                const lift = 12 + Math.min(26, Math.abs(rb.cx - ra.cx) * 0.25);
                d = `M ${ra.cx} ${y} C ${ra.cx} ${y - lift}, ${rb.cx} ${y - lift}, ${rb.cx} ${y}`;
            } else {
                // 別の行：上から下（または下から上）へ
                const down = rb.top > ra.top;
                const y1 = down ? ra.bottom + 2 : ra.top - 2;
                const y2 = down ? rb.top - 2 : rb.bottom + 2;
                const my = (y1 + y2) / 2;
                d = `M ${ra.cx} ${y1} C ${ra.cx} ${my}, ${rb.cx} ${my}, ${rb.cx} ${y2}`;
            }
            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', d);
            path.setAttribute('class', `tu-link tu-link-c${color}`);
            path.setAttribute('stroke', LINK_COLORS[color] || LINK_COLORS[0]);
            const marker = `url(#tu-arrowhead-${LINK_COLORS[color] ? color : 0})`;
            svg.appendChild(path);
            if (animate && path.getTotalLength) {
                // 線を引き終わってから矢印の先を付ける
                const length = path.getTotalLength();
                path.style.strokeDasharray = `${length}`;
                path.style.strokeDashoffset = `${length}`;
                path.style.animationDelay = `${i * 0.35}s`;
                path.classList.add('tu-link-draw');
                path.addEventListener('animationend', () => path.setAttribute('marker-end', marker), { once: true });
            } else {
                path.setAttribute('marker-end', marker);
            }
        });
    }

    window.addEventListener('resize', () => {
        if (activeStage && activeStage.isConnected) drawLinks(activeStage, activeLinks, false);
    });

    Tutorial.render = { formula, rich, renderLines, renderAnimationFrame, escapeHtml, prefersReducedMotion };
})();
