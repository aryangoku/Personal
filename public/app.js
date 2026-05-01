const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const loveDuration = document.getElementById("loveDuration");
const birthdayCountdown = document.getElementById("birthdayCountdown");
const anniversaryCountdown = document.getElementById("anniversaryCountdown");
const loveStreak = document.getElementById("loveStreak");
const distanceMiles = document.getElementById("distanceMiles");
const heartJarGrid = document.getElementById("heartJarGrid");
const heartJarMessage = document.getElementById("heartJarMessage");
const openWhenButtons = document.querySelectorAll(".open-when-btn");
const openWhenMessage = document.getElementById("openWhenMessage");
const dailyLoveNoteText = document.getElementById("dailyLoveNoteText");
const nextLoveNoteBtn = document.getElementById("nextLoveNoteBtn");
const hugButtons = document.querySelectorAll(".hug-btn");
const hugAnimation = document.getElementById("hugAnimation");
const hugMessage = document.getElementById("hugMessage");
const memoryMapList = document.getElementById("memoryMapList");
const momentsGrid = document.getElementById("momentsGrid");
const momentViewer = document.getElementById("momentViewer");
const closeMomentViewer = document.getElementById("closeMomentViewer");
const viewerTitle = document.getElementById("viewerTitle");
const viewerMediaWrap = document.getElementById("viewerMediaWrap");
const viewerCaption = document.getElementById("viewerCaption");
const confettiCanvas = document.getElementById("confettiCanvas");
const lockScreen = document.getElementById("lockScreen");
const appRoot = document.getElementById("appRoot");
const unlockForm = document.getElementById("unlockForm");
const passwordInput = document.getElementById("passwordInput");
const unlockError = document.getElementById("unlockError");
const lockQuote = document.getElementById("lockQuote");
const fingerprintPulse = document.getElementById("fingerprintPulse");
const lockCard = document.querySelector(".lock-card");
let lastSparkleAt = 0;

let conversationHistory = [];
let lastBotReply = "Hi Shona! I am here for you always.";
const LOVE_STREAK_KEY = "shona_love_streak";
const BIRTHDAY_MONTH_INDEX = 4;
const BIRTHDAY_DAY = 22;
const ANNIVERSARY_MONTH_INDEX = 7;
const ANNIVERSARY_DAY = 26;
const APP_PASSWORD = "aaradhya";
const ACCESS_KEY = "shona_private_access";
const CHAT_SESSION_KEY = "shona_chat_session_id";
const LOCK_QUOTE_TEXT = "You are my today, my tomorrow, my forever, Shona.";
const OPEN_WHEN_MESSAGES = {
  miss: "Shona, if you miss me, close your eyes and feel my hug wrapped around you, I am always here for you.",
  sad: "Shona, bad days pass. You are stronger, brighter, and more loved than you feel right now.",
  motivation: "Shona, you can do hard things. I am always proud of you, even before you win. You are the strongest person I know.",
  alone: "Shona, you are never alone. Aru is always one message away from your heart. You are my favorite person in every timeline.",
  smile: "Shona, quick smile challenge: think of our cutest memory... there it is. You are the most beautiful person I know."
};
const DAILY_NOTES = [
  "Today's reminder: You are loved.",
  "Drink water, Shona.",
  "I'm proud of you.",
  "Your smile is my favorite thing.",
  "Take a deep breath, my love. You are doing amazing.",
  "No matter what today is, I am always on your side."
];
const HUG_MESSAGES = {
  tight: "Sending you a tight hug, Shona. Stay right here with me.",
  forehead: "Forehead kiss delivered, Shona. You are safe and loved.",
  longdistance: "Long-distance hug activated. Close your eyes and feel me beside you.",
  comfort: "Comfort hug sent, Shona. You do not have to carry this alone.",
  proud: "Proud-of-you hug sent. Shona, I am deeply proud of the person you are."
};
const MEMORY_MAP_ITEMS = [
  { place: "Vidyalankar", note: "We first met there - a simple beginning with hidden sparks." },
  { place: "Verve", note: "You saw my wild dance side, and our story got its first twist." },
  { place: "Yashvi Birthday", note: "We really talked in person for long despite everyone around." },
  { place: "Roshni Birthday", note: "You left your earring in my car - and we talked all night after that." },
  { place: "Virar (3rd Jan, Parnika Birthday)", note: "I held your hand and something changed deeply for me." },
  { place: "ISKCON", note: "After a rough day, we stayed together and understood each other better." },
  { place: "My Place Nightout + Daman Trip", note: "Care, closeness, and moments that felt like home with you." },
  { place: "Marine Drive + Malabar Hills + Mini Seashore", note: "First rose, first car date, and our best unofficial date." },
  { place: "Dream Destination", note: "Next stop: our forever travel story together." }
];
const SPECIAL_MOMENTS = [
  {
    title: "First Pic",
    type: "image",
    src: "./images/first-pic.png",
    caption: "Our first picture together, still my favorite frame."
  },
  {
    title: "First Trip",
    type: "image",
    src: "./images/first-trip.png",
    caption: "Our first trip together - every moment felt magical."
  },
  {
    title: "First Birthday",
    type: "image",
    src: "./images/first-birthday.png",
    caption: "The first birthday memory with you that I never forget."
  },
  {
    title: "First Movie Date",
    type: "image",
    src: "./images/first-movie-date.png",
    caption: "Our first movie date - I barely watched the movie, just you."
  },
  {
    title: "Cute Video 1",
    type: "video",
    src: "./videos/cuteVideo-web.mp4",
    caption: "One of my favorite clips of us."
  },
  {
    title: "Cute Video 2",
    type: "video",
    src: "./videos/cuteVideo-2-web.mp4",
    caption: "Another tiny memory that means so much."
  }
];
const HEART_JAR_MESSAGES = [
  "Shona, I am always one call away from you.",
  "Shona, you are my favorite person in every timeline.",
  "Shona, close your eyes and feel my hug right now.",
  "Shona, no distance can reduce what I feel for you.",
  "Shona, I am proud of you every single day.",
  "Shona, your smile is still my safest place.",
  "Shona, we are a team. Always.",
  "Shona, I miss you too, endlessly."
];
let confettiAnimationId = null;
let quoteTimer = null;

function startTypewriterQuote() {
  if (!lockQuote) return;
  let idx = 0;
  lockQuote.textContent = "";
  if (quoteTimer) clearInterval(quoteTimer);
  quoteTimer = setInterval(() => {
    idx += 1;
    lockQuote.textContent = LOCK_QUOTE_TEXT.slice(0, idx);
    if (idx >= LOCK_QUOTE_TEXT.length) {
      clearInterval(quoteTimer);
      quoteTimer = null;
    }
  }, 42);
}

function unlockApp() {
  fingerprintPulse.classList.remove("unlocked");
  // Restart unlock pulse animation each successful unlock.
  void fingerprintPulse.offsetWidth;
  fingerprintPulse.classList.add("unlocked");
  lockScreen.classList.add("hidden");
  appRoot.classList.remove("app-locked");
  appRoot.classList.add("app-unlocked");
  sessionStorage.setItem(ACCESS_KEY, "granted");
}

function checkInitialAccess() {
  const granted = sessionStorage.getItem(ACCESS_KEY) === "granted";
  if (granted) {
    unlockApp();
  }
}

function spawnLockSparkle(clientX, clientY) {
  if (!lockScreen || lockScreen.classList.contains("hidden")) return;
  const now = performance.now();
  if (now - lastSparkleAt < 42) return;
  lastSparkleAt = now;

  const sparkle = document.createElement("span");
  sparkle.className = "cursor-sparkle";
  sparkle.textContent = Math.random() > 0.5 ? "❤" : "✦";
  sparkle.style.left = `${clientX}px`;
  sparkle.style.top = `${clientY}px`;
  sparkle.style.setProperty("--sparkle-drift", `${-20 - Math.random() * 26}px`);
  sparkle.style.animationDuration = `${800 + Math.random() * 600}ms`;
  lockScreen.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 1600);
}

// Change this date to your actual dating start date if needed.
const DATING_START = new Date("2024-08-26T00:00:00");

function getNextOccurrence(monthIndex, dayOfMonth) {
  const now = new Date();
  let target = new Date(now.getFullYear(), monthIndex, dayOfMonth, 0, 0, 0);
  if (target < now) {
    target = new Date(now.getFullYear() + 1, monthIndex, dayOfMonth, 0, 0, 0);
  }
  return target;
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const years = Math.floor(totalSeconds / (365 * 24 * 3600));
  const daysAfterYears = totalSeconds % (365 * 24 * 3600);
  const days = Math.floor(daysAfterYears / (24 * 3600));
  const hours = Math.floor((daysAfterYears % (24 * 3600)) / 3600);
  const minutes = Math.floor((daysAfterYears % 3600) / 60);
  const seconds = daysAfterYears % 60;
  return `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function formatCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) return "Today";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${days}d ${hours}h ${mins}m`;
}

function updateDashboard() {
  const now = new Date();
  loveDuration.textContent = formatDuration(now - DATING_START);
  birthdayCountdown.textContent = formatCountdown(
    getNextOccurrence(BIRTHDAY_MONTH_INDEX, BIRTHDAY_DAY)
  );
  anniversaryCountdown.textContent = formatCountdown(
    getNextOccurrence(ANNIVERSARY_MONTH_INDEX, ANNIVERSARY_DAY)
  );
}

function milesBetweenPoints(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = earthRadiusKm * c;
  return Math.round(km * 0.621371);
}

function renderDistanceMeter() {
  const miles = milesBetweenPoints(43.0481, -76.1474, 19.0330, 73.0297);
  distanceMiles.textContent = `${miles} miles`;
}

function renderHeartJar() {
  heartJarGrid.innerHTML = "";
  HEART_JAR_MESSAGES.forEach((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "heart-token";
    button.textContent = "❤";
    button.addEventListener("click", () => {
      heartJarMessage.textContent = HEART_JAR_MESSAGES[index];
      button.classList.add("opened");
    });
    heartJarGrid.appendChild(button);
  });
}

function setDailyLoveNote() {
  if (!dailyLoveNoteText) return;
  const index = new Date().getDate() % DAILY_NOTES.length;
  dailyLoveNoteText.textContent = DAILY_NOTES[index];
}

function renderMemoryMap() {
  memoryMapList.innerHTML = "";
  MEMORY_MAP_ITEMS.forEach((item) => {
    const card = document.createElement("article");
    card.className = "memory-map-item";
    card.innerHTML = `<h3>${item.place}</h3><p>${item.note}</p>`;
    memoryMapList.appendChild(card);
  });
}

function openMoment(moment) {
  viewerTitle.textContent = moment.title;
  viewerCaption.textContent = moment.caption;
  viewerMediaWrap.innerHTML = "";

  if (moment.type === "video") {
    const video = document.createElement("video");
    video.src = moment.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.addEventListener("loadedmetadata", () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        viewerCaption.textContent =
          "This video is playing audio only in this browser. Convert it to H.264 MP4 to show the video frame.";
      }
    });
    viewerMediaWrap.appendChild(video);
  } else {
    const image = document.createElement("img");
    image.src = moment.src;
    image.alt = moment.title;
    viewerMediaWrap.appendChild(image);
  }

  momentViewer.classList.remove("hidden");
}

function renderSpecialMoments() {
  momentsGrid.innerHTML = "";
  SPECIAL_MOMENTS.forEach((moment) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "moment-tile";
    const mediaInner =
      moment.type === "video"
        ? `<video src="${moment.src}" muted playsinline preload="metadata" aria-hidden="true"></video>`
        : `<img src="${moment.src}" alt="${moment.title}" />`;
    tile.innerHTML = `<div class="moment-tile-media">${mediaInner}</div><h4>${moment.title}</h4>`;
    tile.addEventListener("click", () => openMoment(moment));
    momentsGrid.appendChild(tile);
  });
}

function updateLoveStreak() {
  const today = new Date().toDateString();
  const data = JSON.parse(
    localStorage.getItem(LOVE_STREAK_KEY) || '{"streak":0,"lastOpen":""}'
  );
  if (data.lastOpen === today) {
    loveStreak.textContent = `${data.streak} days`;
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isConsecutive = data.lastOpen === yesterday.toDateString();
  const nextStreak = isConsecutive ? data.streak + 1 : 1;
  const updated = { streak: nextStreak, lastOpen: today };
  localStorage.setItem(LOVE_STREAK_KEY, JSON.stringify(updated));
  loveStreak.textContent = `${nextStreak} days`;
}

function appendMessage(text, who) {
  const msg = document.createElement("div");
  msg.className = `msg ${who}`;
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function getChatSessionId() {
  let sessionId = localStorage.getItem(CHAT_SESSION_KEY);
  if (!sessionId) {
    sessionId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CHAT_SESSION_KEY, sessionId);
  }
  return sessionId;
}

async function sendMessage(message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: conversationHistory,
      sessionId: getChatSessionId()
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to get response.");
  }
  return data.reply;
}

function setupConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}

function runConfetti(durationMs = 5200) {
  setupConfettiCanvas();
  const ctx = confettiCanvas.getContext("2d");
  const pieces = Array.from({ length: 180 }).map(() => ({
    x: Math.random() * confettiCanvas.width,
    y: Math.random() * -confettiCanvas.height,
    w: 5 + Math.random() * 7,
    h: 6 + Math.random() * 11,
    speedY: 1.6 + Math.random() * 3.2,
    speedX: -1 + Math.random() * 2,
    rotation: Math.random() * 360,
    rotateSpeed: -6 + Math.random() * 12,
    color: ["#ff5fb2", "#ffd166", "#b16bff", "#8affc1"][Math.floor(Math.random() * 4)]
  }));

  const start = Date.now();
  function frame() {
    const elapsed = Date.now() - start;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotateSpeed;
      if (p.y > confettiCanvas.height + 20) {
        p.y = -20;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (elapsed < durationMs) {
      confettiAnimationId = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(confettiAnimationId);
      confettiAnimationId = null;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }
  frame();
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const raw = messageInput.value.trim();
  if (!raw) return;

  appendMessage(raw, "user");
  messageInput.value = "";
  sendBtn.disabled = true;

  try {
    const reply = await sendMessage(raw);
    lastBotReply = reply;
    appendMessage(reply, "bot");
    conversationHistory.push({ role: "user", content: raw });
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    appendMessage(`Error: ${err.message}`, "bot");
  } finally {
    sendBtn.disabled = false;
  }
});

openWhenButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.openWhen;
    openWhenMessage.textContent =
      OPEN_WHEN_MESSAGES[key] || "Shona, Aru is always here for you.";
  });
});

nextLoveNoteBtn.addEventListener("click", () => {
  const idx = Math.floor(Math.random() * DAILY_NOTES.length);
  dailyLoveNoteText.textContent = DAILY_NOTES[idx];
});

hugButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.hug;
    hugMessage.textContent = HUG_MESSAGES[key];
    hugAnimation.classList.remove("burst");
    void hugAnimation.offsetWidth;
    hugAnimation.classList.add("burst");
  });
});

closeMomentViewer.addEventListener("click", () => {
  momentViewer.classList.add("hidden");
});

momentViewer.addEventListener("click", (event) => {
  if (event.target === momentViewer) {
    momentViewer.classList.add("hidden");
  }
});

window.addEventListener("resize", setupConfettiCanvas);

unlockForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const typedPassword = passwordInput.value.trim();
  if (typedPassword === APP_PASSWORD) {
    unlockError.classList.add("hidden");
    unlockApp();
    passwordInput.value = "";
    return;
  }
  if (typedPassword.toLowerCase() === "aradhya") {
    unlockError.textContent = "babes wrong spelling";
  } else {
    unlockError.textContent = "Babe how can you not no this";
  }
  unlockError.classList.remove("hidden");
  lockCard.classList.remove("shake");
  // Restart shake animation for repeated wrong attempts.
  void lockCard.offsetWidth;
  lockCard.classList.add("shake");
});

lockScreen.addEventListener("pointermove", (event) => {
  spawnLockSparkle(event.clientX, event.clientY);
});

lockScreen.addEventListener(
  "touchmove",
  (event) => {
    const touch = event.touches[0];
    if (!touch) return;
    spawnLockSparkle(touch.clientX, touch.clientY);
  },
  { passive: true }
);

function bootstrapRomanticFeatures() {
  startTypewriterQuote();
  checkInitialAccess();
  updateDashboard();
  updateLoveStreak();
  renderDistanceMeter();
  renderHeartJar();
  renderMemoryMap();
  renderSpecialMoments();
  setDailyLoveNote();
  setInterval(updateDashboard, 1000);
}

bootstrapRomanticFeatures();
