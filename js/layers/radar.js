const RadarLayer = (() => {
  let _layers = [];
  let _currentTs = 0;
  let _animTimer = null;
  let _isPlaying = false;
  let _map = null;

  function _getTimestamps() {
    const now = Math.floor(Date.now() / 1000);
    const step = 600;
    const frames = [];
    for (let i = 4; i >= 0; i -= 1) {
      frames.push(Math.floor(now / step - i) * step);
    }
    return frames;
  }

  function init(map) {
    _map = map;
    stop();
    _layers = [];
    const timestamps = _getTimestamps();
    timestamps.forEach(ts => {
      const layer = L.tileLayer(`/api/map-tile?layer=precipitation_new&z={z}&x={x}&y={y}&ts=${ts}`, {
        opacity: 0,
        attribution: "© OWM",
      });
      _layers.push({ layer, ts });
    });
  }

  function play() {
    if (_isPlaying || !_map || _layers.length === 0) return;
    _isPlaying = true;
    _currentTs = 0;
    _animTimer = setInterval(_nextFrame, 500);
  }

  function _nextFrame() {
    _layers.forEach(({ layer }) => {
      if (_map.hasLayer(layer)) _map.removeLayer(layer);
    });
    const current = _layers[_currentTs];
    if (current) {
      current.layer.addTo(_map);
      current.layer.setOpacity(0.7);
    }
    _currentTs = (_currentTs + 1) % _layers.length;
  }

  function stop() {
    _isPlaying = false;
    clearInterval(_animTimer);
    _animTimer = null;
    if (_map) {
      _layers.forEach(({ layer }) => {
        if (_map.hasLayer(layer)) _map.removeLayer(layer);
      });
    }
  }

  return { init, play, stop };
})();
