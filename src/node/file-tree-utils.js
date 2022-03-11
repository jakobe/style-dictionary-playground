import fs from "fs";
import util from "util";
import path from "path";
import glob from "glob";
import { configPaths, changeLang, getContents } from "./index.js";
import {
  exportHTMLToComponentFrame,
  styleDictionaryInstance,
  styleDictionaryInstanceSet,
  rerunStyleDictionaryIfSourceChanged,
} from "./run-style-dictionary.js";
import createDictionary from "browser-style-dictionary/lib/utils/createDictionary.js";
import mkdirRecursive from "./mkdirRecursive.js";
import { ensureMonacoIsLoaded, editor } from "../browser/monaco.js";

import colorTokens from "../tokens/global/color.json";
import radiiTokens from "../tokens/global/radii.json";
import componentTokens from "../tokens/components.json";
import htmlTemplate from "../markup/markup.html";

const asyncGlob = util.promisify(glob);
const extensionMap = {
  js: "javascript",
};
const tokensPath = path.resolve("tokens");
const fileTreeEl = document.querySelector("file-tree");

async function currentFileContentChanged() {
  const selectedFileBtn = getSelectedFileBtn();
  if (selectedFileBtn) {
    selectedFileBtn.setAttribute("unsaved", "");
  }
}

function getSelectedFileBtn() {
  return fileTreeEl.checkedFileBtn;
}

// http://localhost:8000/#project=rVZbb5swFP4riL20VQqrsk5b1fWlD3vd2zSNajLgEBNsI/uQJYry32cbSGxzSaTVUbicm8/5vmObQ5ghkcf6EgHfYCajUnIWPoWHhAVBYtRJ+BSYVy1IucixsERaKFBOGukItZjylFTYE2vFFlWNkSfhQfuSiHGGj0l4Njsu7Eg5lhvg9VWhJHUD9Y/dQx84CddY2bPCqyXjFReDUuxpjEW04gyiFEk77cEUgHfwP/EBCyBI7Efm0Dd1OYaLNmSsc5kg0ZtSsahsvbwKgfaDtCpSrGEe9Q+vZkxzR7FqDnohyFczZhoAic2FEA9mjFO/sHoV53PoG/WYXyEwZnOencFFnlpir+NJ23o8Dagbbx/TDaqY43g1EmecKVD314Yy1U0E67v0+lhoH2lGL7U1rdW2wEDGemXzcdCMygGtRgKkhxq1+0eDmG0KwRuWvw4wt5IGgZhU4bBmwWS2aP3X2FsYjtvH6FFg6nr8JTmspx2Wy4GHmXzFBZ3NrkKAf93cP9S720BwUG83nx5zXNy6wdpt++dsEvUuWHZ/9TzmPwvWVLdoNhOmf0OC2YoUHp+SNyIzIX/3k9zdxXc2+W3cty61WkGgYZJOYpn0W+CE53dFfN3mbKysTq4FXpFdq5O5o0obUuU/UItf9xor/9ixWqkDT1rJ6+HtWeosA8IQEM7aUH+2SBCUKsfIzaffAwRFcMo3PlmPbnVv/hFUXoNDKS/XWr5DqedKy/lCS7RFMhOkhhjLz7OVWg1lPgBmDkKjd9pEf3d4+NhLop/4DKek0+Zf+lXjZgWY6h7F0RpopZJ5zsk2yCok5bdu+7pPGwCN0Yt2c/TtxvXyHCuh0vb38PgP

export async function createInputFiles() {
  const urlSplit = window.location.href.split("#project=");
  if (urlSplit.length > 1) {
    const encoded = urlSplit[1];
    await new Promise((resolve) => setTimeout(resolve, 200));
    const parsedContents = JSON.parse(flate.deflate_decode(encoded));
    await Promise.all(
      Object.entries(parsedContents).map(async ([file, content]) => {
        return new Promise(async (resolve) => {
          const dir = path.dirname(file);
          if (dir !== "/") {
            await mkdirRecursive(dir);
          }
          fs.writeFile(file, content, (err) => {
            resolve();
          });
        });
      })
    );
  } else {
    fs.mkdirSync(`global`);
    fs.mkdirSync(`components`);

    fs.writeFileSync(
      // take the .js by default
      configPaths.find((pa) => pa.endsWith(".js")),
      `export default {
  source: ["**/*.tokens.json"],
  platforms: {
    cssVars: {
      transformGroup: "css",
      prefix: "sd",
      buildPath: "build/css/",
      files: [
        {
          destination: "_variables.css",
          format: "css/variables",
          filter: function(token) {
            return token.filePath != "components/components.tokens.json";
          }
        },
      ],
    },
    css: {
      transforms: ['attribute/cti', 'name/cti/pipeKebab', 'size/rem'],
      prefix: "sd",
      buildPath: "build/css/",
      files: [
        {
          destination: "_components.css",
          format: "css/component",
          filter: {
            filePath: "components/components.tokens.json"
          }
        },
      ],
    },
  },
};
      `
    );

    fs.writeFileSync(
      path.join(`components`, "components.tokens.json"),
      JSON.stringify(componentTokens, null, 2)
    );

    fs.writeFileSync(path.join(`components`, "markup.html"), htmlTemplate);

    fs.writeFileSync(
      path.join(`global`, "color.tokens.json"),
      JSON.stringify(colorTokens, null, 2)
    );

    fs.writeFileSync(
      path.join(`global`, "radii.tokens.json"),
      JSON.stringify(radiiTokens, null, 2)
    );
  }
}

export async function createFile(filename) {
  await new Promise((resolve) => {
    fs.writeFile(filename, "", () => {
      resolve();
    });
  });
}

export async function createFolder(foldername) {
  await new Promise((resolve) => {
    fs.mkdir(foldername, (err) => {
      resolve();
    });
  });
}

export async function editFileName(filePath, newName, isFolder = false) {
  const newPath = path.join(path.dirname(filePath), newName);
  fs.renameSync(filePath, newPath);
  await rerunStyleDictionaryIfSourceChanged(newPath, isFolder);
}

export async function removeFile(file) {
  if (file.endsWith("/")) {
    await new Promise((resolve) => {
      fs.rmdir(file, { recursive: true }, () => {
        resolve();
      });
    });
  } else {
    await new Promise((resolve) => {
      fs.unlink(file, () => {
        resolve();
      });
    });
  }
  await repopulateFileTree();
}

export async function openAllFolders() {
  await fileTreeEl.updateComplete;
  Array.from(fileTreeEl.shadowRoot.querySelectorAll("details")).forEach(
    (el) => {
      el.setAttribute("open", "");
    }
  );
}

export async function clearAll() {
  const files = await asyncGlob("**/*", { fs, mark: true });
  const filtered = files.filter((file) => file !== "sd.config.json");
  await Promise.all(
    filtered.map((file) => {
      return new Promise(async (resolve) => {
        if (file.endsWith("/")) {
          await new Promise((resolve) => {
            fs.rmdir(file, { recursive: true }, () => {
              resolve();
            });
          });
        } else if (!file.match("/")) {
          await new Promise((resolve) => {
            fs.unlink(file, () => {
              resolve();
            });
          });
        }
        resolve();
      });
    })
  );
  await repopulateFileTree();
}

export async function saveCurrentFile() {
  const selectedFileBtn = getSelectedFileBtn();
  if (!selectedFileBtn) {
    return;
  }
  const selectedFile = selectedFileBtn.getAttribute("full-path");
  if (!selectedFile) {
    return;
  }
  await new Promise(async (resolve) => {
    await ensureMonacoIsLoaded();
    fs.writeFile(selectedFile, editor.getValue(), () => {
      resolve();
    });
  });
  selectedFileBtn.removeAttribute("unsaved");

  if (selectedFile === "components/markup.html") {
    await exportHTMLToComponentFrame();
  }

  await rerunStyleDictionaryIfSourceChanged(`/${selectedFile}`);
}

function openOrCloseJSSwitch(file) {
  const container = document.getElementById("jsSwitchContainer");
  if (container.hasAttribute("closed-by-user")) {
    return;
  }
  if (configPaths.includes(`/${file}`) && file.endsWith(".json")) {
    container.style.display = "flex";
  } else {
    container.style.display = "none";
  }
}

export async function switchToFile(file) {
  openOrCloseJSSwitch(file);
  const ext = path.extname(file).slice(1);
  const lang = extensionMap[ext] || ext;
  const fileData = await new Promise((resolve) => {
    fs.readFile(file, "utf-8", (err, data) => {
      resolve(data);
    });
  });
  await ensureMonacoIsLoaded();
  editor.setValue(fileData);
  await changeLang(lang);
  editor.setScrollTop(0);
}

export async function setupFileChangeHandlers() {
  await ensureMonacoIsLoaded();
  editor.onDidChangeModelContent((ev) => {
    if (!ev.isFlush) {
      currentFileContentChanged();
    }
  });
  editor._domElement.addEventListener("keydown", (ev) => {
    if (ev.key === "s" && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      saveCurrentFile();
    }
  });
}

export async function getAllFiles() {
  const filePaths = await asyncGlob("**/*", { fs, nodir: true });

  const allFiles = {};
  await Promise.all(
    filePaths.map((filePath) => {
      return new Promise(async (resolve) => {
        const content = await new Promise((resolve) => {
          fs.readFile(filePath, "utf-8", (err, data) => {
            resolve(data);
          });
        });
        allFiles[filePath] = content;
        resolve();
      });
    })
  );
  return allFiles;
}

export async function getInputFiles() {
  await styleDictionaryInstanceSet;
  const allFiles = await asyncGlob("**/*", { nodir: true, fs });
  const outputFiles = await getOutputFiles();
  return allFiles.filter((file) => !outputFiles.includes(file));
}

export async function getOutputFiles() {
  // without a correct SD instance, we can't really know for sure what the output files are
  // therefore, we can't know what the input files are (tokens + other used files via relative imports)
  await styleDictionaryInstanceSet;
  const { platforms } = styleDictionaryInstance.options;
  let outputFiles = [];
  await Promise.all(
    Object.entries(platforms).map(([key, platform]) => {
      return new Promise(async (resolve) => {
        const outFiles = await asyncGlob(`${platform.buildPath}**`, {
          nodir: true,
          fs,
        });
        outputFiles = [...outputFiles, ...outFiles];
        resolve();
      });
    })
  );
  return outputFiles;
}

export async function repopulateFileTree() {
  if (!styleDictionaryInstance) {
    console.error(
      "Trying to repopulate file tree without a valid style-dictionary object to check which files are input vs output."
    );
  }
  const inputFiles = await getInputFiles();
  const outputFiles = await getOutputFiles();
  fileTreeEl.outputFiles = outputFiles;
  fileTreeEl.inputFiles = inputFiles;
}

export async function dispatchTokens(ev) {
  const { source } = ev;
  await styleDictionaryInstanceSet;
  source.postMessage(
    {
      type: "sd-tokens",
      tokens: styleDictionaryInstance.tokens,
    },
    "*"
  );
}

export async function dispatchDictionary(ev) {
  const { source } = ev;
  await styleDictionaryInstanceSet;
  // Dictionary can contain methods, for postMessage cloning as a workaround
  // we therefore have to JSON.stringify it and JSON.parse it to clone which removes functions.
  const dictionary = JSON.parse(JSON.stringify(styleDictionaryInstance));
  source.postMessage(
    {
      type: "sd-dictionary",
      dictionary,
    },
    "*"
  );
}

export async function dispatchEnrichedTokens(ev) {
  const { source, data } = ev;
  const { platform } = data;
  await styleDictionaryInstanceSet;
  const enrichedTokens = styleDictionaryInstance.exportPlatform(platform);
  const { allTokens, tokens } = createDictionary({
    properties: enrichedTokens,
  });
  source.postMessage({ type: "sd-enriched-tokens", tokens, allTokens }, "*");
}

export async function dispatchInputFiles(ev) {
  const { source } = ev;
  const inputFiles = await getInputFiles();
  const contents = await getContents(inputFiles);
  source.postMessage({ type: "sd-input-files", files: contents }, "*");
}
