const form = document.querySelector("#submission");
const status = document.querySelector("#submission-status");
const file = document.querySelector("#file");
const submit = form.querySelector("button[type=submit]");

function showStatus(message, success) {
  status.textContent = message;
  status.className = "status " + (success ? "success" : "error");
  status.hidden = false;
  status.focus();
}

file.addEventListener("change", () => {
  file.setCustomValidity("");
  if (file.files.length && !/\.(hwp|hwpx)$/i.test(file.files[0].name)) {
    file.setCustomValidity("HWPX 또는 HWP 파일을 선택해 주세요.");
  } else if (file.files.length && file.files[0].size > 15 * 1024 * 1024) {
    file.setCustomValidity("15MB 이하의 파일을 선택해 주세요.");
  }
  if (!file.validity.valid && file.files.length) file.reportValidity();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submit.disabled = true;
  submit.textContent = "제출 중…";
  status.hidden = true;
  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    });
    const result = await response.json();
    if (response.ok) form.reset();
    showStatus(result.message, response.ok);
  } catch {
    showStatus("서버에서 제출 확인을 받지 못했어요. 잠시 후 다시 시도해 주세요.", false);
  } finally {
    submit.disabled = false;
    submit.textContent = "제출하기";
  }
});
