import { LitElement, css, html } from "lit";
import * as seti from "./seti-theme.json";
import codicon from "./codicon.css.js";
class FileTree extends LitElement {
  static get properties() {
    return {
      files: { attribute: false },
    };
  }

  static get styles() {
    return [
      codicon,
      css`
        :host {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          background-color: #171717;
          width: 200px;
          overflow-x: auto;
          position: relative;
        }

        #file-list {
          color: white;
        }

        .file,
        .folder {
          display: inline-block;
        }

        .folder {
          padding: 0.25em 0em;
        }

        .file {
          display: flex;
          position: relative;
          align-items: center;
          margin-left: 1em;
        }

        #file-list > details {
          margin-bottom: 0.5em;
        }

        details {
          padding-left: 1em;
        }

        summary {
          padding-left: 0.25em;
        }

        .row {
          cursor: pointer;
        }

        img {
          width: 25px;
          display: block;
        }

        .file::after {
          content: "●";
          position: absolute;
          color: transparent;
          right: 0.375rem;
        }

        .file:hover,
        summary:hover {
          background-color: #292929;
        }

        .file[checked] {
          background-color: #f8c307;
          background-color: #524310;
        }

        .file[unsaved]::after {
          color: white;
        }

        .folder-row[checked] {
          background-color: #292929;
        }

        input {
          margin-left: 1.5em;
          width: calc(100% - 3em);
          margin-right: 2em;
        }

        .new {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 8px;
        }

        .new > .codicon {
          padding: 0.5em;
          background-color: transparent;
          color: white;
          border: none;
          cursor: pointer;
        }

        .new > .codicon:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .codicon-play {
          flex-grow: 1;
        }
      `,
    ];
  }

  get folderButtons() {
    return Array.from(this.shadowRoot.querySelectorAll(".folder-row") || []);
  }

  /** Get all DOM nodes associated with files */
  get fileButtons() {
    return Array.from(this.shadowRoot.querySelectorAll(".file") || []);
  }

  /** Get DOM node of the file that is checked */
  get checkedFileBtn() {
    return this.fileButtons.find((btn) => btn.hasAttribute("checked"));
  }

  /* Get the full file path of the checked file */
  get checkedFile() {
    return this.checkedFileBtn?.getAttribute("full-path");
  }

  get checkedFolderEl() {
    return Array.from(this.shadowRoot.querySelectorAll(".folder-row")).find(
      (folder) => folder.hasAttribute("checked")
    );
  }

  get checkedFolder() {
    return this.checkedFolderEl?.getAttribute("full-path");
  }

  /* Get DOM node of the file that is unsaved, can only be one for now because we auto-save onFocusChange */
  get unsavedFileBtn() {
    return this.fileButtons.find((btn) => btn.hasAttribute("unsaved"));
  }

  /* Get the full file path of the unsaved file */
  get unsavedFile() {
    return this.unsavedFileBtn.getAttribute("full-path");
  }

  sortFiles(files) {
    return files.sort((a, b) => {
      const slashesA = a.split("/").length;
      const slashesB = b.split("/").length;
      if (slashesA < slashesB) {
        return 1;
      } else if (slashesB < slashesA) {
        return -1;
      }
      return a.localeCompare(b);
    });
  }

  /**
   * [
   *  'foo.js',
   *  'foo/bar/qux.json',
   *  'foo/qux/',
   * ]
   *      vvvvvv
   * {
   *   'foo.js': {},
   *   foo: {
   *     bar: {
   *       qux.json: 'file'
   *     },
   *     qux: {}
   *   }
   * }
   */
  filesAsTree(files) {
    const tree = {};
    for (const file of this.sortFiles(files)) {
      const parts = file.split("/");
      let depthTree = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        if (i === parts.length - 1) {
          if (parts[i] === "") {
            continue;
          } else {
            if (!depthTree[part]) {
              depthTree[part] = "";
            }
            depthTree = depthTree[part];
            continue;
          }
        }

        if (!depthTree[part]) {
          depthTree[part] = {};
        }
        depthTree = depthTree[part];
      }
    }
    return tree;
  }

  /** document.activeElement but incorporating shadow boundaries */
  getDeepActiveElement() {
    let host = document.activeElement || document.body;
    while (host && host.shadowRoot && host.shadowRoot.activeElement) {
      host = host.shadowRoot.activeElement;
    }
    return host;
  }

  constructor() {
    super();
    this.files = [];
    this.focusInRoot = true;
    this.lastSelectedElement;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", () => {
      if (!this.shadowRoot.contains(this.getDeepActiveElement())) {
        this.focusInRoot = true;
        this.uncheckFolders();
      } else {
        this.focusInRoot = false;
      }
    });
  }

  updated(changedProperties) {
    super.updated(changedProperties);
    if (
      changedProperties.has("files") &&
      !this.checkedFileBtn &&
      this.files.length > 0
    ) {
      this.switchToFile(0).then(() => {
        this.openParentFolders();
      });
    }
  }

  render() {
    return html`
      <div id="file-list">
        <div class="new">
          <button
            @click=${this.play}
            @keydown=${this.play}
            class="codicon codicon-play"
          ></button>
          <button
            @click=${() => this.newFileOrFolder("folder")}
            @keydown=${() => this.newFileOrFolder("folder")}
            class="codicon codicon-new-folder"
          ></button>
          <button
            @click=${() => this.newFileOrFolder("file")}
            @keydown=${() => this.newFileOrFolder("file")}
            class="codicon codicon-new-file"
          ></button>
          <button
            @click=${() => this.removeFileOrFolder()}
            @keydown=${() => this.removeFileOrFolder()}
            class="codicon codicon-trash"
          ></button>
        </div>
        ${this.asDetails(this.filesAsTree(this.files))}
      </div>
    `;
  }

  getLogoFromFileName(filename) {
    const spl = filename.split(".");
    const ext = spl[spl.length - 1];
    let fileExt = seti.fileExtensions[ext];
    if (!fileExt) {
      fileExt = seti.languageIds[ext];
    }
    if (!fileExt) {
      return;
    }
    const iconDef = seti.iconDefinitions[fileExt];
    return html`<img
      src="./seti-icons/${fileExt.replace("_", "")}.svg"
      style="fill: ${iconDef.fontColor}"
    />`;
  }

  asDetails(tree, memo = "") {
    return html`
      ${Object.entries(tree).map(([k, v]) => {
        return v === ""
          ? html`
              <div
                tabindex="0"
                class="row file"
                full-path="${memo}${k}"
                @keydown=${this.rowClick}
                @click=${this.rowClick}
              >
                ${this.getLogoFromFileName(k)}
                <span> ${k} </span>
              </div>
            `
          : html`
              <details>
                <summary
                  @keydown=${this.rowClick}
                  @click=${this.rowClick}
                  class="row folder-row"
                  full-path="${memo}${k}"
                >
                  <span class="folder">${k}</span>
                </summary>
                ${this.asDetails(v, `${memo}${k}/`)}
              </details>
            `;
      })}
    `;
  }

  play() {
    this.dispatchEvent(new Event("run-style-dictionary"));
  }

  uncheckFolders() {
    const allFolders = Array.from(
      this.shadowRoot.querySelectorAll(".folder-row")
    );
    allFolders.forEach((folder) => {
      folder.removeAttribute("checked");
    });
  }

  openParentFolders() {
    // open parent folders
    if (this.checkedFile) {
      const parts = this.checkedFile.split("/");
      let path = "";
      parts.forEach((part) => {
        path += part;
        const el = this.shadowRoot.querySelector(`[full-path="${path}"]`);
        if (el) {
          el.click();
        }
        path += "/";
      }, "");
    }
  }

  rowClick(ev) {
    let { target } = ev;

    // get the "actual" target if the event came from the inner span
    if (target.tagName === "SPAN") {
      target = target.closest(".file, .folder-row");
    }
    this.lastSelectedElement = target;
    if (target.classList.contains("file")) {
      this.switchToFile(target.getAttribute("full-path"));
    } else if (target.classList.contains("folder-row")) {
      this.clickFolder(ev);
    }
  }

  clickFolder(ev) {
    let { target } = ev;
    target = target.classList.contains("folder")
      ? target.parentElement
      : target;

    this.uncheckFolders();
    target.setAttribute("checked", "");
  }

  newFileOrFolder(type) {
    const parentFolder = this.focusInRoot
      ? this.shadowRoot.getElementById("file-list")
      : this.checkedFolderEl?.parentElement;

    const currentFolderText = this.focusInRoot
      ? ""
      : this.checkedFolderEl.getAttribute("full-path") || "";

    const input = document.createElement("input");
    parentFolder.appendChild(input);
    input.closest("details")?.setAttribute("open", "");
    input.addEventListener("blur", (ev) => {
      if (ev.target.isConnected) {
        this.addFileOrFolder(
          ev.target.value,
          currentFolderText,
          ev.target,
          type
        );
      }
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        this.addFileOrFolder(
          ev.target.value,
          currentFolderText,
          ev.target,
          type
        );
      }
    });
    input.focus();
  }

  async addFileOrFolder(filename, folder, input, type) {
    try {
      input.remove();
      if (filename === "") {
        return;
      }
      const fullPath = `${folder ? `${folder}/` : ""}${filename}`;
      const fullPathNormalized = `${fullPath}${type === "folder" ? "/" : ""}`;
      this.files = [...this.files, fullPathNormalized];
      this.dispatchEvent(
        new CustomEvent(`create-${type}`, { detail: fullPathNormalized })
      );
      await this.updateComplete;
      const curr = [...this.folderButtons, ...this.fileButtons].find((btn) => {
        return btn.getAttribute("full-path") === fullPath;
      });
      if (curr) {
        curr.click();
      }
    } catch (e) {}
  }

  async removeFileOrFolder() {
    const lastSelectedFile = this.lastSelectedElement.getAttribute("full-path");
    this.dispatchEvent(
      new CustomEvent("remove-file", {
        detail: `${lastSelectedFile}${
          this.lastSelectedElement.classList.contains("folder-row") ? "/" : ""
        }`,
      })
    );
  }

  // TODO: clean this up, bit messy..
  async switchToFile(indexOrName) {
    await this.updateComplete;
    if (this.unsavedFileBtn) {
      this.dispatchEvent(
        new CustomEvent("save-current-file", { detail: this.unsavedFile })
      );
    }
    if (this.checkedFileBtn) {
      this.checkedFileBtn.removeAttribute("checked");
      this.uncheckFolders();
    }

    let filename;
    let btn;
    if (typeof indexOrName === "number" && this.fileButtons[indexOrName]) {
      filename = this.fileButtons[indexOrName].getAttribute("full-path");
      btn = this.fileButtons[indexOrName];
    } else if (typeof indexOrName === "string") {
      filename = indexOrName;
      btn = this.fileButtons.find(
        (btn) => btn.getAttribute("full-path") === indexOrName
      );
    }
    if (btn) {
      btn.setAttribute("checked", "");
      const parentFolder = btn.parentElement.firstElementChild;
      if (parentFolder && parentFolder.classList.contains("folder-row")) {
        parentFolder.setAttribute("checked", "");
      }
    }

    this.dispatchEvent(
      new CustomEvent("switch-file", {
        detail: filename,
      })
    );
  }
}
customElements.define("file-tree", FileTree);
