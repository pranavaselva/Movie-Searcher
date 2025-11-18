// Configure your TMDb API key here (get one at https://developers.themoviedb.org/3/getting-started/introduction)
const TMDB_API_KEY = "0f72067dfa0f88ff84f497bbeac1995d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// Small contract
// - Input: search query string
// - Output: list of movie objects from OMDb for rendering
// - Error: network or API-level errors are shown in UI

const refs = {
  search: document.getElementById("search"),
  results: document.getElementById("results"),
  status: document.getElementById("status"),
  modal: document.getElementById("modal"),
  modalContent: document.getElementById("modalContent"),
  modalClose: document.getElementById("modalClose"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  clearBtn: document.getElementById("clearBtn"),
};

let currentQuery = "";
let currentPage = 1;
let totalResults = 0;

function showStatus(message, withSpinner = false) {
  refs.status.innerHTML = withSpinner
    ? `<span class="spinner"></span> ${message}`
    : message;
}

function clearStatus() {
  refs.status.textContent = "";
}

function showError(message) {
  refs.status.innerHTML = `<span style="color:#ff8b8b">${message}</span>`;
}

function debounce(fn, delay = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

async function fetchMovies(query, page = 1) {
  if (!query || query.trim().length === 0) {
    refs.results.innerHTML = "";
    clearStatus();
    return;
  }
  if (!TMDB_API_KEY || TMDB_API_KEY === '0f72067dfa0f88ff84f497bbeac1995d') {
    showError('Please set your TMDb API key in script.js (see README).');
    return;
  }

  showStatus("Searching...", true);
  refs.results.innerHTML = "";

  const url = `${BASE_URL}/search/movie?api_key=${encodeURIComponent(
    TMDB_API_KEY
  )}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.Response === "False") {
      showError(data.Error || "No results");
      return;
    }
    totalResults = parseInt(data.total_results || "0", 10) || 0;
    renderResults(data.results || []);
    clearStatus();
  } catch (err) {
    showError("Network error. Try again.");
    console.error(err);
  }
}

function renderResults(items) {
  if (!items || items.length === 0) {
    refs.results.innerHTML =
      '<p style="grid-column: 1/-1; text-align:center; color:var(--muted)">No movies found.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const m of items) {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "poster";
    img.alt = `${m.title} poster`;
    img.src = m.poster_path
      ? `${IMAGE_BASE}${m.poster_path}`
      : "https://via.placeholder.com/400x600?text=No+Image";

    const meta = document.createElement("div");
    meta.className = "meta";
    const title = document.createElement("h3");
    title.className = "movie-title";
    title.textContent = m.title || m.original_title || "Untitled";
    const sub = document.createElement("div");
    sub.className = "movie-sub";
    const year = m.release_date ? m.release_date.slice(0, 4) : "—";
    sub.textContent = `${year} • movie`;

    meta.appendChild(title);
    meta.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "card-actions";
    const detailsBtn = document.createElement("button");
    detailsBtn.className = "secondary-btn";
    detailsBtn.textContent = "View details";
    // TMDb uses numeric movie id
    detailsBtn.addEventListener("click", () => openDetails(m.id));

    actions.appendChild(detailsBtn);

    card.appendChild(img);
    card.appendChild(meta);
    card.appendChild(actions);

    fragment.appendChild(card);
  }

  refs.results.appendChild(fragment);
}

async function openDetails(movieId) {
  if (!movieId) return;
  refs.modal.setAttribute("aria-hidden", "false");
  refs.modalContent.innerHTML =
    '<div class="modal-body"><p class="modal-loading"><span class="spinner"></span> Loading...</p></div>';
  try {
    const url = `${BASE_URL}/movie/${encodeURIComponent(
      movieId
    )}?api_key=${encodeURIComponent(
      TMDB_API_KEY
    )}&append_to_response=external_ids`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status_code && data.status_message) {
      refs.modalContent.innerHTML = `<div class="modal-body"><p>${
        data.status_message || "Could not load details"
      }</p></div>`;
      return;
    }

    renderModal(data);
  } catch (err) {
    refs.modalContent.innerHTML = `<div class="modal-body"><p>Network error.</p></div>`;
    console.error(err);
  }
}

function renderModal(data) {
  const poster = data.poster_path
    ? `${IMAGE_BASE}${data.poster_path}`
    : "https://via.placeholder.com/400x600?text=No+Image";
  const genres = Array.isArray(data.genres)
    ? data.genres.map((g) => g.name).join(", ")
    : "—";
  const runtime = data.runtime ? `${data.runtime} min` : "—";
  const imdbId =
    data.external_ids && data.external_ids.imdb_id
      ? data.external_ids.imdb_id
      : null;
  refs.modalContent.innerHTML = `
    <img src="${poster}" alt="${data.title} poster" />
    <div class="modal-body">
      <h2 id="modalTitle">${data.title} (${
    data.release_date ? data.release_date.slice(0, 4) : "—"
  })</h2>
      <div class="detail-row"><strong>Genre: </strong>${genres}</div>
      <div class="detail-row"><strong>Runtime: </strong>${runtime}</div>
      <div class="detail-row"><strong>Homepage: </strong>${
        data.homepage
          ? `<a href="${data.homepage}" target="_blank" rel="noopener">${data.homepage}</a>`
          : "—"
      }</div>
      <div class="detail-row"><strong>TMDb Rating: </strong>${
        data.vote_average || "—"
      } (${data.vote_count || 0} votes)</div>
      <div class="detail-row"><strong>Overview:</strong><p style="color:var(--muted); margin:6px 0">${
        data.overview || "—"
      }</p></div>
      <div class="detail-row">${
        imdbId
          ? `<a href="https://www.imdb.com/title/${imdbId}" target="_blank" rel="noopener" class="secondary-btn">Open on IMDB</a>`
          : ""
      }</div>
    </div>
  `;
}

function closeModal() {
  refs.modal.setAttribute("aria-hidden", "true");
  refs.modalContent.innerHTML = "";
}

// Event wiring
refs.modalClose.addEventListener("click", closeModal);
refs.modalBackdrop.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

refs.clearBtn.addEventListener("click", () => {
  refs.search.value = "";
  refs.results.innerHTML = "";
  clearStatus();
  refs.search.focus();
});

const debouncedSearch = debounce((ev) => {
  const q = ev.target.value.trim();
  currentQuery = q;
  currentPage = 1;
  if (!q) {
    refs.results.innerHTML = "";
    clearStatus();
    return;
  }
  fetchMovies(q, 1);
}, 450);

refs.search.addEventListener("input", debouncedSearch);

// Small UX: submit on Enter
refs.search.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const q = refs.search.value.trim();
    if (q) fetchMovies(q, 1);
  }
});

// Initial focus
refs.search.focus();
