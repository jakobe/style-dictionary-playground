let res;
let shadowRoot;
const loadComplete = new Promise((resolve) => {
  res = resolve;
});

window.addEventListener("load", () => {
  res();

  shadowRoot = document
    .getElementById("template-container")
    .attachShadow({ mode: "open" });
});

// Helper so we can pass CSS from style-dictionary output into this iframe
// since adopted style sheets may not be shared across documents..
globalThis.insertCSS = async (cssText, target) => {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  await loadComplete;
  (target === "shadowroot" ? shadowRoot : document).adoptedStyleSheets = [
    sheet,
  ];
};

globalThis.insertHTML = async (html) => {
  await loadComplete;
  shadowRoot.innerHTML = html;
};
