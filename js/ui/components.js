// ================================================================
// FILE: js/ui/components.js
// MÔ TẢ: Các UI component tái sử dụng: Toast, Spinner, Dropdown lịch sử
// ================================================================

const Components = (() => {

  // ── Toast Notification ─────────────────────────────────────────

  let _toastTimer = null;

  /**
   * Hiển thị toast thông báo (slide-in từ góc phải)
   * @param {string} message
   * @param {'error'|'success'|'info'} type
   */
  function showToast(message, type = "info") {
    let toast = document.getElementById("toast");
    if (!toast) return;

    // Reset class cũ
    toast.className = "toast";
    toast.classList.add(`toast--${type}`, "toast--visible");
    toast.querySelector(".toast__message").textContent = message;

    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => {
      toast.classList.remove("toast--visible");
    }, CONFIG.TOAST_DURATION);
  }

  // ── Loading Spinner ────────────────────────────────────────────

  /**
   * Hiện loading spinner và disable nút tìm kiếm
   */
  function showLoading() {
    const btn     = document.getElementById("btn-search");
    const spinner = document.getElementById("search-spinner");
    const icon    = document.getElementById("search-icon");
    if (btn)     btn.disabled = true;
    if (spinner) spinner.classList.remove("hidden");
    if (icon)    icon.classList.add("hidden");
  }

  /**
   * Ẩn loading spinner
   */
  function hideLoading() {
    const btn     = document.getElementById("btn-search");
    const spinner = document.getElementById("search-spinner");
    const icon    = document.getElementById("search-icon");
    if (btn)     btn.disabled = false;
    if (spinner) spinner.classList.add("hidden");
    if (icon)    icon.classList.remove("hidden");
  }

  // ── History Dropdown ───────────────────────────────────────────

  /**
   * Render dropdown lịch sử tìm kiếm
   * @param {string[]} history    - Mảng tên thành phố
   * @param {Function} onSelect   - Callback khi chọn 1 city
   * @param {Function} onRemove   - Callback khi xóa 1 city
   * @param {Function} onClearAll - Callback khi xóa tất cả
   */
  function renderHistoryDropdown(history, onSelect, onRemove, onClearAll) {
    const dropdown = document.getElementById("history-dropdown");
    if (!dropdown) return;

    if (history.length === 0) {
      dropdown.innerHTML = `
        <p class="history-item">Chưa có lịch sử tìm kiếm</p>`;
      dropdown.classList.remove("hidden");
      return;
    }

    const items = history.map(city => {
      const safe = Utils.escapeHtml(city);
      return `
      <div class="history-item">
        <span class="history-city" data-city="${safe}">
          <span class="history-icon">🕐</span> ${safe}
        </span>
        <button class="history-remove" data-city="${safe}" title="Xóa">✕</button>
      </div>`;
    }).join("");

    dropdown.innerHTML = `
      ${items}
      <div class="history-item">
        <button id="btn-clear-all" class="history-remove">
          Xóa tất cả lịch sử
        </button>
      </div>`;
    dropdown.classList.remove("hidden");

    // Sự kiện chọn thành phố
    dropdown.querySelectorAll(".history-city").forEach(el => {
      el.addEventListener("click", () => {
        onSelect(el.dataset.city);
        hideHistoryDropdown();
      });
    });

    // Sự kiện xóa từng mục
    dropdown.querySelectorAll(".history-remove").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        onRemove(btn.dataset.city);
      });
    });

    // Sự kiện xóa tất cả
    const clearAllBtn = dropdown.querySelector("#btn-clear-all");
    if (clearAllBtn) clearAllBtn.addEventListener("click", onClearAll);
  }

  /**
   * Ẩn dropdown lịch sử
   */
  function hideHistoryDropdown() {
    const dropdown = document.getElementById("history-dropdown");
    if (dropdown) dropdown.classList.add("hidden");
  }

  return {
    showToast,
    showLoading,
    hideLoading,
    renderHistoryDropdown,
    hideHistoryDropdown,
  };
})();
