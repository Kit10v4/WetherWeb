const PanelManager = (() => {
  function checkFAB() {
    const sidePanel = document.getElementById("side-panel");
    const timeline = document.getElementById("timeline-panel");
    const noSide = !sidePanel
      || !sidePanel.classList.contains("side-panel--open")
      || sidePanel.classList.contains("side-panel--collapsed");
    const noTimeline = timeline?.classList.contains("timeline--collapsed");

    let fab = document.getElementById("panels-fab");
    if (noSide && noTimeline) {
      if (!fab) {
        fab = document.createElement("div");
        fab.id = "panels-fab";
        fab.innerHTML = `
          <button id="fab-side" title="Mở thông tin thời tiết">📍 Thông tin</button>
          <button id="fab-timeline" title="Mở timeline dự báo">⏱ Timeline</button>
        `;
        document.body.appendChild(fab);
        document.getElementById("fab-side")?.addEventListener("click", () => {
          SidePanel.reopenFromFab();
          checkFAB();
        });
        document.getElementById("fab-timeline")?.addEventListener("click", () => {
          Timeline.expandFromFab();
          checkFAB();
        });
      }
      return;
    }
    fab?.remove();
  }

  return { checkFAB };
})();
