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

  // ── Search Input Validation ────────────────────────────────────

  /**
   * Hiện thông báo lỗi validation dưới ô input
   * @param {string} message
   */
  function showInputError(message) {
    const el = document.getElementById("search-error");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  /**
   * Xóa thông báo lỗi validation
   */
  function clearInputError() {
    const el = document.getElementById("search-error");
    if (!el) return;
    el.textContent = "";
    el.classList.add("hidden");
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
        <p class="px-4 py-3 text-sm text-gray-400">Chưa có lịch sử tìm kiếm</p>`;
      dropdown.classList.remove("hidden");
      return;
    }

    const items = history.map(city => `
      <div class="history-item flex items-center justify-between px-4 py-2 hover:bg-blue-50 cursor-pointer group">
        <span class="history-city text-sm text-gray-700 flex-1 truncate" data-city="${city}">
          <i class="history-icon mr-2 text-gray-400">🕐</i>${city}
        </span>
        <button class="history-remove text-gray-300 hover:text-red-400 ml-2 text-xs px-1"
                data-city="${city}" title="Xóa">✕</button>
      </div>`).join("");

    dropdown.innerHTML = `
      ${items}
      <div class="border-t border-gray-100 px-4 py-2">
        <button id="btn-clear-all"
                class="text-xs text-red-400 hover:text-red-600 hover:underline">
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

  // ── Error State (toàn màn hình kết quả) ───────────────────────

  /**
   * Hiện thông báo lỗi lớn trong khu vực kết quả
   * @param {string} statusCode - '404', '401', 'network', ...
   */
  function showResultError(statusCode) {
    const section = document.getElementById("result-section");
    if (!section) return;

    const messages = {
      "404":     { icon: "🔍", title: "Không tìm thấy thành phố", sub: "Kiểm tra lại chính tả hoặc thử tên tiếng Anh (VD: Ho Chi Minh City)" },
      "401":     { icon: "🔑", title: "API key không hợp lệ",     sub: "Kiểm tra lại config.js — API key đúng chưa và đã kích hoạt chưa?" },
      "429":     { icon: "⏱",  title: "Quá nhiều yêu cầu",        sub: "Vui lòng chờ vài phút rồi thử lại" },
      "network": { icon: "📡", title: "Lỗi kết nối mạng",         sub: "Kiểm tra kết nối internet của bạn rồi thử lại" },
      "default": { icon: "⚠️", title: "Đã xảy ra lỗi",            sub: "Vui lòng thử lại sau ít phút" },
    };

    const m = messages[statusCode] || messages["default"];
    section.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 text-center">
        <div class="text-6xl mb-4">${m.icon}</div>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">${m.title}</h3>
        <p class="text-gray-400 text-sm max-w-xs">${m.sub}</p>
      </div>`;
    section.classList.remove("hidden");
  }

  return {
    showToast,
    showLoading,
    hideLoading,
    showInputError,
    clearInputError,
    renderHistoryDropdown,
    hideHistoryDropdown,
    showResultError,
  };
})();
