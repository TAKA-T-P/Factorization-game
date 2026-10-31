// 各ゲームモードの「？」クイック解説

// ヘルプテキストのデータ
const helpTexts = {
    expand: {
        title: '展開ラッシュ - 遊び方',
        content: `
            <h2>乗法公式とは</h2>
            <p>中学3年生の数学で最初に学習する「乗法公式」は、多項式のかけ算を、筆算や地道な計算をせずに、パターンでパッと解くための便利ルールのことです。</p>

            <p>公式を使う前に、すべての基本は <span class="math">(a+b)(c+d) = ac+ad+bc+bd</span> という分配法則であることを忘れないでください。これを毎回やるのが大変なので、以下の4つを使い分けます。</p>

            <h3>公式① <span class="math">(x + a)(x + b) = x² + (a + b)x + ab</span></h3>
            <p>「たして、かける」の公式です。</p>
            <p><strong>使い方:</strong> 真ん中の項は「数字をたしたもの」に <span class="math">x</span> をつけ、最後の項は「数字をかけたもの」にします。</p>
            <div class="formula">例: (x+2)(x+3) = x² + (2+3)x + 2×3 = x² + 5x + 6</div>

            <h3>公式② <span class="math">(x+a)² = x² + 2ax + a²</span></h3>
            <p>「和の平方」の公式です。</p>
            <p><strong>使い方:</strong> <span class="math">x</span> を2乗し、次に <span class="math">x</span> と <span class="math">a</span> をかけて2倍にし、最後に <span class="math">a</span> を2乗します。</p>
            <div class="formula">例: (x+3)² = x² + 2×3×x + 3² = x² + 6x + 9</div>

            <h3>公式③ <span class="math">(x−a)² = x² − 2ax + a²</span></h3>
            <p>「差の平方」の公式です。</p>
            <p><strong>使い方:</strong> 公式②と似ていますが、真ん中の符号だけがマイナスになります。</p>
            <div class="formula">例: (x−4)² = x² − 2×4×x + 4² = x² − 8x + 16</div>

            <h3>公式④ <span class="math">(x + a)(x − a) = x² − a²</span></h3>
            <p>「和と差の積」の公式です。カッコの中の数字が同じで、プラスとマイナスだけが違うときに使えます。</p>
            <p><strong>使い方:</strong> 展開すると真ん中の項が消え、必ず「左の2乗 − 右の2乗」の形になります。</p>
            <div class="formula">例: (x+5)(x−5) = x² − 5² = x² − 25</div>

            <h2>まとめ</h2>
            <p>公式を使わなくても、地道に1つずつかけ算（分配法則）をすれば式の展開はできます。しかし、これから習う「因数分解」や、今後の数学の計算スピードを上げるためには、この4つの形をパッと見て使いこなせるようになることが重要です。</p>
        `
    },
    factorize: {
        title: '因数分解ラッシュ - 遊び方',
        content: `
            <h2>因数分解とは</h2>
            <p>因数分解は、展開の逆再生だと考えましょう。展開が「カッコを外す計算」だったのに対し、因数分解は「バラバラの式をカッコの形にまとめる計算」です。公式を逆に使うだけですが、どの公式を使うか「見分ける目」を持つことが攻略のポイントになります。</p>

            <h3>公式① <span class="math">x² + (a+b)x + ab = (x+a)(x+b)</span></h3>
            <p>もっとも頻繁に使う公式です。「かけて後ろの数、たして真ん中の数」になる2つの数字を探します。</p>
            <div class="formula">例：x² + 5x + 6 の場合、かけて6、たして5になる数字のペアは「2と3」なので、(x+2)(x+3) となります。</div>

            <h3>公式②③ <span class="math">x² ± 2ax + a² = (x±a)²</span></h3>
            <p>一番後ろの数が「何かの2乗」で、真ん中が「その数を2倍したもの」なら、この公式です。</p>
            <div class="formula">例：x² + 6x + 9 の場合、後ろの数が「3の2乗」、真ん中が「3の2倍」なので、(x+3)² となります。</div>

            <h3>公式④ <span class="math">x² − a² = (x+a)(x−a)</span></h3>
            <p>項が2つしかなく、「2乗−2乗」の形になっていたら、和と差の積の形になります。</p>
            <div class="formula">例：x² − 16 の場合、x² − 4² なので、(x+4)(x−4) となります。</div>

            <h2>基本の4公式を使い分けるコツ</h2>
            <p>まず項の数を確認し、項が2つなら「2乗−2乗」を疑いましょう。項が3つの場合、後ろの数が「2乗の数」なら「カッコの2乗」を疑いましょう。どちらでもない場合は「かけて後ろの数、たして真ん中」の数字ペアを探します。</p>

            <p>例えば「かけて6」なら<span class="math">(1,6)</span>、<span class="math">(2,3)</span>などのかけ算のペアを思い浮かべ、その中から「たして真ん中の数」になるものを選べば正解にたどり着けます。</p>
        `
    },
    squareRoot: {
        title: '平方根ラッシュ - 遊び方',
        content: `
            <h2>平方根とは</h2>
            <p>平方根とは「2乗する前の元の数」を指します。</p>
            <div class="formula">例えば 25 の平方根は 5 と −5 です。</div>

            <h3>記号「<span class="sqrt">√</span>」の登場</h3>
            <p>「2乗して7になる数」のように、ぴったりの整数がない場合に<span class="sqrt">√</span><span class="math">7</span>（ルート7）という記号を使って表します。例えば、7の平方根は <span class="sqrt">√</span><span class="math">7</span> と <span class="math">−</span><span class="sqrt">√</span><span class="math">7</span> と表せます。</p>
            <p>また、<span class="math"><span class="sqrt">√</span>7 × <span class="sqrt">√</span>7 = 7</span> のように、同じルートを2回かけるとルートが外れます。</p>

            <h2><span class="sqrt">√</span>の中を簡単にする方法 (<span class="math">a<span class="sqrt">√</span>b</span> の形にする)</h2>
            <p>計算結果が <span class="sqrt">√</span><span class="math">12</span> のようになったとき、そのままにせず「できるだけ <span class="sqrt">√</span> の中を小さくする」のが数学のルールです。</p>

            <h3>手順1. 素因数分解する</h3>
            <div class="formula">12を素因数分解すると、12 = 2 × 2 × 3 です。</div>

            <h3>手順2. 同じ数字のペアを外に出す</h3>
            <p>「2」のペアが1組あるので、その数を1つ分だけ<span class="sqrt">√</span> の外に出し、残った数字は<span class="sqrt">√</span> の中に閉じ込めます。</p>
            <div class="formula">よって <span class="sqrt">√</span>12 = 2<span class="sqrt">√</span>3 となります。</div>

            <p>同様に、<span class="sqrt">√</span><span class="math">18</span>を簡単にしてみましょう。</p>
            <div class="formula">18 = 2 × 3 × 3 です。「3」のペアが外に出て、2だけが<span class="sqrt">√</span>の中に残るので、<span class="sqrt">√</span>18 = 3<span class="sqrt">√</span>2 となります。</div>

            <h2>早く解くコツ（平方数を見つける）</h2>
            <p><span class="math">2² = 4</span>、<span class="math">3² = 9</span>、<span class="math">4² = 16</span>、<span class="math">5² = 25</span>… などを覚えておくと、「<span class="sqrt">√</span><span class="math">63</span> は <span class="math">9×7</span> だから <span class="math">3<span class="sqrt">√</span>7</span> だ！」と素早く変換できるようになります。</p>
        `
    }
};

// 表示中の解説のモード（チュートリアルへのリンク先に使う）
let currentHelpMode = null;

function showHelp(mode) {
    const helpData = helpTexts[mode];
    if (!helpData) return;

    currentHelpMode = mode;
    document.getElementById('helpTitle').textContent = helpData.title;
    document.getElementById('helpContent').innerHTML = helpData.content;
    showScreen('helpScreen');
}

function closeHelp() {
    showScreen('titleScreen');
}
