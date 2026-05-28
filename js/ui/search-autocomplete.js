const SearchAutocomplete = (() => {
  let _debounceTimer = null;
  let _results = [];
  let _activeIndex = -1;
  let _inputEl = null;
  let _onSelectCb = null;
  let _queryToken = 0;

  function init(inputEl, onSelect) {
    if (!inputEl) return;
    _inputEl = inputEl;
    _onSelectCb = onSelect;
    inputEl.setAttribute("role", "combobox");
    inputEl.setAttribute("aria-autocomplete", "list");
    inputEl.setAttribute("aria-expanded", "false");
    inputEl.setAttribute("aria-controls", "history-dropdown");
    inputEl.addEventListener("input", () => {
      clearTimeout(_debounceTimer);
      const q = inputEl.value.trim();
      if (q.length < 2) {
        _hideDropdown();
        return;
      }
      _debounceTimer = setTimeout(() => _fetchSuggestions(q, onSelect), 300);
    });
    inputEl.addEventListener("keydown", _onKeyDown);
  }

  async function _fetchSuggestions(q, onSelect) {
    const token = ++_queryToken;
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=5`);
      if (!res.ok) {
        _hideDropdown();
        return;
      }
      const data = await res.json();
      if (token !== _queryToken) return;
      _results = data;
      _activeIndex = -1;
      _renderDropdown(data, onSelect);
    } catch {
      _hideDropdown();
    }
  }

  function _renderDropdown(results, onSelect) {
    const dropdown = document.getElementById("history-dropdown");
    if (!dropdown || !Array.isArray(results) || results.length === 0) {
      _hideDropdown();
      return;
    }

    dropdown.innerHTML = results.map(r => {
      const name = Utils.escapeHtml(r.name);
      const state = Utils.escapeHtml(r.state);
      const country = Utils.escapeHtml(r.country);
      return `
      <div class="autocomplete-item history-item" role="option" tabindex="-1" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${name}">
        <span class="ac-flag">${_getFlagEmoji(r.country)}</span>
        <div class="ac-info">
          <span class="ac-name">${name}</span>
          <span class="ac-country">${r.state ? `${state}, ` : ""}${country}</span>
        </div>
      </div>
    `;
    }).join("");

    dropdown.querySelectorAll(".autocomplete-item").forEach(el => {
      el.addEventListener("click", () => {
        _selectByElement(el, onSelect);
        _hideDropdown();
      });
    });
    dropdown.classList.remove("hidden");
    dropdown.setAttribute("role", "listbox");
    _inputEl?.setAttribute("aria-expanded", "true");
  }

  function _selectByElement(el, onSelect) {
    onSelect({
      name: el.dataset.name,
      lat: parseFloat(el.dataset.lat),
      lon: parseFloat(el.dataset.lon),
    });
  }

  function _onKeyDown(e) {
    const dropdown = document.getElementById("history-dropdown");
    const items = dropdown?.querySelectorAll(".autocomplete-item");
    if (!items || items.length === 0 || dropdown.classList.contains("hidden")) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      _activeIndex = (_activeIndex + 1) % items.length;
      _updateActive(items);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      _activeIndex = _activeIndex <= 0 ? items.length - 1 : _activeIndex - 1;
      _updateActive(items);
      return;
    }
    if (e.key === "Enter" && _activeIndex >= 0) {
      e.preventDefault();
      _selectByElement(items[_activeIndex], _onSelectCb);
      _hideDropdown();
      return;
    }
    if (e.key === "Escape") {
      _hideDropdown();
    }
  }

  function _updateActive(items) {
    items.forEach((el, idx) => {
      el.classList.toggle("is-active", idx === _activeIndex);
      el.setAttribute("aria-selected", idx === _activeIndex ? "true" : "false");
      if (idx === _activeIndex) el.scrollIntoView({ block: "nearest" });
    });
  }

  function _getFlagEmoji(countryCode = "") {
    return String(countryCode)
      .toUpperCase()
      .split("")
      .map(c => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join("");
  }

  function _hideDropdown() {
    document.getElementById("history-dropdown")?.classList.add("hidden");
    _inputEl?.setAttribute("aria-expanded", "false");
    _activeIndex = -1;
  }

  return { init };
})();
