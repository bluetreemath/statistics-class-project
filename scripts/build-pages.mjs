import { mkdir, copyFile, writeFile } from "node:fs/promises";
import { entryPage, studentPage, materials } from "../worker/views.js";

const output = new URL("../docs/", import.meta.url);
const backend = "https://statistics-class-project.bluetree7928.chatgpt.site";
const routes = {
  "/": "", "/project": "project/", "/app.css?v=2": "app.css", "/app.js?v=2": "app.js",
  "/admin": backend + "/admin", "/submit": backend + "/submit",
};

await mkdir(new URL("project/", output), { recursive: true });
await mkdir(new URL("materials/", output), { recursive: true });
for (const [id, { file, name }] of Object.entries(materials)) {
  routes["/materials/" + id] = "materials/" + encodeURIComponent(name);
  await copyFile(new URL("../materials/" + file, import.meta.url), new URL("materials/" + name, output));
}

function pageLinks(html, base) {
  return html.replace(/(href|action|src)="(\/[^"]*)"/g, (_, attribute, path) => {
    if (!Object.hasOwn(routes, path)) throw new Error("Missing Pages route: " + path);
    const target = routes[path];
    return attribute + '="' + (target.startsWith("https://") ? target : base + target) + '"';
  });
}

for (const file of ["app.css", "app.js"]) {
  await copyFile(new URL("../worker/" + file, import.meta.url), new URL(file, output));
}
await writeFile(new URL("index.html", output), pageLinks(entryPage(), "./"));
await writeFile(new URL("project/index.html", output), pageLinks(studentPage(), "../"));
await writeFile(new URL(".nojekyll", output), "");
