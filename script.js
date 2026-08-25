let allGames = [];
let currentCategory = "all";
let searchQuery = "";
let favorites = JSON.parse(localStorage.getItem("glassy-favorites")) || [];

const gamesGrid = document.getElementById("gamesGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("gameModal");
const gameFrame = document.getElementById("gameFrame");
const modalTitle = document.getElementById("modalTitle");
const closeModalBtn = document.getElementById("closeModal");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const themeToggle = document.getElementById("themeToggle");
const modalContent = document.getElementById("modalContent");

// ========== THEME ==========
function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light");
    themeToggle.textContent = "🌙";
  }
  localStorage.setItem("glassy-theme", theme);
}

const savedTheme = localStorage.getItem("glassy-theme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("light") ? "dark" : "light";
  applyTheme(newTheme);
});

// ========== FAVORITES ==========
function toggleFavorite(id, event) {
  event.stopPropagation();

  if (favorites.includes(id)) {
    favorites = favorites.filter(favId => favId !== id);
  } else {
    favorites.push(id);
  }

  localStorage.setItem("glassy-favorites", JSON.stringify(favorites));
  renderGames();
}

function isFavorite(id) {
  return favorites.includes(id);
}

// ========== LOAD & RENDER ==========
async function loadGames() {
  try {
    const res = await fetch("game.json");
    const data = await res.json();
    allGames = data.games;
    renderGames();
  } catch (err) {
    console.error("Failed to load games:", err);
    gamesGrid.innerHTML = `<p style="color:#f87171; padding: 2rem;">Failed to load games. Make sure game.json is present.</p>`;
  }
}

function renderGames() {
  let filtered = allGames.filter(game => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery) ||
      game.description.toLowerCase().includes(searchQuery);

    if (currentCategory === "favorites") {
      return isFavorite(game.id) && matchesSearch;
    }

    const matchesCategory = currentCategory === "all" || game.category === currentCategory;
    return matchesCategory && matchesSearch;
  });

  gamesGrid.innerHTML = "";

  if (filtered.length === 0) {
    noResults.style.display = "block";
    noResults.innerHTML = currentCategory === "favorites"
      ? `<p>No favorites yet. Click the ❤️ on any game!</p>`
      : `<p>No games found 😢</p>`;
    return;
  }

  noResults.style.display = "none";

  filtered.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card glass-card";

    const favActive = isFavorite(game.id) ? "active" : "";
    const favIcon = isFavorite(game.id) ? "❤️" : "🤍";

    card.innerHTML = `
      <button class="favorite-btn ${favActive}" title="Toggle favorite">${favIcon}</button>
      <div class="game-emoji">${game.emoji}</div>
      <div class="game-title">${game.title}</div>
      <div class="game-desc">${game.description}</div>
      <div class="game-category">${game.category}</div>
    `;

    card.querySelector(".favorite-btn").addEventListener("click", (e) => {
      toggleFavorite(game.id, e);
    });

    card.addEventListener("click", () => openGame(game));
    gamesGrid.appendChild(card);
  });
}

// ========== GAME MODAL ==========
function openGame(game) {
  modalTitle.textContent = game.title;
  gameFrame.src = game.iframeUrl;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeGame() {
  // Exit fullscreen first if active
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }

  modal.classList.remove("active");
  gameFrame.src = "";
  document.body.style.overflow = "";
}

closeModalBtn.addEventListener("click", closeGame);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeGame();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeGame();
});

// ========== FULLSCREEN (FIXED) ==========
fullscreenBtn.addEventListener("click", async () => {
  try {
    // If already in fullscreen → exit
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    // Prefer fullscreen the actual game iframe
    if (gameFrame.requestFullscreen) {
      await gameFrame.requestFullscreen();
    } else if (gameFrame.webkitRequestFullscreen) { // Safari
      await gameFrame.webkitRequestFullscreen();
    } else if (gameFrame.msRequestFullscreen) { // old Edge
      await gameFrame.msRequestFullscreen();
    } else {
      // Fallback: fullscreen the whole modal
      await modalContent.requestFullscreen();
    }
  } catch (err) {
    console.warn("Fullscreen failed on iframe, trying modal instead...", err);
    // Fallback if the game blocks fullscreen (very common with cross-origin games)
    try {
      await modalContent.requestFullscreen();
    } catch (err2) {
      alert("Fullscreen is blocked by this game. Try clicking the game first, then the button again.");
    }
  }
});

// Update button when fullscreen state changes
document.addEventListener("fullscreenchange", () => {
  if (document.fullscreenElement) {
    fullscreenBtn.title = "Exit Fullscreen";
    fullscreenBtn.style.background = "rgba(125, 211, 252, 0.25)";
  } else {
    fullscreenBtn.title = "Fullscreen Game";
    fullscreenBtn.style.background = "";
  }
});

// ========== CATEGORY & SEARCH ==========
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    renderGames();
  });
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderGames();
});

// Start
loadGames();
