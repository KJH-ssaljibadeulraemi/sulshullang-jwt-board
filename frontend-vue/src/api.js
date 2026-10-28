// FE-01~04: 로그인 상태(메모리 보관) · 토큰 전송 · 응답 코드 처리 · 작성자 버튼
// 토큰은 localStorage/sessionStorage에 저장하지 않고 이 변수(메모리)에만 둔다.
let session = { accessToken: "", user: null };
export const getSession = () => session;
export function clearSession() {
  session = { accessToken: "", user: null };
}

// FE-02: 토큰이 있을 때만 Authorization 헤더를 만든다 (Bearer undefined 방지)
function authorizationHeaders() {
  return session.accessToken
    ? { Authorization: `Bearer ${session.accessToken}` }
    : {};
}

// FE-03: 서버 오류 code별 화면 안내 문구
const ERROR_MESSAGES = {
  BAD_INPUT: "입력값을 확인하세요. 제목은 1~100자, 내용은 1~5000자이며 공백만 입력할 수 없습니다.",
  INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  TOKEN_REQUIRED: "로그인이 필요합니다. 로그인 후 다시 시도하세요.",
  INVALID_TOKEN: "인증 정보가 올바르지 않습니다. 다시 로그인하세요.",
  TOKEN_EXPIRED: "로그인이 만료되었습니다. 다시 로그인하세요.",
  FORBIDDEN: "본인이 작성한 글만 수정·삭제할 수 있습니다.",
  NOT_FOUND: "게시글을 찾을 수 없습니다. 목록을 새로 불러왔습니다.",
};

export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authorizationHeaders(),
      ...options.headers,
    },
  });

  // 204(삭제 성공)는 본문이 없으므로 JSON을 파싱하지 않는다
  let data = null;
  if (response.status !== 204) {
    data = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const code = data?.code;
    // 401(토큰 없음·변조·만료): 메모리의 토큰과 사용자 정보를 지운다.
    // 단, 로그인 실패(INVALID_CREDENTIALS)는 토큰 문제가 아니므로 제외.
    if (response.status === 401 && code !== "INVALID_CREDENTIALS") {
      clearSession();
    }
    // 403은 로그인 상태를 유지한다 (토큰은 정상, 권한만 없음)
    const error = new Error(
      ERROR_MESSAGES[code] || data?.message || `요청 실패 (HTTP ${response.status})`,
    );
    error.status = response.status;
    error.code = code;
    throw error;
  }
  return data;
}

// FE-01: 로그인 → 성공 응답의 토큰과 사용자 정보를 메모리에 저장
export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  session = { accessToken: data.accessToken, user: data.user };
  return data.user;
}

// FE-04: 로그인한 사용자가 글 작성자일 때만 수정·삭제 버튼 표시
// (화면용일 뿐이고, 실제 권한 검사는 서버의 assertOwner가 한다)
export function canEdit(post) {
  return Boolean(session.user && post && post.authorId === session.user.id);
}

export const api = {
  list: () => request("/posts"),
  detail: (id) => request(`/posts/${id}`),
  create: (input) =>
    request("/posts", { method: "POST", body: JSON.stringify(input) }),
  update: (id, input) =>
    request(`/posts/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  me: () => request("/me"),
};