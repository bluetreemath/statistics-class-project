const participantKey = "statistics-participant";
const entry = document.querySelector("#entry");
const submission = document.querySelector("#submission");

if (entry) {
  const id = entry.querySelector("#entry-id");
  const name = entry.querySelector("#entry-name");
  name.addEventListener("input", () => name.setCustomValidity(""));
  entry.addEventListener("submit", (event) => {
    if (!name.value.trim()) {
      event.preventDefault();
      name.setCustomValidity("이름을 입력해 주세요.");
      name.reportValidity();
      return;
    }
    try {
      sessionStorage.setItem(participantKey, JSON.stringify({ id: id.value, name: name.value.trim() }));
    } catch {
      // The student can enter both fields again on the submission form.
    }
  });
}

if (submission) {
  const id = submission.querySelector("#studentId");
  const name = submission.querySelector("#studentName");
  const status = document.querySelector("#submission-status");
  const file = document.querySelector("#file");
  const submit = submission.querySelector("button[type=submit]");

  try {
    const participant = JSON.parse(sessionStorage.getItem(participantKey));
    id.value = participant?.id ?? "";
    name.value = participant?.name ?? "";
  } catch {
    // The form remains usable when browser storage is disabled.
  }

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

  submission.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    submit.textContent = "제출 중…";
    status.hidden = true;
    try {
      const response = await fetch(submission.action, {
        method: "POST",
        body: new FormData(submission),
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (response.ok) file.value = "";
      showStatus(result.message, response.ok);
    } catch {
      showStatus("서버에서 제출 확인을 받지 못했어요. 잠시 후 다시 시도해 주세요.", false);
    } finally {
      submit.disabled = false;
      submit.textContent = "제출하기";
    }
  });
}
