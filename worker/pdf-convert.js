const engineBase = "https://bluetreemath.github.io/statistics-class-project/pdf-engine/";
let pdfReady;

async function engineFile(name, expected) {
  const response = await fetch(engineBase + name, {credentials:"omit", referrerPolicy:"no-referrer"});
  if (!response.ok) throw new Error("변환 도구를 불러오지 못했습니다.");
  const bytes = await response.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = Array.from(digest, n => n.toString(16).padStart(2,"0")).join("");
  if (hex !== expected) throw new Error("변환 도구의 파일 확인에 실패했습니다.");
  return bytes;
}

async function preparePdf() {
  const [wasm,font] = await Promise.all([
    engineFile("rhwptopdf.umd_bg.wasm", "7a3e1e3e3a8d2a5bea64feac7bd8a2b556687a70874003fcf2aa6677e92f83a7"),
    engineFile("NanumGothic-Regular.ttf", "76f45ef4a6bcff344c837c95a7dcc26e017e38b5846d5ae0cdcb5b86be2e2d31")
  ]);
  await RhwpToPdf({module_or_path:wasm});
  RhwpToPdf.registerPdfFont(new Uint8Array(font));
}
async function convertSubmission(bytes) {
  if (!pdfReady) pdfReady = preparePdf().catch(error => {pdfReady = null; throw error;});
  await pdfReady;
  return RhwpToPdf.hwpToPdf(new Uint8Array(bytes));
}
