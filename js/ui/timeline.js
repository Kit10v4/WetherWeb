const Timeline = (() => {
  let _forecastList = [];
  let _currentIdx = 0;
  let _isPlaying = false;
  let _playTimer = null;
  let _onChangeCb = null;

  function init(forecastList, onChange) {
    destroy();
    _forecastList = Array.isArray(forecastList) ? forecastList : [];
    _onChangeCb = onChange;
    _currentIdx = 0;
    if (_forecastList.length === 0) return;
    _render();
    _setupEvents();
    _update();
  }

  function _render() {
    const panel = document.createElement("div");
    panel.id = "timeline-panel";
    panel.innerHTML = `
      <div id="timeline-inner">
        <div id="timeline-controls">
          <button id="tl-prev" title="Trước 3h">◀</button>
          <button id="tl-play" title="Phát tự động">▶ Play</button>
          <button id="tl-now" title="Thời gian thực">Now</button>
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
  }

  function _togglePlay() {
    _isPlaying = !_isPlaying;
    const btn = document.getElementById("tl-play");
    if (btn) btn.textContent = _isPlaying ? "⏸ Pause" : "▶ Play";

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

    const timeEl = document.getElementById("tl-current-time");
    if (timeEl) {
      const dt = new Date(item.dt * 1000);
      timeEl.textContent = dt.toLocaleString("vi-VN", {
        weekday: "short",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (_onChangeCb) _onChangeCb(item, _currentIdx);
  }

  function destroy() {
    _isPlaying = false;
    clearInterval(_playTimer);
    _playTimer = null;
    document.getElementById("timeline-panel")?.remove();
  }

  return { init, destroy };
})();
