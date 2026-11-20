export const materials = {
  "worksheet": { file: "worksheet.hwpx", name: "학생용_활동지.hwpx", type: "application/hwp+zip" },
  "preview": { file: "worksheet.pdf", name: "학생용_활동지.pdf", type: "application/pdf" },
  "example": { file: "example.pdf", name: "작성_샘플.pdf", type: "application/pdf" },
  "guide": { file: "guide.pdf", name: "자료찾기_안내.pdf", type: "application/pdf" },
};

export const escape = (value) => String(value).replace(/[&<>"']/g, (char) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
);

const brand = '<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>수학 탐구실</span>';

function layout(title, content, admin = false) {
  return '<!doctype html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="theme-color" content="#123e33"><title>' + escape(title) + ' | 수학 탐구실</title>' +
    '<link rel="stylesheet" href="/app.css?v=2"></head><body>' +
    '<header class="top"><div class="shell top-inner"><a class="brand" href="/">' + brand + '</a>' +
    (admin ? '<a class="top-link" href="/">학생 화면</a>' : '<a class="top-link" href="/admin">관리자</a>') +
    '</div></header><main class="shell">' + content + '</main>' +
    '<footer class="shell footer">1학년 수학 · 통계 수행평가</footer></body></html>';
}

const steps = [
  ["주제 선택", "KOSIS 통계놀이터에서 관심 있는 통계와 탐구 질문을 정해요."],
  ["자료 수집", "같은 통계의 서로 다른 세 연도 화면을 캡처하고 출처를 적어요."],
  ["수치 비교", "세 연도에 공통으로 있는 항목 3개의 수치와 단위를 표에 적어요."],
  ["근거 설명", "비교 결과를 수치로 설명하고 더 알아보고 싶은 점을 정리해요."],
];

export function entryPage() {
  return layout("통계 프로젝트", `
    <section class="hero entry-hero">
      <div class="hero-copy">
        <p class="eyebrow">1학년 수학 · 통계 수행평가</p>
        <h1>숫자로 발견하는<br>우리 생활</h1>
        <p>관심 있는 주제를 하나 골라<br class="mobile-break"> 같은 통계의 세 연도를 비교해 봐요.</p>
      </div>
      <div class="panel entry-panel">
        <h2>학생 참여</h2>
        <form id="entry" action="/project" method="get">
          <label for="entry-id">학번<input id="entry-id" placeholder="예: 10101" inputmode="numeric" pattern="[0-9]{1,12}" maxlength="12" required></label>
          <label for="entry-name">이름<input id="entry-name" placeholder="예: 김하늘" maxlength="40" required></label>
          <button class="button primary full" type="submit">활동 시작하기</button>
        </form>
      </div>
    </section>
    <script src="/app.js?v=2" defer></script>`);
}

export function studentPage() {
  const stepRows = steps.map(([title, description], index) =>
    '<li><span class="step-number">' + (index + 1) +
    '</span><div><strong>' + title + '</strong><p>' + description + '</p></div></li>'
  ).join("");
  return layout("통계 프로젝트", `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">1학년 수학 · 통계 수행평가</p>
        <h1>숫자로 발견하는<br>우리 생활</h1>
        <p>관심 있는 주제를 하나 골라<br class="mobile-break"> 같은 통계의 세 연도를 비교해 봐요.</p>
        <a class="button light" href="/materials/worksheet" download>한글 활동지 사본 받기</a>
      </div>
      <div class="hero-graph" aria-hidden="true">
        <div class="graph-heading"><span></span><span></span><span></span></div>
        <div class="graph-grid"><div class="bars"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
        <div class="graph-axis"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
    </section>
    <section class="section" aria-labelledby="materials-title">
      <h2 id="materials-title">활동 자료</h2>
      <div class="resource-grid">
        <a class="resource" href="/materials/preview" target="_blank" rel="noopener"><span class="file-icon" aria-hidden="true">PDF</span><span><strong>학생용 활동지</strong><small>활동지 미리보기</small></span></a>
        <a class="resource" href="/materials/example" target="_blank" rel="noopener"><span class="file-icon" aria-hidden="true">PDF</span><span><strong>작성 샘플</strong><small>수입품목 비교 사례</small></span></a>
        <a class="resource" href="/materials/guide" target="_blank" rel="noopener"><span class="file-icon" aria-hidden="true">PDF</span><span><strong>자료 찾기 안내</strong><small>KOSIS 통계놀이터 사용법</small></span></a>
      </div>
    </section>
    <div class="workspace section">
      <section class="panel instructions" aria-labelledby="steps-title">
        <h2 id="steps-title">탐구 순서</h2>
        <ol class="step-list">${stepRows}</ol>
        <details><summary>제출 전 확인하기</summary><ul>
          <li>주제와 탐구 질문을 썼어요.</li>
          <li>세 연도의 통계 화면과 자료 출처를 넣었어요.</li>
          <li>같은 항목의 수치를 표에 옮기고 단위를 썼어요.</li>
          <li>비교 결과를 실제 수치로 설명했어요.</li>
          <li>확인한 사실과 더 조사할 내용을 구분했어요.</li>
        </ul></details>
      </section>
      <section class="panel submit" aria-labelledby="submit-title">
        <h2 id="submit-title">활동지 제출</h2>
        <form id="submission" action="/submit" method="post" enctype="multipart/form-data">
          <div class="identity-fields">
            <label for="studentId">학번<input id="studentId" name="studentId" placeholder="예: 10101" inputmode="numeric" pattern="[0-9]{1,12}" maxlength="12" required></label>
            <label for="studentName">이름<input id="studentName" name="studentName" placeholder="예: 김하늘" maxlength="40" required></label>
          </div>
          <div class="upload">
            <div class="upload-copy"><label for="file">작성한 한글 파일</label><span id="file-hint">HWPX 또는 HWP · 최대 15MB</span></div>
            <input id="file" name="file" type="file" accept=".hwpx,.hwp" aria-describedby="file-hint" required>
          </div>
          <button class="button primary full" type="submit">제출하기</button>
          <p id="submission-status" class="status" role="status" tabindex="-1" hidden></p>
        </form>
      </section>
    </div>
    <script src="/app.js?v=2" defer></script>`.replace(/^\s*$/gm, ""));
}

export function receiptPage(message, ok) {
  return layout(ok ? "제출 완료" : "제출 오류",
    '<section class="panel narrow"><h1>' + (ok ? '제출을 완료했어요' : '활동지를 제출하지 못했어요') +
    '</h1><p>' + escape(message) + '</p><a href="/" class="button primary">학생 화면으로</a></section>');
}

export function adminEntry(state, message = "") {
  let content;
  switch (state) {
    case "signin":
      content = '<p>선생님 계정으로 로그인한 후 관리자 비밀번호를 입력해 주세요.</p><a class="button primary" href="/signin-with-chatgpt?return_to=%2Fadmin" target="_top">ChatGPT로 로그인</a>';
      break;
    case "forbidden":
      content = '<p>이 계정에는 제출함 접근 권한이 없어요. 선생님 계정으로 로그인해 주세요.</p><a class="button primary" href="/signout-with-chatgpt?return_to=%2Fadmin" target="_top">계정 바꾸기</a>';
      break;
    default:
      content = '<p>관리자 비밀번호를 입력해 제출함을 여세요.</p>' +
        (message ? '<p class="status error" role="alert">' + escape(message) + '</p>' : '') +
        '<form action="/admin/login" method="post"><label for="password">비밀번호' +
        '<input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" maxlength="128" required></label>' +
        '<button class="button primary full" type="submit">제출함 열기</button></form>';
  }
  return layout("관리자", '<section class="panel narrow"><h1>관리자</h1>' + content + '</section>', true);
}

const date = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

export function adminPage(objects, nextCursor, hasCursor = false) {
  const rows = objects.map(({ key, customMetadata, uploaded }) => {
    const { studentId, studentName, filename } = customMetadata;
    return '<tr><th scope="row">' + escape(studentId) + '</th><td>' + escape(studentName) +
      '</td><td>' + escape(date.format(uploaded)) + '</td><td><a class="download-link" href="/admin/file/' +
      encodeURIComponent(key.slice("submissions/".length)) + '" download>' + escape(filename) + '</a></td></tr>';
  }).join("");
  const results = rows ? '<div class="table-wrap"><table><thead><tr><th scope="col">학번</th><th scope="col">이름</th>' +
    '<th scope="col">제출 시각</th><th scope="col">원본 파일</th></tr></thead><tbody>' + rows + '</tbody></table></div>' :
    '<div class="empty"><span class="file-icon" aria-hidden="true">한글</span><p>아직 제출된 활동지가 없어요.</p></div>';
  return layout("제출함", '<section class="panel admin-panel"><div class="admin-heading"><div>' +
    '<p class="eyebrow">통계 수행평가</p><h1>제출함</h1></div>' +
    '<form action="/admin/logout" method="post"><button type="submit" class="button secondary">로그아웃</button></form></div>' +
    results + '<nav class="pagination" aria-label="제출 목록 페이지">' + (hasCursor ? '<a href="/admin">최신 제출</a>' : '') +
    (nextCursor ? '<a href="/admin?cursor=' + encodeURIComponent(nextCursor) + '">이전 제출 더 보기</a>' : '') +
    '</nav></section>', true);
}
