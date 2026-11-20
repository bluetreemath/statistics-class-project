const statusLine = document.getElementById("pdf-status");
const bulk = document.getElementById("pdf-all");
let renderer;
let busy = false;

function render(bytes) {
  if (!renderer) renderer = new Worker("/pdf-worker.js");
  return new Promise((resolve, reject) => {
    renderer.onmessage = ({data}) => data.error ? reject(new Error(data.error)) : resolve(data.pdf);
    renderer.onerror = () => {
      renderer.terminate(); renderer = null;
      reject(new Error("PDF 변환 도구를 다시 열어 주세요."));
    };
    renderer.postMessage(bytes,[bytes]);
  });
}

async function saveFile(button) {
  const response = await fetch(button.dataset.file);
  if (!response.ok) throw new Error("제출 파일을 열 수 없습니다. 관리자 로그인을 확인해 주세요.");
  const pdf = await render(await response.arrayBuffer());
  const url = URL.createObjectURL(new Blob([pdf],{type:"application/pdf"}));
  const link = document.createElement("a");
  link.href = url; link.download = button.dataset.name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

async function download(button) {
  if (busy) return;
  busy = true;
  let count = 0;
  try {
    if (button) {
      statusLine.textContent = "PDF로 변환하고 있습니다…";
      await saveFile(button); count++;
    } else {
      let pageUrl = "/admin";
      while (pageUrl) {
        const response = await fetch(pageUrl);
        if (!response.ok) throw new Error("제출 목록을 열 수 없습니다.");
        const doc = new DOMParser().parseFromString(await response.text(),"text/html");
        for (const item of doc.querySelectorAll("button[data-file]")) {
          statusLine.textContent = item.dataset.name + " 변환 중…";
          await saveFile(item); count++;
        }
        pageUrl = doc.querySelector('a[rel="next"]')?.getAttribute("href");
      }
    }
    statusLine.textContent = "PDF " + count + "개의 다운로드를 요청했습니다.";
  } catch (error) {
    statusLine.textContent = "다운로드 요청 " + count + "개. " + error.message;
  } finally {
    busy = false;
  }
}

document.addEventListener("click", event => {
  const item = event.target.closest("button[data-file]");
  if (item) download(item);
});
bulk?.addEventListener("click", () => download(null));
