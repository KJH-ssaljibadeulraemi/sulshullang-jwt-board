# 술슐랭 (SULSHULLANG)

> 가볍게 가서 깊이 즐기는 나만의 시크릿 술집 나눔

웹서비스설계 개인 과제 **JWT 인증을 적용한 나만의 게시판**입니다.

## 작성자와 서비스 소개

- 학번 / 이름: 202118025 / 김종호
- 서비스 목적과 대상 사용자: 술슐랭은 직접 다녀온 술집을 별점과 한 줄 평으로 소개하고 공유하는 리뷰 게시판입니다. 친구나 동료와 2차 장소를 고르거나 새로운 동네 술집을 찾는 사용자를 대상으로 합니다. 누구나 로그인 없이 후기를 읽을 수 있고, 로그인한 사용자만 후기를 작성할 수 있으며, 자신이 쓴 후기만 수정·삭제할 수 있습니다. 별점은 본문 첫 줄에 `⭐ 4.5 / 5`처럼 적는 방식으로, 공통 API 명세(title·content 두 필드)를 그대로 지킵니다.
- 선택한 기술: **Vue** + **Node.js Express** + SQLite 파일 DB
- 주요 기능
  - 비로그인 공개 목록·상세 조회
  - 이메일·비밀번호 로그인과 JWT(HS256) 발급
  - Bearer 토큰 검증과 내 정보 조회(`/api/me`)
  - 로그인 사용자만 글 작성, 작성자 본인만 수정·삭제 (서버에서 403 검사)
  - 토큰 없음·변조·만료(401), 권한 없음(403), 입력 오류(400), 없는 글(404) 처리와 화면 안내
  - 로그아웃, 401 응답 시 자동 로그인 해제
  - 서버 재시작 후에도 게시글 유지 (SQLite 파일)

## 보고서와 테스트 증거

- [구현 보고서 PDF](docs/report.pdf)
- [테스트 증거 폴더](docs/evidence/) — T01~T17 캡처, 자동 검사 로그(`check_final.txt`, `check_expiry.txt`)

## 프로젝트 구조

```text
.
├── README.md
├── .gitignore
├── backend-express/        # Express 백엔드
│   ├── .env.example        # 환경설정 예시 (실제 .env는 커밋하지 않음)
│   ├── package.json, package-lock.json
│   └── src/
│       ├── app.js          # 라우트, 입력 검사, 공통 오류 응답
│       ├── auth.js         # JWT 발급·검증, 작성자 권한 검사 (BE-01~03)
│       ├── store.js        # SQLite 저장소
│       ├── users.js        # 테스트 계정, 비밀번호 검증
│       └── errors.js
├── frontend-vue/           # Vue 프론트엔드
│   ├── package.json, package-lock.json, vite.config.js, index.html
│   └── src/
│       ├── api.js          # 토큰 메모리 보관, Authorization 헤더, 응답 코드 처리 (FE-01~04)
│       ├── App.vue         # 화면 상태, 로그인·로그아웃, 작성자 버튼
│       ├── main.js
│       └── style.css
├── tools/
│   └── check_api.py        # 제공된 자동 API 검사 도구
└── docs/
    ├── report.pdf          # 구현 보고서
    ├── evidence/           # 테스트 증거
    └── 01~07_*.md/.docx/.pdf  # 과제 안내 원본 자료
```

## 실행 환경

| 항목 | 사용 버전 |
|---|---|
| 운영체제 | Windows 11 |
| 프론트 런타임 Node.js | v24.22.1 |
| 백엔드 런타임 | Node.js v24.22.1 |
| 프레임워크 | Vue 3.5.43, Vite 8.3.4 / Express 5.3.0, jsonwebtoken 9.0.3, dotenv 18.0.7 |
| 데이터 저장 | SQLite (sql.js 1.14.2, 파일 DB) |
| 브라우저 | Google Chrome 155 |

Node.js 20.19 이상이면 실행할 수 있습니다. 자동 검사 도구 실행에는 Python 3가 필요합니다(추가 패키지 없음).

## 설치와 실행

터미널 2개를 사용합니다. 터미널 A는 백엔드, 터미널 B는 프론트입니다. 아래 명령은 Windows PowerShell 기준이며, macOS/Linux에서 다른 부분은 함께 적었습니다.

### 1 저장소 복제

```sh
git clone https://github.com/KJH-ssaljibadeulraemi/sulshullang-jwt-board.git
cd sulshullang-jwt-board
```

### 2 백엔드 준비와 실행 (터미널 A)

```powershell
cd backend-express
npm ci
Copy-Item .env.example .env          # macOS/Linux: cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

마지막 명령이 출력한 64자리 16진수를 `.env`의 `JWT_SECRET=` 뒤에 붙여 넣고 저장한 뒤 서버를 실행합니다.

```powershell
npm start
```

- 환경설정 예시 파일: `backend-express/.env.example`
- JWT_SECRET 설정 방법: 위 명령으로 새 32바이트 난수를 만들어 `.env`에 넣습니다. 서버는 이 값을 32바이트 키로 변환하며, **비어 있거나 64자리 16진수가 아니거나 예시 값(`REPLACE_WITH_RANDOM_64_HEX_CHARACTERS`) 그대로이면 시작을 거부**합니다. 실제 키는 저장소에 올리지 않습니다.
- TOKEN_TTL: 기본 `90`초. 만료 테스트 시 `.env`에서 `TOKEN_TTL=3` 등으로 바꾸거나 `$env:TOKEN_TTL="3"; npm start`(macOS/Linux: `TOKEN_TTL=3 npm start`)로 실행합니다. **`.env`를 바꾼 뒤에는 서버를 반드시 재시작**해야 적용됩니다.
- 백엔드 주소: http://127.0.0.1:8000
- 정상 실행 확인: 터미널에 `게시판 시작 코드 http://127.0.0.1:8000 — 술슐랭 JWT 인증 서버`가 출력되고, 브라우저에서 http://127.0.0.1:8000/api/health 를 열면 `{"status":"ok","stack":"express"}`가 보입니다.

### 3 프론트 빌드와 로컬 실행 (터미널 B)

백엔드를 켜 둔 상태에서 저장소 루트에서 새 터미널을 열고 실행합니다.

```sh
cd frontend-vue
npm ci
npm run build
npm run preview
```

- 최종 확인 주소: http://127.0.0.1:4173
- 개발 중 실행: `npm run dev`, http://127.0.0.1:5173
- API 연결 방식: 브라우저는 같은 주소의 `/api`로 요청하고, Vite 서버(`vite.config.js`의 `server.proxy`, `preview.proxy`)가 이를 `http://127.0.0.1:8000`의 백엔드로 전달합니다. 백엔드 포트를 바꾸면 두 proxy 주소를 함께 수정합니다.
- 종료: 프론트와 백엔드를 실행한 각 터미널에서 `Ctrl+C`
- 코드 변경 후 재실행: 프론트는 `Ctrl+C` → `npm run build` → `npm run preview`, 백엔드는 `Ctrl+C` → `npm start`
- `dist/index.html`을 직접 더블클릭하지 않습니다.

### 4 테스트 계정과 DB

| 사용자 | 이메일 | 실습용 비밀번호 |
|---|---|---|
| Alice (id 1) | alice@class.test | Classroom!2026 |
| Bob (id 2) | bob@class.test | Classroom!2026 |

- SQLite 파일 위치: `backend-express/data/board.sqlite`. 서버 시작 시 폴더와 테이블이 자동 생성되며, 글을 쓰거나 고칠 때마다 파일에 저장됩니다.
- DB 초기화 방법: 백엔드를 `Ctrl+C`로 종료한 뒤 `backend-express/data/board.sqlite`만 삭제하고 `npm start`로 다시 실행합니다. (기존 글이 모두 지워집니다.)
- 서버 재시작 후 데이터 유지 확인 결과: 백엔드를 종료(조회 시 502 확인) → 재시작 → 새로고침했을 때 기존 글의 제목·작성자·작성 시각이 그대로 유지됨을 확인했습니다. (T15)

위 계정은 과제 전용 테스트 계정입니다. 실제 계정 정보나 서버 비밀 키는 기록하지 않습니다.

## 구현 완료 범위

| 기능 | 완료 여부 | 주요 파일 또는 함수 |
|---|---|---|
| 공개 목록과 상세 | 완료 | `backend-express/src/app.js` GET 라우트 (제공 코드 유지) |
| 로그인과 JWT 발급 | 완료 | `backend-express/src/auth.js` `loadSecret`, `loadTtl`, `issueToken` |
| JWT 검증과 내 정보 조회 | 완료 | `backend-express/src/auth.js` `currentUserId` |
| 글 작성과 작성자 저장 | 완료 | `app.js` POST `/api/posts` + `currentUserId` (작성자는 토큰에서 결정) |
| 본인 글 수정·삭제 | 완료 | `backend-express/src/auth.js` `assertOwner` |
| 토큰 만료와 로그아웃 | 완료 | `frontend-vue/src/api.js` `request`, `clearSession` / `App.vue` `logout` |
| 입력 오류와 권한 오류 처리 | 완료 | `app.js` `fields`, `postId` / `api.js` `ERROR_MESSAGES` / `App.vue` `run` |

알려진 문제와 제한
- 토큰 유효 시간이 기본 90초로 짧아, 글을 수정하는 도중 만료되면 401과 함께 로그아웃되고 다시 로그인해야 합니다. (실제 사용 중 발생 확인, 과제 기준 TTL)
- 토큰을 브라우저 메모리에만 보관하므로 새로고침하면 로그인 상태가 해제됩니다. (과제 요구사항에 따른 정상 동작)
- 로그아웃은 이 탭의 토큰만 지웁니다. 이미 복사된 JWT를 서버에서 즉시 무효화하지는 않으며, 해당 토큰은 만료 시각까지 유효합니다.

## 테스트 방법과 결과 요약

- 자동 검사 (백엔드 실행 후 저장소 루트에서, Windows는 `python3` 대신 `py`)
  - `python3 tools/check_api.py --mode final` → **All 40 checks passed** ([check_final.txt](docs/evidence/check_final.txt))
  - `TOKEN_TTL=3`으로 재시작 후 `python3 tools/check_api.py --mode final --expiry` → **All 48 checks passed** ([check_expiry.txt](docs/evidence/check_expiry.txt))
- 수동 검사: Thunder Client(VS Code 확장)와 Chrome 개발자 도구 Network로 T01~T17을 직접 수행했고, 최종 확인은 빌드본(4173)에서 했습니다.
- Alice/Bob 권한 구분: Bob 토큰으로 Alice 글 수정·삭제 시 **403 FORBIDDEN**, 이후 공개 조회로 원문 유지 확인. Bob이 Alice 글에 공백 제목을 보내도 **403**(권한 검사가 입력 검사보다 먼저). 화면에서도 Bob에게는 Alice 글의 수정·삭제 버튼이 보이지 않음.
- HTTP 상태와 오류 code: 200·201·204 / 400 BAD_INPUT · 401 INVALID_CREDENTIALS·TOKEN_REQUIRED·INVALID_TOKEN·TOKEN_EXPIRED · 403 FORBIDDEN · 404 NOT_FOUND 모두 실제 응답으로 확인.
- 응답 헤더와 본문: 등록 201에 `location: /api/posts/{id}`, 보호 API 401에 `www-authenticate: Bearer`, 삭제 204는 응답 0 Bytes 확인.
- 토큰 없음·변조·만료: 토큰 없음 401 TOKEN_REQUIRED / 서명부 첫 글자 변경 401 INVALID_TOKEN / 실제 만료 후 401 TOKEN_EXPIRED, 화면은 로그아웃 상태로 전환.
- 겹치는 조건: 토큰 없이 없는 글 수정 401 TOKEN_REQUIRED, 정상 토큰으로 같은 요청 404 NOT_FOUND, `/api/posts/abc` 400 BAD_INPUT.
- 전체 T01~T17 결과와 증거: [보고서 4절](docs/report.pdf), [docs/evidence/](docs/evidence/)

## 핵심 구현 설명

1. **로그인·발급** (`auth.js` `issueToken`): `app.js`의 로그인 라우트가 제공된 `verifyCredentials`로 비밀번호를 확인한 계정만 `issueToken`에 넘깁니다. HS256으로 서명하고 `sub`(문자열 사용자 ID), `iss`(webservice-class), `aud`(board-api), `exp`(TTL)를 넣습니다. 비밀번호·해시는 넣지 않습니다.
2. **토큰 보관·전송** (`api.js`): 로그인 응답의 `accessToken`과 `user`를 모듈 변수 `session`(메모리)에만 저장합니다. `authorizationHeaders`가 토큰이 있을 때만 `Authorization: Bearer <JWT>`를 붙입니다. 401(로그인 실패 제외)을 받으면 `clearSession`으로 상태를 지우고, 403은 로그인을 유지합니다. 204는 JSON을 파싱하지 않습니다.
3. **서버 검증** (`auth.js` `currentUserId`): `Bearer` 형식이 아니면 401 TOKEN_REQUIRED. `jwt.verify`에 `algorithms: ["HS256"]`, `issuer`, `audience`를 지정해 서명·알고리즘·만료·발급자·대상을 검증합니다(decode만 쓰지 않음). `exp`가 없거나 `sub`가 양의 정수 문자열이 아니거나 실제 계정이 없으면 401 INVALID_TOKEN, 만료는 401 TOKEN_EXPIRED입니다. 검증된 숫자 ID만 반환합니다.
4. **작성자 권한** (`auth.js` `assertOwner`): 수정·삭제 라우트에서 DB 변경 전에 호출되어, 토큰으로 확인한 사용자 ID와 DB에 저장된 글의 `authorId`가 다르면 403 FORBIDDEN을 던집니다. 등록 시 작성자는 요청 본문이 아니라 검증된 ID로 서버가 정하고, 본문의 `authorId`·`userId` 같은 추가 필드는 400으로 거부합니다.

판단 순서는 **인증(401) → 글 존재(404) → 작성자 권한(403) → 입력 검증(400) → DB 변경**입니다. 자세한 코드 설명은 [보고서 3절](docs/report.pdf)에 있습니다.

## AI 활용 요약과 참고 자료

- AI 사용 여부: **사용**
- 도구와 사용 목적: Claude (Anthropic, claude.ai, 앱 표시 모델 Claude Opus 5.5) — 과제 문서 분석과 진행 순서 안내, 개발 환경(VS Code, Node.js, Git, Thunder Client) 설정 안내, 코드 초안 작성, 오류 원인 확인, 테스트 절차 안내, 증거 캡처 정리(파일명 변경과 토큰 가림), README·보고서 문장 정리
- 반영 위치와 직접 수정·검증한 내용
  - `backend-express/src/auth.js` (`loadSecret`, `loadTtl`, `issueToken`, `currentUserId`, `assertOwner`): AI 초안을 거의 그대로 적용한 뒤 Thunder Client로 200/401/403 응답을 직접 확인하고 자동 검사 40개·48개 통과를 확인
  - `frontend-vue/src/api.js`, `frontend-vue/src/App.vue`의 `<script>`: AI 초안을 적용한 뒤 Network 탭에서 Authorization 헤더, 204/400/401/403 화면 처리를 확인
  - 화면 제목·문구(술슐랭 테마), `app.js` 시작 로그 문구, `.env` 키 설정: 본인 작성
- 상세 활용 기록: [보고서 5절](docs/report.pdf)
- 참고 자료: 수업 제공 시작 코드와 과제 문서(`docs/01~07`, `tools/check_api.py`), 제공된 의존성 jsonwebtoken(https://github.com/auth0/node-jsonwebtoken)

## 제출 확인

- [x] README의 안내 문구를 실제 내용으로 교체했다.
- [ ] 새 폴더에 clone하여 README만으로 설치·환경설정·빌드·로컬 실행했다.
- [x] 4173번 빌드 화면에서 API 연결과 전체 필수 기능을 확인했다.
- [ ] GitHub에서 보고서와 증거 링크가 열린다.
- [x] 교수자가 저장소를 열람·복제할 수 있다. (공개 저장소)
- [x] 비밀 키·실제 토큰·DB·node_modules·dist를 커밋하지 않았다.
- [ ] 최종 push 후 저장소 URL과 제출 기준 커밋 SHA를 LMS에 제출했다.
