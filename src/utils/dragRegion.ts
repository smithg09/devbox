export const insertTauriDragRegion = () => {
  const dragRegionDiv = document.createElement("div");

  dragRegionDiv.setAttribute("data-tauri-drag-region", "");
  dragRegionDiv.className = "dragble-state";

  document.documentElement.insertBefore(dragRegionDiv, document.body);
};
