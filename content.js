const STOIC_QUOTES = [
  { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "We suffer more often in imagination than in reality.", author: "Seneca" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "He who climbs upon an algorithm trades his freedom for a flash of light.", author: "Modern Stoic" }
];

let lastUrl = location.href;
let intervalId = null;

function isDoomscrollFeed() {
  const url = window.location.href;
  return url.includes("youtube.com/shorts") || url.includes("instagram.com/reels") || url.includes("instagram.com/reel");
}

function getRandomQuote() {
  return STOIC_QUOTES[Math.floor(Math.random() * STOIC_QUOTES.length)];
}

function pauseAllVideos() {
  const videos = document.querySelectorAll("video");
  videos.forEach(v => {
    try {
      v.pause();
    } catch(e) {}
  });
}

function triggerPhilosophyVeil() {
  if (document.getElementById("philosophy-veil")) return;

  chrome.storage.local.get(["selectedTier", "lockoutUntil"], (data) => {
    const tier = data.selectedTier || 1;
    const now = Date.now();

    // Check if Tier 3 active lockout is already running
    if (data.lockoutUntil && now < data.lockoutUntil) {
      renderTier3Lockout(data.lockoutUntil);
      return;
    }

    const quote = getRandomQuote();

    if (tier === 1) {
      renderTier1(quote);
    } else if (tier === 2) {
      pauseAllVideos();
      renderTier2(quote);
    } else if (tier === 3) {
      pauseAllVideos();
      const lockoutTime = Date.now() + 5 * 60 * 1000; // 5 minutes
      chrome.storage.local.set({ lockoutUntil: lockoutTime }, () => {
        renderTier3Lockout(lockoutTime);
      });
    }
  });
}

function removeVeil() {
  const veil = document.getElementById("philosophy-veil");
  if (veil) veil.remove();
}

// Tier 1: Mindful Speed Bump (Quote + Continue)
function renderTier1(quote) {
  const veil = document.createElement("div");
  veil.id = "philosophy-veil";
  veil.innerHTML = `
    <div class="veil-content">
      <div class="veil-quote-icon">✦</div>
      <p class="veil-quote">"${quote.text}"</p>
      <p class="veil-author">— ${quote.author}</p>
      <button class="veil-btn" id="dismiss-veil">Continue Mindfully</button>
    </div>
  `;
  document.body.appendChild(veil);
  document.getElementById("dismiss-veil").addEventListener("click", removeVeil);
}

// Tier 2: Pause Video + Mandatory Breath
function renderTier2(quote) {
  const veil = document.createElement("div");
  veil.id = "philosophy-veil";
  veil.innerHTML = `
    <div class="veil-content">
      <div class="veil-quote-icon">⏸</div>
      <p class="veil-quote">"${quote.text}"</p>
      <p class="veil-author">— ${quote.author}</p>
      <button class="veil-btn" id="resume-veil">I am Conscious. Resume</button>
    </div>
  `;
  document.body.appendChild(veil);

  // Keep pausing video if user tries to bypass
  const forcePauseInterval = setInterval(pauseAllVideos, 300);

  document.getElementById("resume-veil").addEventListener("click", () => {
    clearInterval(forcePauseInterval);
    removeVeil();
  });
}

// Tier 3: Strict 5-Minute Lockdown
function renderTier3Lockout(lockoutUntil) {
  let veil = document.getElementById("philosophy-veil");
  if (!veil) {
    veil = document.createElement("div");
    veil.id = "philosophy-veil";
    document.body.appendChild(veil);
  }

  const quote = getRandomQuote();

  function updateTimer() {
    pauseAllVideos();
    const remaining = Math.max(0, Math.floor((lockoutUntil - Date.now()) / 1000));
    const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
    const secs = String(remaining % 60).padStart(2, "0");

    veil.innerHTML = `
      <div class="veil-content">
        <div class="veil-quote-icon">⏳</div>
        <p class="veil-quote">"${quote.text}"</p>
        <p class="veil-author">— ${quote.author}</p>
        <div class="veil-timer">${mins}:${secs}</div>
        <p class="veil-lockNotice">Application locked to reset your dopamine baseline.</p>
      </div>
    `;

    if (remaining <= 0) {
      clearInterval(intervalId);
      chrome.storage.local.remove("lockoutUntil");
      removeVeil();
    }
  }

  updateTimer();
  clearInterval(intervalId);
  intervalId = setInterval(updateTimer, 1000);
}

// Monitor Single-Page App (SPA) URL changes
function checkNavigation() {
  if (isDoomscrollFeed()) {
    triggerPhilosophyVeil();
  } else {
    // If user clicked away to Home or Subscriptions, remove Tier 1 & 2 overlays
    chrome.storage.local.get(["lockoutUntil"], (data) => {
      if (!data.lockoutUntil || Date.now() >= data.lockoutUntil) {
        removeVeil();
      }
    });
  }
}

// Observe URL changes
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkNavigation();
  }
});
observer.observe(document, { subtree: true, childList: true });

// Check on initial script load
checkNavigation();