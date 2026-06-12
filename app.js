// ======================================
// GOOD EARTH APP (FINAL)
// ======================================

const APP = { refreshInterval: null, initialized: false };

document.addEventListener("DOMContentLoaded", async () => { await initializeApp(); });

async function initializeApp() {
  if(APP.initialized) return;
  APP.initialized = true;
  initializeDate();
  initializeNavigation();
  initializeModals();
  initializeSettings();
  initializePullToRefresh();
  startBackgroundRefresh();
  await loadDashboard();
  lucide.createIcons();
}

function initializeDate() {
  const today = document.getElementById("todayDate");
  if(!today) return;
  today.innerText = new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

function initializeNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      openPage(item.dataset.page);
    });
  });
}

function openPage(pageId) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  const page = document.getElementById(pageId);
  if(page) page.classList.add("active");
  if(pageId === "roomsPage" && typeof loadRoomsPage === "function") loadRoomsPage();
}

function initializeModals() {
  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.dataset.close));
  });
}

function openModal(id) { document.getElementById(id)?.classList.add("active"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("active"); }

function initializeSettings() {
  const appScript = document.getElementById("settingsAppScript");
  const upi = document.getElementById("settingsUpi");
  const owner = document.getElementById("settingsOwnerPhone");
  const place = document.getElementById("settingsPlaceId");
  if(appScript) appScript.value = CONFIG.APPS_SCRIPT_URL;
  if(upi) upi.value = CONFIG.UPI_ID;
  if(owner) owner.value = CONFIG.OWNER_PHONE;
  if(place) place.value = CONFIG.PLACE_ID;
}

function saveSettings() {
  CONFIG.APPS_SCRIPT_URL = document.getElementById("settingsAppScript").value.trim();
  CONFIG.UPI_ID = document.getElementById("settingsUpi").value.trim();
  CONFIG.OWNER_PHONE = document.getElementById("settingsOwnerPhone").value.trim();
  CONFIG.PLACE_ID = document.getElementById("settingsPlaceId").value.trim();
  saveConfig();
  showToast("Settings Saved");
}

function startBackgroundRefresh() {
  APP.refreshInterval = setInterval(async () => { await loadDashboard(); }, 30000);
}

async function refreshEverything() {
  showLoading();
  await loadDashboard();
  if(typeof loadAvailableRooms === "function") await loadAvailableRooms();
  hideLoading();
  showToast("Updated");
}

function showLoading() { document.getElementById("globalLoader")?.classList.add("active"); }
function hideLoading() { document.getElementById("globalLoader")?.classList.remove("active"); }

function initializePullToRefresh() {
  let startY = 0;
  document.addEventListener("touchstart", e => { startY = e.touches[0].clientY; });
  document.addEventListener("touchend", e => {
    const endY = e.changedTouches[0].clientY;
    if(startY < 80 && endY - startY > 120) refreshEverything();
  });
}

window.addEventListener("offline", () => showToast("No Internet"));
window.addEventListener("online", () => { showToast("Connected"); refreshEverything(); });

function formatMoney(amount) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits:0 }).format(Number(amount || 0)); }
function confirmAction(message) { return confirm(message); }
function vibrate() { if(navigator.vibrate) navigator.vibrate(20); }

async function loadRoomsPage() {
  const rooms = await getRooms();
  const container = document.getElementById("roomsList");
  if(!container) return;
  container.innerHTML = "";
  if(rooms && rooms.length) {
    rooms.forEach(room => {
      const div = document.createElement("div");
      div.className = "room-card";
      div.innerHTML = `<div class="room-name">${room.room_name}</div><div class="room-status">-</div>`;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = "<div>No rooms data</div>";
  }
}
