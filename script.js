// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let allRecipes = [];
let favoriteRecipes = JSON.parse(localStorage.getItem("favorites_recipe_skl2")) || [];
let isShowingFavoritesOnly = false;

// ==========================================
// 2. DOM SELECTION (Sesuai ID di index.html)
// ==========================================
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const cuisineFilter = document.querySelector("#cuisine-filter");
const difficultyFilter = document.querySelector("#difficulty-filter");
const resetFilterBtn = document.querySelector("#reset-filter-button");

const favoriteButton = document.querySelector("#favorite-button");
const favoriteCountText = document.querySelector("#favorite-count");

const sectionTitle = document.querySelector("#section-title");
const recipeCountText = document.querySelector("#recipe-count");

const loadingState = document.querySelector("#loading-state");
const errorState = document.querySelector("#error-state");
const emptyState = document.querySelector("#empty-state");
const recipeGrid = document.querySelector("#recipe-grid");

const recipeDialog = document.querySelector("#recipe-dialog");
const closeDialogBtn = document.querySelector("#close-dialog");
const dialogContent = document.querySelector("#dialog-content");

// ==========================================
// 3. FETCH DATA DARI API
// ==========================================
async function fetchRecipes() {
    showState("loading");

    try {
        const response = await fetch("https://dummyjson.com/recipes?limit=50");
        if (!response.ok) throw new Error("Gagal mengambil data dari API");

        const data = await response.json();
        allRecipes = data.recipes;

        populateCuisines();
        updateFavoriteCountBadge();
        applyFiltersAndRender();

    } catch (error) {
        console.error("Fetch Error:", error);
        showState("error");
    }
}

// ==========================================
// 4. POPULATE DROPDOWN CUISINE
// ==========================================
function populateCuisines() {
    const cuisines = Array.from(new Set(allRecipes.map(r => r.cuisine))).sort();
    
    cuisines.forEach(cuisine => {
        const option = document.createElement("option");
        option.value = cuisine;
        option.textContent = cuisine;
        cuisineFilter.appendChild(option);
    });
}

// ==========================================
// 5. FILTER & RENDER LOGICAL
// ==========================================
function applyFiltersAndRender() {
    const keyword = searchInput.value.trim().toLowerCase();
    const selectedCuisine = cuisineFilter.value;
    const selectedDifficulty = difficultyFilter.value;

    // Cek apakah ada filter aktif untuk menampilkan tombol reset
    const isFilterActive = keyword !== "" || selectedCuisine !== "" || selectedDifficulty !== "" || isShowingFavoritesOnly;
    resetFilterBtn.hidden = !isFilterActive;

    // Proses filter array
    let filtered = allRecipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(keyword);
        const matchesCuisine = selectedCuisine === "" || recipe.cuisine === selectedCuisine;
        const matchesDifficulty = selectedDifficulty === "" || recipe.difficulty === selectedDifficulty;
        const matchesFavorite = !isShowingFavoritesOnly || isFavorite(recipe.id);

        return matchesSearch && matchesCuisine && matchesDifficulty && matchesFavorite;
    });

    if (filtered.length === 0) {
        showState("empty");
        recipeCountText.textContent = "0 recipes";
    } else {
        showState("content");
        renderGrid(filtered);
        recipeCountText.textContent = `${filtered.length} recipe${filtered.length > 1 ? 's' : ''}`;
    }
}

function renderGrid(recipes) {
    recipeGrid.innerHTML = "";

    recipes.forEach(recipe => {
        const favStatus = isFavorite(recipe.id);
        const card = document.createElement("article");
        
        // Memakai class resmi dari CSS starter
        card.className = "recipe-card";

        // Menggunakan tag img standar tanpa wrapper tambahan agar tidak terpotong CSS starter
        card.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" loading="lazy">
            <div class="recipe-content">
                <div class="recipe-header">
                    <button type="button" class="favorite-btn ${favStatus ? 'is-favorite' : ''}" onclick="toggleFavorite(${recipe.id})" aria-label="Favorite">
                        ${favStatus ? '❤️' : '🤍'}
                    </button>
                    <span class="recipe-cuisine">${recipe.cuisine} • ${recipe.difficulty}</span>
                </div>
                <h3 class="recipe-title">${recipe.name}</h3>
                <div class="recipe-meta">
                    <span>⏱️ ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} mins</span>
                    <span>⭐ ${recipe.rating}</span>
                </div>
                <button type="button" class="view-recipe-button" onclick="openDetailModal(${recipe.id})">View Recipe</button>
            </div>
        `;

        recipeGrid.appendChild(card);
    });
}

// Helper State Display Manager
function showState(state) {
    loadingState.hidden = state !== "loading";
    errorState.hidden = state !== "error";
    emptyState.hidden = state !== "empty";
    recipeGrid.hidden = state !== "content";
}

// ==========================================
// 6. FAVORITE LOGIC & LOCALSTORAGE
// ==========================================
function isFavorite(id) {
    return favoriteRecipes.some(r => r.id === id);
}

function toggleFavorite(id) {
    const recipe = allRecipes.find(r => r.id === id);
    if (!recipe) return;

    if (isFavorite(id)) {
        favoriteRecipes = favoriteRecipes.filter(r => r.id !== id);
    } else {
        favoriteRecipes.push(recipe);
    }

    localStorage.setItem("favorites_recipe_skl2", JSON.stringify(favoriteRecipes));
    updateFavoriteCountBadge();
    applyFiltersAndRender();
}

function updateFavoriteCountBadge() {
    favoriteCountText.textContent = favoriteRecipes.length;
}

// Toggle Mode Tampilan Favorit
favoriteButton.addEventListener("click", () => {
    isShowingFavoritesOnly = !isShowingFavoritesOnly;

    if (isShowingFavoritesOnly) {
        favoriteButton.classList.add("active");
        sectionTitle.textContent = "Favorite Recipes";
    } else {
        favoriteButton.classList.remove("active");
        sectionTitle.textContent = "Explore Recipes";
    }

    applyFiltersAndRender();
});

// Reset Filter Button
resetFilterBtn.addEventListener("click", () => {
    searchInput.value = "";
    cuisineFilter.value = "";
    difficultyFilter.value = "";
    isShowingFavoritesOnly = false;
    favoriteButton.classList.remove("active");
    sectionTitle.textContent = "Explore Recipes";
    
    applyFiltersAndRender();
});

// ==========================================
// 7. DIALOG / MODAL DETAIL RECIPE
// ==========================================
function openDetailModal(id) {
    const recipe = allRecipes.find(r => r.id === id);
    if (!recipe) return;

    dialogContent.innerHTML = `
        <div class="modal-header">
            <h2>${recipe.name}</h2>
            <p class="modal-subtitle">${recipe.cuisine} Cuisine | Difficulty: ${recipe.difficulty} | Servings: ${recipe.servings}</p>
        </div>
        <img src="${recipe.image}" alt="${recipe.name}" class="modal-img">
        
        <div class="modal-section">
            <h3>🛒 Ingredients:</h3>
            <ul>
                ${recipe.ingredients.map(item => `<li>${item}</li>`).join("")}
            </ul>
        </div>

        <div class="modal-section">
            <h3>👩‍🍳 Instructions:</h3>
            <ol>
                ${recipe.instructions.map(step => `<li>${step}</li>`).join("")}
            </ol>
        </div>
    `;

    recipeDialog.showModal();
}

closeDialogBtn.addEventListener("click", () => recipeDialog.close());

// Close modal saat klik di luar kotak modal
recipeDialog.addEventListener("click", (e) => {
    const rect = recipeDialog.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
        recipeDialog.close();
    }
});

// ==========================================
// 8. EVENT LISTENERS
// ==========================================
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyFiltersAndRender();
});

searchInput.addEventListener("input", applyFiltersAndRender);
cuisineFilter.addEventListener("change", applyFiltersAndRender);
difficultyFilter.addEventListener("change", applyFiltersAndRender);

// Inisialisasi Pertama
document.addEventListener("DOMContentLoaded", fetchRecipes);