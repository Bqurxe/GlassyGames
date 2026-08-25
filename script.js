let allGames = [];
let currentCategory = "all";
let searchQuery = "";

const gamesGrid = document.getElementById("gamesGrid");
const noResults = document.getElementById("noResults");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("gameModal");
const gameFrame = document.getElementById("gameFrame");
const modalTitle = document.getElementById("modalTitle");
const closeModal = document.getElementById("closeModal");

// Load games
async function loadGames() {
  try {
    const res = await fetch("game.json");
    const data = await res.json();
    allGames = data.games;
    renderGames();
  } catch (err) {
    console.error("Failed to load games:", err);
    gamesGrid.innerHTML = `<p style="color:#f87171;">Failed to load games. Make sure game.json is in the same folder.</p>`;
  }
}

// Render filtered games
function renderGames() {
  const filtered = allGames.filter(game => {
    const matchesCategory = currentCategory === "all" || game.category === currentCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery) ||
                          game.description.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  gamesGrid.innerHTML = "";

  if (filtered.length === 0) {
    noResults.style.display = "block";
    return;
  }

  noResults.style.display = "none";

  filtered.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card glass-card";
    card.innerHTML = `
      <div class="game-emoji">${game.emoji}</div>
      <div class="game-title">${game.title}</div>
      <div class="game-desc">${game.description}</div>
      <div class="game-category">${game.category}</div>
    `;
    card.addEventListener("click", () => openGame(game));
    gamesGrid.appendChild(card);
  });
}

// Open game in modal
function openGame(game) {
  modalTitle.textContent = game.title;
  gameFrame.src = game.iframeUrl;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Close modal
function closeGame() {
  modal.classList.remove("active");
  gameFrame.src = "";
  document.body.style.overflow = "";
}

closeModal.addEventListener("click", closeGame);

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeGame();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeGame();
});

// Category buttons
document.querySelectorAll(".cat-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.category;
    renderGames();
  });
});

// Search
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderGames();
});

// Start
loadGames();
