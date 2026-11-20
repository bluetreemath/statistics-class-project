import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
const project = new URL("..", import.meta.url);
const at = (path) => new URL(path, project);
const source = (path) => readFile(at(path), "utf8");

const assets = {
  css: await source("worker/app.css"),
  js: await source("worker/app.js"),
  pdfDownload: await source("worker/pdf-download.js"),
  pdfWorker: [await source("docs/pdf-engine/rhwptopdf.umd.js"), await source("worker/pdf-convert.js"), await source("worker/pdf-worker.js")].join("\n"),
};
for (const name of ["worksheet.hwpx", "worksheet.pdf", "guide.pdf", "example.pdf"]) {
  assets[name] = (await readFile(at("materials/" + name))).toString("base64");
}
const views = await source("worker/views.js");
const server = (await source("worker/server.js")).replace(/^import .*;\r?\n/gm, "");
await Promise.all([mkdir(at("dist/server"), { recursive: true }), mkdir(at("dist/.openai"), { recursive: true })]);
await Promise.all([
  writeFile(at("dist/server/index.js"), "const assets = " + JSON.stringify(assets) + ";\n" + views + "\n" + server),
  copyFile(at(".openai/hosting.json"), at("dist/.openai/hosting.json")),
]);
