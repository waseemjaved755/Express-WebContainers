import "./style.css";
import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";

import { WebContainer } from "@webcontainer/api";
import { files } from "./files";

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

window.addEventListener("load", async () => {
  textareaEl.value = files["index.js"].file.contents;

  textareaEl.addEventListener("input", (e) => {
    writeIndexJS(e.currentTarget.value);
  });

  const terminal = new Terminal({
    convertEol: true,
  });
  terminal.open(terminalEl);

  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies(terminal);
  if (exitCode !== 0) {
    throw new Error("Installation failed");
  }

  startDevServer(terminal);
});

async function installDependencies(terminal) {
  // Install dependencies
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    }),
  );
  // Wait for install command to exit
  return installProcess.exit;
}

async function startDevServer() {
  // Run `npm run start` to start the Express app
  await webcontainerInstance.spawn("npm", ["run", "start"]);

  // Wait for `server-ready` event
  webcontainerInstance.on("server-ready", (port, url) => {
    iframeEl.src = url;
  });
}

/** @param {string} content*/

async function writeIndexJS(content) {
  await webcontainerInstance.fs.writeFile("/index.js", content);
}

document.querySelector("#app").innerHTML = `
  <div class="container">
    <div class="editor">
      <textarea>I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="loading.html"></iframe>
    </div>
  </div>
  <div class="terminal"></div>
`;

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector("iframe");

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector("textarea");

/** @type {HTMLTextAreaElement | null} */
const terminalEl = document.querySelector(".terminal");
