// ================================================================
// FILE: js/chart.js
// MÔ TẢ: Vẽ biểu đồ nhiệt độ 5 ngày bằng HTML5 Canvas API
// ================================================================

const Chart = (() => {

  function _getColors() {
    const dark = document.documentElement.getAttribute("data-theme") !== "light";
    return dark
      ? {
          line: "#38bdf8",
          gradientTop: "rgba(56,189,248,0.35)",
          gradientBot: "rgba(56,189,248,0.01)",
          point: "#bae6fd",
          text: "#e8edf3",
          subText: "rgba(232,237,243,0.62)",
          grid: "rgba(255,255,255,0.12)",
        }
      : {
          line: "#0099CC",
          gradientTop: "rgba(0,153,204,0.35)",
          gradientBot: "rgba(0,153,204,0.01)",
          point: "#1A3A5C",
          text: "#1A1A1A",
          subText: "#888888",
          grid: "rgba(0,0,0,0.07)",
        };
  }

  const PADDING = { top: 50, right: 30, bottom: 55, left: 48 };
  let _animFrame = null;

  /**
   * Vẽ biểu đồ đường nhiệt độ
   * @param {string}   canvasId  - id của thẻ <canvas>
   * @param {Array}    forecast  - Mảng 5 phần tử đã lọc từ filterDailyForecast()
   * @param {string}   unit      - 'C' hoặc 'F'
   */
  function draw(canvasId, forecast, unit = "C") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !forecast || forecast.length === 0) return;

    // Responsive: khớp chiều rộng với container
    canvas.width  = canvas.parentElement.offsetWidth || 600;
    canvas.height = 220;

    const ctx  = canvas.getContext("2d");
    const W    = canvas.width;
    const H    = canvas.height;
    const plotW = W - PADDING.left - PADDING.right;
    const plotH = H - PADDING.top  - PADDING.bottom;

    // Lấy mảng nhiệt độ (chuyển sang F nếu cần)
    const temps = forecast.map(d => {
      const c = d.main.temp;
      return unit === "F" ? Utils.celsiusToFahrenheit(c) : Math.round(c);
    });
    const labels = forecast.map(d => Utils.getDayName(d.dt));

    const minT = Math.min(...temps) - 3;
    const maxT = Math.max(...temps) + 5;

    // Hàm ánh xạ giá trị → tọa độ pixel
    const xOf = i => PADDING.left + (i / (temps.length - 1)) * plotW;
    const yOf = v => PADDING.top  + (1 - (v - minT) / (maxT - minT)) * plotH;

    // Animation: vẽ từng đoạn dần dần
    if (_animFrame) cancelAnimationFrame(_animFrame);
    let progress = 0;
    const STEPS  = 40;

    function frame() {
      progress = Math.min(progress + 1, STEPS);
      const ratio = progress / STEPS;

      ctx.clearRect(0, 0, W, H);
      const colors = _getColors();
      _drawGrid(ctx, W, H, minT, maxT, unit, colors);
      _drawGradient(ctx, temps, xOf, yOf, plotH, ratio, colors);
      _drawLine(ctx, temps, xOf, yOf, ratio, colors);
      _drawLabels(ctx, temps, labels, xOf, yOf, unit, ratio, colors);

      if (progress < STEPS) _animFrame = requestAnimationFrame(frame);
    }
    _animFrame = requestAnimationFrame(frame);
  }

  /** Vẽ lưới nền và trục */
  function _drawGrid(ctx, W, H, minT, maxT, unit, colors) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth   = 1;
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const y = PADDING.top + (i / steps) * (H - PADDING.top - PADDING.bottom);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(W - PADDING.right, y);
      ctx.stroke();

      // Nhãn trục Y
      const val = Math.round(maxT - (i / steps) * (maxT - minT));
      ctx.fillStyle  = colors.subText;
      ctx.font       = "11px Calibri, sans-serif";
      ctx.textAlign  = "right";
      ctx.fillText(`${val}°${unit}`, PADDING.left - 8, y + 4);
    }
  }

  /** Vẽ gradient phía dưới đường biểu đồ */
  function _drawGradient(ctx, temps, xOf, yOf, plotH, ratio, colors) {
    const endIdx = Math.max(1, Math.floor((temps.length - 1) * ratio));
    const grad   = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + plotH);
    grad.addColorStop(0, colors.gradientTop);
    grad.addColorStop(1, colors.gradientBot);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(temps[0]));
    for (let i = 1; i <= endIdx; i++) ctx.lineTo(xOf(i), yOf(temps[i]));
    ctx.lineTo(xOf(endIdx), PADDING.top + plotH);
    ctx.lineTo(xOf(0),      PADDING.top + plotH);
    ctx.closePath();
    ctx.fill();
  }

  /** Vẽ đường line chính */
  function _drawLine(ctx, temps, xOf, yOf, ratio, colors) {
    const endIdx = Math.max(1, Math.floor((temps.length - 1) * ratio));
    ctx.strokeStyle = colors.line;
    ctx.lineWidth   = 2.5;
    ctx.lineJoin    = "round";
    ctx.beginPath();
    ctx.moveTo(xOf(0), yOf(temps[0]));
    for (let i = 1; i <= endIdx; i++) ctx.lineTo(xOf(i), yOf(temps[i]));
    ctx.stroke();
  }

  /** Vẽ điểm tròn, nhãn nhiệt độ và ngày */
  function _drawLabels(ctx, temps, labels, xOf, yOf, unit, ratio, colors) {
    const endIdx = Math.floor((temps.length - 1) * ratio);
    for (let i = 0; i <= endIdx; i++) {
      const x = xOf(i), y = yOf(temps[i]);

      // Hình tròn
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle   = colors.point;
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Nhiệt độ bên trên điểm
      ctx.fillStyle  = colors.text;
      ctx.font       = "bold 12px Calibri, sans-serif";
      ctx.textAlign  = "center";
      ctx.fillText(`${temps[i]}°${unit}`, x, y - 12);

      // Ngày bên dưới trục
      ctx.fillStyle = colors.subText;
      ctx.font      = "12px Calibri, sans-serif";
      ctx.fillText(labels[i], x, yOf(Math.min(...temps)) + 40);
    }
  }

  /**
   * Cập nhật lại biểu đồ khi đổi đơn vị nhiệt độ
   * @param {string} canvasId
   * @param {Array}  forecast
   * @param {string} unit
   */
  function update(canvasId, forecast, unit) {
    draw(canvasId, forecast, unit);
  }

  return { draw, update };
})();
