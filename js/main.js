// アプリ初期化・画面遷移

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// キャッチコピー
const catchphrases = [
    '式を制する者が、入試を制す。',
    '展開と因数分解、ここで完成させろ。',
    'その１問が、合格を近づける。',
    '速さと正確さ、その先へ。',
    '計算力は、裏切らない。',
    '君は、何段まで到達できるか。',
    '今日の１プレイが、次の段位を決める。',
    'ミス０を狙え。スピードで差をつけろ。',
    '限界は、次の問題で超えろ。',
    '挑戦し続けた者だけが、上へ行く。',
    'できるまでやる。だから、できる。',
    '苦手は、練習で武器になる。',
    '昨日の自分に、今日も勝て。',
    '反復は、最強の戦略だ。',
    '本番で解ける力は、ここで作る。',
    '式を操れ。数式の頂へ。',
    '計算を、支配せよ。',
    '因数分解は、選ばれし者の技。',
    '段位は、実力の証明だ。',
    'この修練が、君を別次元へ連れていく。'
];

// ランダムなキャッチコピーを表示
function displayRandomCatchphrase() {
    const randomIndex = Math.floor(Math.random() * catchphrases.length);
    const catchphraseElement = document.getElementById('catchphrase');
    if (catchphraseElement) {
        catchphraseElement.textContent = catchphrases[randomIndex];
    }
}

// ページ読み込み時にキャッチコピーを表示
window.addEventListener('DOMContentLoaded', () => {
    displayRandomCatchphrase();
});
