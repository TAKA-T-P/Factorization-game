// 効果音

// クイズ番組風の正解音（明るく上昇する音階・倍速版）
function createCorrectSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 音階: ド→ミ→ソ→ド（高）の和音（倍速）
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.05); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.1); // G5
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.15); // C6

    // 音量の調整（フェードイン・フェードアウト）倍速
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.025);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

const correctSound = { play: createCorrectSound };

// 短い中間正解音
function createPartialCorrectSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

const partialCorrectSound = { play: createPartialCorrectSound };
const wrongSound = new Audio('data:audio/wav;base64,UklGRgQGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YeMFAAD/8c/S6dHRzNHK0cnRytHM0dHR0tHR0dHS0dHRytHK0dHR0dHR0c3Q0s/S6dHK0cnQ0tHRzNLS0dHK0cnM0dHSy9HN');

// ゲーム終了時のジングル
function createGameOverJingle() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // ファンファーレ風の音階: ソ→ド→ミ→ソ(高)→ド(高)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392.00, audioContext.currentTime); // G4
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.4); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.6); // G5
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime + 0.8); // C6

    // 音量調整
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 1.0);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1.3);
}

const gameOverJingle = { play: createGameOverJingle };

// カウントダウン音
function createCountdownBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
}

const countdownBeep = { play: createCountdownBeep };

// カウントダウン開始音（START用）
function createStartBeep() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1046.5, audioContext.currentTime); // C6 (高い音)

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

const startBeep = { play: createStartBeep };

function toggleAudio() {
    audioEnabled = !audioEnabled;
    const toggleBtn = document.getElementById('audioToggleBtn');
    const audioIcon = document.getElementById('audioIcon');
    const audioText = toggleBtn.querySelector('span:last-child');

    if (audioEnabled) {
        audioIcon.textContent = '🔊';
        audioText.textContent = '効果音ON';
        toggleBtn.classList.add('active');
    } else {
        audioIcon.textContent = '🔇';
        audioText.textContent = '効果音OFF';
        toggleBtn.classList.remove('active');
    }
}

function playSound(sound) {
    if (audioEnabled) {
        if (sound.currentTime !== undefined) {
            sound.currentTime = 0;
            sound.play().catch(() => {});
        } else {
            sound.play();
        }
    }
}
