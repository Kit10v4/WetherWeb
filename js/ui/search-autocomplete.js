const SearchAutocomplete = (() => {
  let _debounceTimer = null;

  function init(inputEl, onSelect) {
    if (!inputEl) return;
    inputEl.addEventListener("input", () => {
      clearTimeout(_debounceTimer);
      const q = inputEl.value.trim();
      if (q.length < 2) {
        _hideDropdown();
        return;
      }
      _debounceTimer = setTimeout(() => _fetchSuggestions(q, onSelect), 300);
    });
  }

  async function _fetchSuggestions(q, onSelect) {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=5`);
      if (!res.ok) {
        _hideDropdown();
        return;
      }
      const data = await res.json();
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

    dropdown.innerHTML = results.map(r => `
      <div class="autocomplete-item history-item" data-lat="${r.lat}" data-lon="${r.lon}" data-name="${r.name}">
        <span class="ac-flag">${_getFlagEmoji(r.country)}</span>
        <div class="ac-info">
          <span class="ac-name">${r.name}</span>
          <span class="ac-country">${r.state ? `${r.state}, ` : ""}${r.country}</span>
        </div>
      </div>
    `).join("");

    dropdown.querySelectorAll(".autocomplete-item").forEach(el => {
      el.addEventListener("click", () => {
        onSelect({
          name: el.dataset.name,
          lat: parseFloat(el.dataset.lat),
          lon: parseFloat(el.dataset.lon),
        });
        _hideDropdown();
      });
    });
    dropdown.classList.remove("hidden");
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
  }

  return { init };
})();
