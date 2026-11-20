# 숫자로 발견하는 우리 생활

[학생용 GitHub Pages](https://bluetreemath.github.io/statistics-class-project/) · [선생님 제출함](https://statistics-class-project.bluetree7928.chatgpt.site/admin)

학생 화면과 수업 자료는 GitHub Pages에서 제공하고, 제출과 관리자 인증은 Sites 서버에서 처리합니다. 학생 화면을 수정한 뒤 `npm run build:pages`를 실행하고 생성된 `docs/`를 함께 커밋하면 GitHub Pages가 `main` 브랜치에서 배포합니다.

학생은 선생님의 활동지 사본과 참고 자료를 내려받고, 학번·이름과 함께 한글 파일을 제출합니다. 원본과 제출자 정보는 비공개 R2에 저장됩니다. 관리자 화면은 계정과 앱 비밀번호를 확인한 뒤 브라우저에서 제출물을 PDF로 변환합니다. 개별 또는 전체 다운로드를 지원합니다. 변환에는 rhwptopdf v0.2.2와 나눔고딕을 사용하며 라이선스 문서는 docs/pdf-engine에 포함되어 있습니다.

Node.js 22 이상에서 `npm run build`로 Sites Worker를 빌드합니다. `npm run validate`로 빌드를 확인합니다.

Sites 런타임에 `BUCKET` R2 바인딩과 `OWNER_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` 비밀값이 필요합니다. `SESSION_SECRET`에는 예측할 수 없는 값을 사용합니다. 관리자 다운로드 파일에는 학번과 이름이 붙고 확장자는 .pdf입니다.
