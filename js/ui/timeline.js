const Timeline = (() => {
  let _forecastList = [];
  let _currentIdx = 0;
  let _isPlaying = false;
  let _playTimer = null;
  let _onChangeCb = null;
  let _tlCollapsed = false;

  function init(forecastList, onChange) {
    destroy();
    _forecastList = Array.isArray(forecastList) ? forecastList : [];
    _onChangeCb = onChange;
    _currentIdx = 0;
    _tlCollapsed = false;
    if (_forecastList.length === 0) return;
    _render();
    _setupEvents();
    _update();
  }

  function _render() {
    const existing = document.getElementById("timeline-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "timeline-panel";
    panel.innerHTML = `
      <div id="tl-header">
        <span id="tl-title">⏱ Dự báo theo giờ</span>
        <div id="tl-header-actions">
          <span id="tl-current-time-mini" class="tl-time-mini"></span>
          <button id="tl-collapse-btn" title="Thu gọn">▼</button>
        </div>
      </div>

      <div id="tl-body">
        <div id="timeline-controls">
          <button id="tl-prev" title="Trước 3h">◀</button>
          <button id="tl-play" title="Phát tự động">▶ Play</button>
          <button id="tl-now" title="Hiện tại">Now</button>
          <button id="tl-next" title="Sau 3h">▶</button>
        </div>

        <div id="timeline-slider-wrap">
          <input type="range" id="tl-slider" min="0" max="${_forecastList.length - 1}" value="0" step="1" />
          <div id="tl-labels"></div>
        </div>

        <div id="tl-current-time"></div>
      </div>
    `;

    document.body.appendChild(panel);
    _renderLabels();
    _setupCollapseBtn();
  }

  function _setupCollapseBtn() {
    document.getElementById("tl-collapse-btn")?.addEventListener("click", () => {
      _tlCollapsed = !_tlCollapsed;
      const panel = document.getElementById("timeline-panel");
      const btn = document.getElementById("tl-collapse-btn");
      const inner = document.getElementById("tl-body");
      if (!panel || !inner) return;

      if (_tlCollapsed) {
        inner.style.display = "none";
        panel.classList.add("timeline--collapsed");
        if (btn) {
          btn.textContent = "▲";
          btn.title = "Mở rộng timeline";
        }
        const mini = document.getElementById("tl-current-time-mini");
        const item = _forecastList[_currentIdx];
        if (mini && item) {
          const dt = new Date(item.dt * 1000);
          mini.textContent = dt.toLocaleString("vi-VN", {
            weekday: "short",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      } else {
        inner.style.display = "";
        panel.classList.remove("timeline--collapsed");
        if (btn) {
          btn.textContent = "▼";
          btn.title = "Thu gọn timeline";
        }
        const mini = document.getElementById("tl-current-time-mini");
        if (mini) mini.textContent = "";
      }

      setTimeout(() => {
        WeatherMap.invalidateSize();
        PanelManager.checkFAB();
      }, 350);
    });
  }

  function _renderLabels() {
    const labelsEl = document.getElementById("tl-labels");
    if (!labelsEl) return;
    const days = ["Hôm nay", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5"];
    labelsEl.innerHTML = days.map((d, i) => `<span style="left:${(i / 4) * 100}%">${d}</span>`).join("");
  }

  function _setupEvents() {
    document.getElementById("tl-slider")?.addEventListener("input", e => {
      _currentIdx = parseInt(e.target.value, 10);
      _update();
    });
    document.getElementById("tl-prev")?.addEventListener("click", () => {
      if (_currentIdx > 0) {
        _currentIdx -= 1;
        _update();
      }
    });
    document.getElementById("tl-next")?.addEventListener("click", () => {
      if (_currentIdx < _forecastList.length - 1) {
        _currentIdx += 1;
        _update();
      }
    });
    document.getElementById("tl-now")?.addEventListener("click", () => {
      _currentIdx = 0;
      _update();
    });
    document.getElementById("tl-play")?.addEventListener("click", _togglePlay);
    document.getElementById("tl-header")?.addEventListener("click", e => {
      if (e.target.closest("button")) return;
      document.getElementById("tl-collapse-btn")?.click();
    });
  }

  function _togglePlay() {
    _isPlaying = !_isPlaying;
    const btn = document.getElementById("tl-play");
    if (btn) {
      btn.textContent = _isPlaying ? "⏸ Pause" : "▶ Play";
      btn.classList.toggle("playing", _isPlaying);
    }

    if (_isPlaying) {
      _playTimer = setInterval(() => {
        if (_currentIdx >= _forecastList.length - 1) _currentIdx = 0;
        else _currentIdx += 1;
        _update();
      }, 600);
      return;
    }

    clearInterval(_playTimer);
    _playTimer = null;
  }

  function _update() {
    const slider = document.getElementById("tl-slider");
    if (slider) slider.value = _currentIdx;
    const item = _forecastList[_currentIdx];
    if (!item) return;

    const dt = new Date(item.dt * 1000);
    const formatted = dt.toLocaleString("vi-VN", {
      weekday: "short",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    const timeEl = document.getElementById("tl-current-time");
    if (timeEl) timeEl.textContent = formatted;

    const mini = document.getElementById("tl-current-time-mini");
    if (mini && _tlCollapsed) mini.textContent = formatted;

    if (_onChangeCb) _onChangeCb(item, _currentIdx);
  }

  function expandFromFab() {
    const panel = document.getElementById("timeline-panel");
    if (!panel) return;
    if (panel.classList.contains("timeline--collapsed")) {
      document.getElementById("tl-collapse-btn")?.click();
    }
  }

  function destroy() {
    _isPlaying = false;
    _tlCollapsed = false;
    clearInterval(_playTimer);
    _playTimer = null;
    document.getElementById("timeline-panel")?.remove();
    PanelManager.checkFAB();
  }

  return { init, destroy, expandFromFab };
})();
