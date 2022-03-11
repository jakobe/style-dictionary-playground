let res;
const loadComplete = new Promise((resolve) => {
  res = resolve;
});

window.addEventListener("load", () => {
  res();
});

// Helper so we can pass CSS from style-dictionary output into this iframe
// since adopted style sheets may not be shared across documents..
globalThis.insertCSS = async (cssText) => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  await loadComplete;
  document.adoptedStyleSheets = [sheet];
};

globalThis.insertHTML = async (html) => {
  await loadComplete;
  document.getElementById("template-container").innerHTML = html;
};
