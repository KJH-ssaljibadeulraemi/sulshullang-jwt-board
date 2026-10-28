import { findPublic } from "./users.js";
import jwt from "jsonwebtoken";
import { ApiError } from "./errors.js";

// ───────── 서버 설정 읽기 ─────────
// .env의 JWT_SECRET(64자리 16진수)을 32바이트 키로 변환한다.
// 비어 있거나, 형식이 틀리거나, 예시 값 그대로면 서버 시작을 거부한다.
function loadSecret() {
  const hex = process.env.JWT_SECRET ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "JWT_SECRET이 없거나 형식이 잘못되었습니다. 새로 생성한 64자리 16진수를 .env에 설정하세요.",
    );
  }
  return Buffer.from(hex, "hex");
}

function loadTtl() {
  const ttl = Number(process.env.TOKEN_TTL || 90);
  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error("TOKEN_TTL은 1 이상의 정수(초)여야 합니다.");
  }
  return ttl;
}

const SECRET = loadSecret();
const TTL = loadTtl();
const ISSUER = process.env.JWT_ISSUER || "webservice-class";
const AUDIENCE = process.env.JWT_AUDIENCE || "board-api";

// ───────── BE-01: 토큰 발급 ─────────
// 비밀번호 검증을 통과한 user만 이 함수에 들어온다 (app.js의 로그인 라우트).
// 토큰에는 사용자 ID(sub)와 발급자·대상·만료만 넣고, 비밀번호·해시는 넣지 않는다.
export function issueToken(user) {
  return jwt.sign({}, SECRET, {
    algorithm: "HS256",
    subject: String(user.id), // sub: 문자열 사용자 ID
    issuer: ISSUER,           // iss
    audience: AUDIENCE,       // aud
    expiresIn: TTL,           // exp = 지금 + TTL초
  });
}

// ───────── BE-02: 토큰 검증 → 검증된 사용자 ID 반환 ─────────
export function currentUserId(req) {
  // 1) Authorization 헤더에서 "Bearer <토큰>" 꺼내기
  const header = req.get("authorization") ?? "";
  const match = /^Bearer (\S+)$/.exec(header);
  if (!match) {
    throw new ApiError(401, "TOKEN_REQUIRED", "로그인이 필요합니다.");
  }

  // 2) 서명·알고리즘·만료·발급자·대상 검증 (decode가 아니라 verify 사용)
  let payload;
  try {
    payload = jwt.verify(match[1], SECRET, {
      algorithms: ["HS256"], // 허용 알고리즘 고정
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "TOKEN_EXPIRED", "로그인이 만료되었습니다. 다시 로그인하세요.");
    }
    throw new ApiError(401, "INVALID_TOKEN", "유효하지 않은 토큰입니다.");
  }

  // 3) 필수 클레임 확인: exp가 없으면 verify가 만료 검사를 건너뛰므로 직접 확인
  if (typeof payload.exp !== "number") {
    throw new ApiError(401, "INVALID_TOKEN", "만료 정보가 없는 토큰입니다.");
  }
  // sub는 "1", "2" 같은 양의 정수 문자열이어야 함
  if (typeof payload.sub !== "string" || !/^[1-9]\d*$/.test(payload.sub)) {
    throw new ApiError(401, "INVALID_TOKEN", "사용자 정보가 올바르지 않은 토큰입니다.");
  }

  // 4) 실제로 존재하는 계정인지 확인
  const userId = Number(payload.sub);
  if (!findPublic(userId)) {
    throw new ApiError(401, "INVALID_TOKEN", "존재하지 않는 사용자입니다.");
  }

  // 검증을 모두 통과한 ID만 /me·등록·수정·삭제로 전달된다
  return userId;
}

// ───────── BE-03: 작성자 권한 검사 ─────────
// userId: currentUserId()가 토큰에서 검증한 현재 사용자 ID
// authorId: DB에 저장된 글의 작성자 ID
export function assertOwner(userId, authorId) {
  if (Number(userId) !== Number(authorId)) {
    throw new ApiError(403, "FORBIDDEN", "본인이 작성한 글만 수정·삭제할 수 있습니다.");
  }
}