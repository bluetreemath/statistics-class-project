# 숫자로 발견하는 우리 생활

학생은 선생님의 활동지 사본과 참고 자료를 내려받고, 학번·이름과 함께 한글 파일을 제출합니다. 제출 파일과 제출자 정보는 R2 객체 하나에 저장됩니다. 관리자 화면은 Sites가 제공하는 계정 인증과 앱 비밀번호를 확인합니다.

Node.js 22 이상에서 `npm run build`로 Sites Worker를 빌드합니다. `npm run validate`로 빌드를 확인합니다.

Sites 런타임에 `BUCKET` R2 바인딩과 `OWNER_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` 비밀값이 필요합니다. `SESSION_SECRET`에는 예측할 수 없는 값을 사용합니다. 제출 파일은 관리자 화면에서 원본 확장자로 내려받습니다.
