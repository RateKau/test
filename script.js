// ========== データ保存関連 ==========

// ユーザー情報構造例
// users = {
//   "user1": { displayName: "ユーザー１", password: "パスワードハッシュ(今回は平文)", friends: ["user2"], friendRequests: ["user3"], chats: { "user2": [{from:"user1", text:"こんにちは"}] } },
//   ...
// }
let users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = null; // ログインユーザーのID
let currentChatFriend = null; // 現在チャット中のフレンドID

// 保存用
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// ========== DOM取得 ==========
const registerSection = document.getElementById("register-section");
const loginSection = document.getElementById("login-section");
const mainSection = document.getElementById("main-section");

const regUsernameInput = document.getElementById("reg-username");
const regDisplaynameInput = document.getElementById("reg-displayname");
const regPasswordInput = document.getElementById("reg-password");
const registerBtn = document.getElementById("register-btn");
const registerMsg = document.getElementById("register-msg");

const loginUsernameInput = document.getElementById("login-username");
const loginPasswordInput = document.getElementById("login-password");
const loginBtn = document.getElementById("login-btn");
const loginMsg = document.getElementById("login-msg");

const userDisplaynameSpan = document.getElementById("user-displayname");
const logoutBtn = document.getElementById("logout-btn");

const friendSearchInput = document.getElementById("friend-search-input");
const friendSearchBtn = document.getElementById("friend-search-btn");
const friendSearchResults = document.getElementById("friend-search-results");

const friendListDiv = document.getElementById("friend-list");

const chatWithTitle = document.getElementById("chat-with-title");
const chatArea = document.getElementById("chat-area");
const chatInput = document.getElementById("chat-input");
const chatSendBtn = document.getElementById("chat-send-btn");

// ========== パスワードバリデーション ==========
function validatePassword(pw) {
  const symbolMatches = pw.match(/[%@#\$&\*\!\?\^\~]/g) || [];
  const numberMatches = pw.match(/\d/g) || [];
  const letterMatches = pw.match(/[a-zA-Z]/g) || [];

  if (symbolMatches.length < 2) {
    return { valid: false, message: "記号（%@#$&*!?^~など）は2つ以上必要です。" };
  }
  if (numberMatches.length < 2) {
    return { valid: false, message: "数字は2つ以上必要です。" };
  }
  if (letterMatches.length < 10) {
    return { valid: false, message: "英字は10文字以上必要です。" };
  }
  return { valid: true, message: "" };
}

// ========== 登録 ==========
registerBtn.onclick = () => {
  registerMsg.textContent = "";

  const username = regUsernameInput.value.trim();
  const displayName = regDisplaynameInput.value.trim();
  const password = regPasswordInput.value;

  if (!username || !displayName || !password) {
    registerMsg.textContent = "全ての項目を入力してください。";
    return;
  }
  if (users[username]) {
    registerMsg.textContent = "そのユーザー名はすでに使われています。";
    return;
  }

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid) {
    registerMsg.textContent = "パスワードエラー: " + pwCheck.message;
    return;
  }

  // 登録処理
  users[username] = {
    displayName: displayName,
    password: password,
    friends: [],
    friendRequests: [],
    chats: {}
  };
  saveUsers();

  alert("登録成功！ログインしてください。");

  // 入力欄クリア
  regUsernameInput.value = "";
  regDisplaynameInput.value = "";
  regPasswordInput.value = "";

  // 登録後ログイン画面へ切替
  registerSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
};

// ========== ログイン ==========
loginBtn.onclick = () => {
  loginMsg.textContent = "";
  const username = loginUsernameInput.value.trim();
  const password = loginPasswordInput.value;

  if (!username || !password) {
    loginMsg.textContent = "全ての項目を入力してください。";
    return;
  }

  const user = users[username];
  if (!user || user.password !== password) {
    loginMsg.textContent = "ユーザー名かパスワードが違います。";
    return;
  }

  currentUser = username;
  userDisplaynameSpan.textContent = user.displayName;

  loginSection.classList.add("hidden");
  registerSection.classList.add("hidden");
  mainSection.classList.remove("hidden");

  refreshFriendList();
  chatWithTitle.textContent = "チャット相手を選択してください";
  chatArea.innerHTML = "";
  chatInput.value = "";
  chatInput.disabled = true;
  chatSendBtn.disabled = true;
};

// ========== ログアウト ==========
logoutBtn.onclick = () => {
  currentUser = null;
  currentChatFriend = null;

  mainSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
  registerSection.classList.add("hidden");

  loginUsernameInput.value = "";
  loginPasswordInput.value = "";
};

// ========== フレンド検索 ==========

friendSearchBtn.onclick = () => {
  const keyword = friendSearchInput.value.trim();
  friendSearchResults.innerHTML = "";

  if (!keyword) return;

  // 自分自身は検索除外
  if (keyword === currentUser) {
    friendSearchResults.textContent = "自分自身は検索できません。";
    return;
  }

  const foundUsers = Object.keys(users)
    .filter(u => u.includes(keyword) && u !== currentUser);

  if (foundUsers.length === 0) {
    friendSearchResults.textContent = "見つかりませんでした。";
    return;
  }

  foundUsers.forEach(u => {
    const div = document.createElement("div");
    div.textContent = `${u} (${users[u].displayName})`;
    div.onclick = () => sendFriendRequest(u);
    friendSearchResults.appendChild(div);
  });
};

// ========== フレンド申請送信 ==========

function sendFriendRequest(targetUsername) {
  const targetUser = users[targetUsername];
  if (!targetUser) return alert("ユーザーが存在しません。");

  // すでに友達か申請済みかチェック
  if (users[currentUser].friends.includes(targetUsername)) {
    return alert("すでにフレンドです。");
  }
  if (targetUser.friendRequests.includes(currentUser)) {
    return alert("すでに申請済みです。");
  }

  targetUser.friendRequests.push(currentUser);
  saveUsers();
  alert(`フレンド申請を送信しました：${targetUsername}`);
}

// ========== フレンドリスト更新 ==========

function refreshFriendList() {
  friendListDiv.innerHTML = "";

  const currentUserObj = users[currentUser];
  if (!currentUserObj) return;

  // 申請一覧
  if (currentUserObj.friendRequests.length > 0) {
    const reqTitle = document.createElement("h4");
    reqTitle.textContent = "フレンド申請が届いています";
    friendListDiv.appendChild(reqTitle);

    currentUserObj.friendRequests.forEach(reqUser => {
      const reqDiv = document.createElement("div");
      reqDiv.textContent = `${reqUser} (${users[reqUser]?.displayName || "不明"})`;
      const acceptBtn = document.createElement("button");
      acceptBtn.textContent = "承認";
      acceptBtn.onclick = () => {
        acceptFriendRequest(reqUser);
      };
      reqDiv.appendChild(acceptBtn);
      friendListDiv.appendChild(reqDiv);
    });
  }

  // フレンド一覧
  if (currentUserObj.friends.length > 0) {
    const friendTitle = document.createElement("h4");
    friendTitle.textContent = "フレンド";
    friendListDiv.appendChild(friendTitle);

    currentUserObj.friends.forEach(friendUsername => {
      const friendDiv = document.createElement("div");
      friendDiv.textContent = `${friendUsername} (${users[friendUsername]?.displayName || "不明"})`;
      friendDiv.style.cursor = "pointer";
      friendDiv.onclick = () => {
        openChatWith(friendUsername);
      };
      friendListDiv.appendChild(friendDiv);
    });
  }
}

// ========== フレンド申請承認 ==========

function acceptFriendRequest(reqUser) {
  if (!users[currentUser] || !users[reqUser]) return;

  // お互いのフレンドリストに追加
  users[currentUser].friends.push(reqUser);
  users[reqUser].friends.push(currentUser);

  // 申請リストから削除
  users[currentUser].friendRequests = users[currentUser].friendRequests.filter(u => u !== reqUser);
  saveUsers();
  refreshFriendList();
}

// ========== チャットを開く ==========

function openChatWith(friendUsername) {
  currentChatFriend = friendUsername;
  chatWithTitle.textContent = `${users[friendUsername].displayName} さんとチャット中`;

  chatArea.innerHTML = "";
  chatInput.disabled = false;
  chatSendBtn.disabled = false;

  // チャット履歴表示
  const chatLog = users[currentUser].chats[friendUsername] || [];
  chatLog.forEach(msg => {
    addChatMessage(msg.from === currentUser ? "user" : "friend", msg.text);
  });
}

// ========== チャットメッセージ追加 ==========

function addChatMessage(role, text) {
  const div = document.createElement("div");
  div.className = "chat-message " + role;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ========== メッセージ送信 ==========

chatSendBtn.onclick = () => {
  const text = chatInput.value.trim();
  if (!text) return;

  // 送信者(currentUser)のチャットに追加
  if (!users[currentUser].chats[currentChatFriend]) {
    users[currentUser].chats[currentChatFriend] = [];
  }
  users[currentUser].chats[currentChatFriend].push({ from: currentUser, text: text });

  // 受信者(friend)のチャットにも追加
  if (!users[currentChatFriend].chats[currentUser]) {
    users[currentChatFriend].chats[currentUser] = [];
  }
  users[currentChatFriend].chats[currentUser].push({ from: currentUser, text: text });

  saveUsers();

  addChatMessage("user", text);
  chatInput.value = "";
};
