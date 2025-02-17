import "./style.css";
import "@xterm/xterm/css/xterm.css";
import { Terminal } from "@xterm/xterm";

import { WebContainer } from "@webcontainer/api";
import { files } from "./files";
import { FitAddon } from "@xterm/addon-fit";

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

window.addEventListener("load", async () => {
  textareaEl.value = files["index.js"].file.contents;

  textareaEl.addEventListener("input", (e) => {
    writeIndexJS(e.currentTarget.value);
  });

  const fitAddon = new FitAddon();
  const terminal = new Terminal({ convertEol: true });
  terminal.loadAddon(fitAddon);
  terminal.open(terminalEl);
  fitAddon.fit();

  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies(terminal);
  if (exitCode !== 0) return;

  startDevServer(terminal);

  webcontainerInstance.on("server-ready", (port, url) => {
    iframeEl.src = url;
  });

  const shellProcess = await startShell(terminal);
  window.addEventListener("resize", () => {
    fitAddon.fit();
    shellProcess.resize({ cols: terminal.cols, rows: terminal.rows });
  });
});

async function installDependencies(terminal) {
  const installProcess = await webcontainerInstance.spawn("npm", ["install"]);
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log(data);
        terminal.write(data);
      },
    }),
  );
  return installProcess.exit;
}

async function startDevServer(terminal) {
  await webcontainerInstance.spawn("npm", ["run", "start"]);
}

async function startShell(terminal) {
  const shellProcess = await webcontainerInstance.spawn("jsh", {
    terminal: { cols: terminal.cols, rows: terminal.rows },
  });

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data);
      },
    }),
  );

  const input = shellProcess.input.getWriter();
  terminal.onData((data) => {
    input.write(data);
  });

  return shellProcess;
}

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
const iframeEl = document.querySelector("iframe");
const textareaEl = document.querySelector("textarea");
const terminalEl = document.querySelector(".terminal");
