const componentFrame = document.getElementById("component-frame");
const viewportBtn = document.getElementById("viewport-btn");
const popoutBtn = document.getElementById("popout-btn");
const framePopout = document.getElementById("frame-popout");

componentFrame.style.width = "min(80vw, 700px)";

viewportBtn.addEventListener("click", (ev) => {
  const { target } = ev;
  if (target.innerText === "View Mobile") {
    target.innerText = "View Desktop";
    componentFrame.style.width = "min(80vw, 400px)";
  } else {
    target.innerText = "View Mobile";
    componentFrame.style.width = "min(80vw, 700px)";
  }
});

popoutBtn.addEventListener("click", (ev) => {
  const { target } = ev;
  if (target.innerText === "Pop-out") {
    framePopout.style.position = "fixed";
    framePopout.style.transform = "translateY(-50%)";
    target.innerText = "Pop-in";
  } else {
    framePopout.style.position = "relative";
    framePopout.style.transform = "none";
    target.innerText = "Pop-out";
  }
});
