// PWA Installation and Service Worker Registration
let deferredPrompt;
let isAppInstalled = false;

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Show install prompt after 3 seconds
  setTimeout(() => {
    if (!isAppInstalled && !window.matchMedia('(display-mode: standalone)').matches) {
      showInstallPrompt();
    }
  }, 3000);
});

// Handle app installed
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  isAppInstalled = true;
  hideInstallPrompt();
});

// Show install prompt
function showInstallPrompt() {
  const installPrompt = document.getElementById('installPrompt');
  installPrompt.style.display = 'block';
}

// Hide install prompt
function hideInstallPrompt() {
  const installPrompt = document.getElementById('installPrompt');
  installPrompt.style.display = 'none';
}

// Install button click
document.getElementById('installButton').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt = null;
    hideInstallPrompt();
  }
});

// Dismiss install prompt
document.getElementById('dismissInstall').addEventListener('click', () => {
  hideInstallPrompt();
  // Set cookie to remember dismissal
  localStorage.setItem('installPromptDismissed', Date.now().toString());
});

// Check if install prompt was previously dismissed
function shouldShowInstallPrompt() {
  const dismissed = localStorage.getItem('installPromptDismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed);
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed > 7; // Show again after 7 days
  }
  return true;
}

// Online/Offline status
function updateConnectionStatus() {
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');

  if (navigator.onLine) {
    statusIndicator.classList.remove('offline');
    statusIndicator.classList.add('online');
  } else {
    statusIndicator.classList.remove('online');
    statusIndicator.classList.add('offline');
  }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();

// DOM Elements
const menuButton = document.getElementById('menuButton');
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogInput = document.getElementById('dialogInput');
const typingIndicator = document.getElementById('typingIndicator');
const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const typedText = document.getElementById('typedText');
const virtualKeyboard = document.getElementById('virtualKeyboard');
const keyboardKeys = document.querySelectorAll('.keyboard-key');

// State variables
let currentText = '';
let typingIndex = 0;
let typingInterval;
let audioContext;
let typingSpeed = 'normal'; // Add speed state

// Speed configurations
const SPEED_CONFIGS = {
  slow: { minDelay: 150, maxDelay: 250 },
  normal: { minDelay: 50, maxDelay: 100 },
  fast: { minDelay: 20, maxDelay: 40 }
};

// Audio Manager
class AudioManager {
  constructor() {
    this.audioContext = null;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTypingSound() {
    // Sound functionality removed
    return;
  }
}

// Keyboard Manager
class KeyboardManager {
  constructor(audioManager) {
    this.keys = document.querySelectorAll('.keyboard-key');
    this.audioManager = audioManager;
    this.init();
  }

  init() {
    this.keys.forEach(key => {
      key.addEventListener('click', () => {
        const keyValue = key.dataset.key;
        this.audioManager.init();
        this.audioManager.playTypingSound();
        this.animateKeyPress(keyValue);
      });
    });
  }

  animateKeyPress(char) {
    const key = Array.from(this.keys).find(k =>
      k.dataset.key === char.toLowerCase()
    );

    if (key) {
      key.classList.add('pressed');

      // Create ripple effect
      const ripple = document.createElement('div');
      ripple.className = 'key-ripple';
      const rect = key.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (rect.width / 2 - size / 2) + 'px';
      ripple.style.top = (rect.height / 2 - size / 2) + 'px';
      key.appendChild(ripple);

      setTimeout(() => {
        key.classList.remove('pressed');
        if (ripple.parentNode) {
          ripple.remove();
        }
      }, 150);
    }
  }
}

// Human-like Typing Manager with Mistakes
class HumanTypingManager {
  constructor(audioManager, keyboardManager) {
    this.audioManager = audioManager;
    this.keyboardManager = keyboardManager;
    this.currentText = '';
    this.typingIndex = 0;
    this.typedContent = '';
    this.mistakeProbability = 0.15; // 15% chance of making a mistake
    this.backspaceProbability = 0.08; // 8% chance of backspacing even correct text
    this.isMakingMistake = false;
    this.mistakeChars = 'qwertyuiopasdfghjklzxcvbnm';
  }

  startTyping(text) {
    this.audioManager.init();
    this.currentText = text;
    this.typingIndex = 0;
    this.typedContent = '';
    typedText.innerHTML = '<span class="cursor">';

    virtualKeyboard.classList.add('active');
    // Start typing after 2 seconds instead of immediately
    setTimeout(() => {
      this.typeCharacter();
    }, 2000);
  }

  async typeCharacter() {
    if (this.typingIndex < this.currentText.length) {
      const shouldMakeMistake = Math.random() < this.mistakeProbability && !this.isMakingMistake;

      if (shouldMakeMistake) {
        await this.makeMistake();
      } else {
        const char = this.currentText[this.typingIndex];

        // Sometimes backspace correct text (human-like behavior)
        if (Math.random() < this.backspaceProbability && this.typedContent.length > 0) {
          await this.backspaceCharacter();
          // Retype the character
          await this.typeActualCharacter(char);
        } else {
          await this.typeActualCharacter(char);
        }

        this.typingIndex++;
      }

      // Continue typing
      setTimeout(() => this.typeCharacter(), this.getTypingDelay());
    } else {
      // Typing finished
      setTimeout(() => {
        virtualKeyboard.classList.remove('active');
        const cursor = typedText.querySelector('.cursor');
        if (cursor) cursor.remove();
      }, 1000);
    }
  }

  async typeActualCharacter(char) {
    this.keyboardManager.animateKeyPress(char);
    this.audioManager.playTypingSound();

    const cursor = typedText.querySelector('.cursor');
    const span = document.createElement('span');
    span.textContent = char;
    typedText.insertBefore(span, cursor);

    this.typedContent += char;
  }

  async makeMistake() {
    this.isMakingMistake = true;

    // Type a wrong character
    const wrongChar = this.getRandomMistakeChar();
    await this.typeActualCharacter(wrongChar);

    // Wait a bit (realization moment)
    await this.delay(300 + Math.random() * 500);

    // Backspace the wrong character
    await this.backspaceCharacter();

    // Wait a bit before typing correct character
    await this.delay(200 + Math.random() * 300);

    // Type the correct character
    const correctChar = this.currentText[this.typingIndex];
    await this.typeActualCharacter(correctChar);

    this.isMakingMistake = false;
    this.typingIndex++;
  }

  async backspaceCharacter() {
    return new Promise((resolve) => {
      this.keyboardManager.animateKeyPress('Backspace');
      this.audioManager.playTypingSound();

      // Remove last character
      const spans = typedText.querySelectorAll('span:not(.cursor)');
      if (spans.length > 0) {
        spans[spans.length - 1].remove();
        this.typedContent = this.typedContent.slice(0, -1);
      }

      setTimeout(resolve, 100 + Math.random() * 100);
    });
  }

  getRandomMistakeChar() {
    // Get a character that's close to the correct one on keyboard
    const correctChar = this.currentText[this.typingIndex].toLowerCase();
    const nearbyKeys = this.getNearbyKeys(correctChar);

    if (nearbyKeys.length > 0 && Math.random() < 0.7) {
      return nearbyKeys[Math.floor(Math.random() * nearbyKeys.length)];
    } else {
      return this.mistakeChars[Math.floor(Math.random() * this.mistakeChars.length)];
    }
  }

  getNearbyKeys(char) {
    const keyboard = {
      'q': ['w', 'a', 's'],
      'w': ['q', 'e', 'a', 's', 'd'],
      'e': ['w', 'r', 's', 'd', 'f'],
      'r': ['e', 't', 'd', 'f', 'g'],
      't': ['r', 'y', 'f', 'g', 'h'],
      'y': ['t', 'u', 'g', 'h', 'j'],
      'u': ['y', 'i', 'h', 'j', 'k'],
      'i': ['u', 'o', 'j', 'k', 'l'],
      'o': ['i', 'p', 'k', 'l'],
      'p': ['o', 'l'],
      'a': ['q', 'w', 's', 'z', 'x'],
      's': ['q', 'w', 'e', 'a', 'd', 'z', 'x', 'c'],
      'd': ['w', 'e', 'r', 's', 'f', 'x', 'c', 'v'],
      'f': ['e', 'r', 't', 'd', 'g', 'c', 'v', 'b'],
      'g': ['r', 't', 'y', 'f', 'h', 'v', 'b', 'n'],
      'h': ['t', 'y', 'u', 'g', 'j', 'b', 'n', 'm'],
      'j': ['y', 'u', 'i', 'h', 'k', 'n', 'm'],
      'k': ['u', 'i', 'o', 'j', 'l', 'm'],
      'l': ['i', 'o', 'p', 'k'],
      'z': ['a', 's', 'x'],
      'x': ['a', 's', 'd', 'z', 'c'],
      'c': ['s', 'd', 'f', 'x', 'v'],
      'v': ['d', 'f', 'g', 'c', 'b'],
      'b': ['f', 'g', 'h', 'v', 'n'],
      'n': ['g', 'h', 'j', 'b', 'm'],
      'm': ['h', 'j', 'k', 'n']
    };

    return keyboard[char] || [];
  }

  getTypingDelay() {
    const speedConfig = SPEED_CONFIGS[typingSpeed];
    return speedConfig.minDelay + Math.random() * (speedConfig.maxDelay - speedConfig.minDelay);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Initialize managers
const audioManager = new AudioManager();
const keyboardManager = new KeyboardManager(audioManager);
const typingManager = new HumanTypingManager(audioManager, keyboardManager);

// Speed option click handlers
document.querySelectorAll('.speed-option').forEach(option => {
  option.addEventListener('click', () => {
    document.querySelectorAll('.speed-option').forEach(opt => opt.classList.remove('active'));
    option.classList.add('active');
    typingSpeed = option.dataset.speed;
  });
});

// Menu button click
menuButton.addEventListener('click', () => {
  dialogOverlay.classList.add('active');
  dialogInput.value = '';
  dialogInput.focus();
});

// Dialog controls
okButton.addEventListener('click', () => {
  const text = dialogInput.value.trim();
  if (text) {
    dialogOverlay.classList.remove('active');
    // Hide the menu button after clicking OK
    menuButton.style.display = 'none';
    setTimeout(() => {
      typingManager.startTyping(text);
    }, 5000); // 5 second delay before typing starts
  }
});

cancelButton.addEventListener('click', () => {
  dialogOverlay.classList.remove('active');
});

dialogOverlay.addEventListener('click', (e) => {
  if (e.target === dialogOverlay) {
    dialogOverlay.classList.remove('active');
  }
});

dialogInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    okButton.click();
  }
});

// Add character counter functionality
dialogInput.addEventListener('input', (e) => {
  const length = e.target.value.length;
  const counter = document.querySelector('.char-counter');
  counter.textContent = length;

  if (length >= 180) {
    counter.style.color = '#ff6b6b';
  } else {
    counter.style.color = '#666';
  }
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    menuButton.click();
  }
  if (e.key === 'Escape' && dialogOverlay.classList.contains('active')) {
    dialogOverlay.classList.remove('active');
  }
});

// Add typing indicator
function showTypingIndicator() {
  typingIndicator.textContent = 'Typing...';
  typingIndicator.style.opacity = '1';
}

function hideTypingIndicator() {
  setTimeout(() => {
    typingIndicator.style.opacity = '0';
  }, 1000);
}

// Modify startTyping to show indicator
const originalStartTyping = typingManager.startTyping;
typingManager.startTyping = function (text) {
  showTypingIndicator();
  originalStartTyping.call(this, text);

  // Hide indicator when typing is done
  const checkTypingComplete = setInterval(() => {
    if (this.typingIndex >= this.currentText.length) {
      hideTypingIndicator();
      clearInterval(checkTypingComplete);
    }
  }, 100);
};

// Initialize with cursor
setTimeout(() => {
  typedText.innerHTML = '<span class="cursor">';
}, 500);