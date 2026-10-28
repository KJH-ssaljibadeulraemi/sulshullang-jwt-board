<script setup>
import { ref, onMounted } from "vue";
import { api, login, getSession, clearSession, canEdit } from "./api";
const posts = ref([]),
  selected = ref(null),
  title = ref(""),
  content = ref(""),
  editing = ref(null);
const email = ref("alice@class.test"),
  password = ref("Classroom!2026"),
  user = ref(null),
  busy = ref(false),
  message = ref("게시판을 불러오는 중입니다.");
const refresh = async () => {
  posts.value = await api.list();
};
// 요청 실행 공통 함수: 성공했을 때만 성공 안내, 실패하면 오류 안내
async function run(action, success) {
  busy.value = true;
  try {
    await action();
    message.value = success;
  } catch (e) {
    message.value = e.message;
    // 404: 글이 없으면 상세를 비우고 목록을 새로 불러온다
    if (e.status === 404) {
      selected.value = null;
      editing.value = null;
      await refresh().catch(() => {});
    }
    // 400: 입력값은 지우지 않는다 (사용자가 고칠 수 있게)
    // 401: api.js에서 메모리 로그인 상태를 지웠으므로 아래 finally에서 화면도 로그아웃 표시
    // 403: 로그인 상태를 유지한다
  } finally {
    user.value = getSession().user;
    busy.value = false;
  }
}
onMounted(() => run(refresh, "게시판이 준비되었습니다."));
function reset() {
  title.value = "";
  content.value = "";
  editing.value = null;
}
function save() {
  // 비로그인 사용자에게는 로그인 안내 (서버도 401로 막는다)
  if (!user.value) {
    message.value = "글을 작성하려면 먼저 로그인하세요.";
    return;
  }
  run(async () => {
    const input = { title: title.value, content: content.value };
    selected.value = editing.value
      ? await api.update(editing.value, input)
      : await api.create(input);
    reset();
    await refresh();
  }, editing.value ? "게시글을 수정했습니다." : "게시글을 등록했습니다.");
}
function edit() {
  editing.value = selected.value.id;
  title.value = selected.value.title;
  content.value = selected.value.content;
}
function remove() {
  if (confirm("게시글을 삭제할까요?"))
    run(async () => {
      await api.remove(selected.value.id);
      selected.value = null;
      reset();
      await refresh();
    }, "게시글을 삭제했습니다.");
}
// 로그아웃: 메모리의 토큰·사용자 정보와 화면 상태를 즉시 지운다
function logout() {
  clearSession();
  user.value = null;
  reset();
  message.value = "로그아웃했습니다. 이 탭의 로그인 정보를 지웠습니다.";
}
function me() {
  run(async () => {
    const u = await api.me();
    alert(`${u.name} (${u.email})`);
  }, "내 정보 조회를 완료했습니다.");
}
</script>
<template>
  <main>
    <header>
      <span class="eyebrow">SULSHULLANG · 술집 리뷰</span>
      <h1>술슐랭</h1>
      <p class="muted">
        가볍게 가서 깊이 즐기는 나만의 시크릿 술집 나눔
      </p>
    </header>
    <p class="banner">
      여기가 최고다!! 자신만의 최애 술집 모두에게 자랑해보세요!
    </p>
    <div role="status" class="message">{{ message }}</div>
    <div class="grid">
      <aside>
        <section class="card">
          <h2>로그인</h2>
          <p>{{ user ? `${user.name}님 로그인 중` : "로그아웃 상태" }}</p>
          <form
            @submit.prevent="
              run(() => login(email, password), '로그인했습니다.')
            "
          >
            <label>이메일<input type="email" v-model="email" required /></label
            ><label
              >비밀번호<input type="password" v-model="password" required
            /></label>
            <div class="actions">
              <button :disabled="busy">로그인</button
              ><button type="button" class="secondary" @click="logout">
                로그아웃
              </button>
            </div>
          </form>
          <p>
            <small
              >테스트 계정: alice@class.test / bob@class.test<br />공통
              비밀번호: Classroom!2026</small
            >
          </p>
          <button class="secondary" :disabled="busy" @click="me">
            내 정보 조회
          </button>
        </section>
        <section class="card">
          <h2>{{ editing ? "게시글 수정" : "새 글 작성" }}</h2>
          <p class="muted" v-if="!user">글을 쓰려면 먼저 로그인하세요.</p>
          <form @submit.prevent="save">
            <label>제목<input maxlength="100" v-model="title" required /></label
            ><label
              >내용<textarea maxlength="5000" v-model="content" required />
            </label>
            <div class="actions">
              <button :disabled="busy">
                {{ editing ? "수정 저장" : "등록" }}</button
              ><button type="button" class="secondary" @click="reset">
                입력 초기화
              </button>
            </div>
          </form>
        </section>
      </aside>
      <div>
        <section class="card">
          <h2>
            게시글 목록 <small>{{ posts.length }}개</small>
          </h2>
          <p v-if="!posts.length">첫 번째 술집 후기를 남겨 보세요.</p>
          <article class="post" v-for="p in posts" :key="p.id">
            <button
              class="post-title"
              :disabled="busy"
              @click="
                run(
                  async () => (selected = await api.detail(p.id)),
                  '게시글을 불러왔습니다.',
                )
              "
            >
              {{ p.title }}
            </button>
            <p>
              <small
                >{{ p.authorName }} ·
                {{ new Date(p.createdAt).toLocaleString() }}</small
              >
            </p>
          </article>
        </section>
        <section class="card">
          <h2>게시글 상세</h2>
          <template v-if="selected"
            ><h3>{{ selected.title }}</h3>
            <p class="content">{{ selected.content }}</p>
            <p>
              <small>작성자 {{ selected.authorName }}</small>
            </p>
            <div class="actions" v-if="canEdit(selected)">
              <button class="secondary" @click="edit">수정</button
              ><button class="danger" :disabled="busy" @click="remove">
                삭제
              </button>
            </div></template
          >
          <p class="muted" v-else>목록에서 제목을 선택하세요.</p>
        </section>
      </div>
    </div>
  </main>
</template>
