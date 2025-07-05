// script.js（統合バージョン + 過去の要望を全反映）

// ========== データ保存関連 ==========
let users = JSON.parse(localStorage.getItem("users") || "{}");
let currentUser = null;
let currentChatFriend = null;

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

window.onload = () => {
  const savedUser = localStorage.getItem("currentUser");
  const loggedOut = localStorage.getItem("loggedOut");
  if (savedUser && loggedOut !== "true") {
    currentUser = savedUser;
    document.getElementById("userDisplayname").textContent = users[currentUser].displayName;
    showHome();
  } else {
    showStartScreen();
  }
};

// ========== パスワードバリデーション ==========
function validatePassword(pw) {
  if (pw.length < 10) return { valid: false, message: "パスワードは10文字以上必要です。" };
  if (!/^[a-zA-Z0-9%@#\$&\*\!\?\^\~]+$/.test(pw)) return { valid: false, message: "英字・数字・記号（%@#$&*!?^~）のみ使用可能です。" };
  if (!/[a-zA-Z]/.test(pw)) return { valid: false, message: "英字が必要です。" };
  if (!/\d/.test(pw)) return { valid: false, message: "数字が必要です。" };
  if (!/[%@#\$&\*\!\?\^\~]/.test(pw)) return { valid: false, message: "記号が必要です。" };
  return { valid: true, message: "" };
}

// ========== 画面遷移 ==========
function hideAll() {
  document.querySelectorAll("body > div").forEach(div => div.classList.add("hidden"));
}
function showStartScreen() {
  hideAll();
  document.getElementById("start-screen").classList.remove("hidden");
}
function showRegister() {
  hideAll();
  document.getElementById("register-screen").classList.remove("hidden");
}
function showLogin() {
  hideAll();
  document.getElementById("login-screen").classList.remove("hidden");
}
function showHome() {
  hideAll();
  document.getElementById("main-screen").classList.remove("hidden");
  document.getElementById("userDisplayname").textContent = users[currentUser].displayName;
  refreshFriendList();
  document.getElementById("chatWithTitle").textContent = "チャット相手を選択してください";
  document.getElementById("chatArea").innerHTML = "";
  document.getElementById("chatInput").value = "";
  document.getElementById("chatInput").disabled = true;
  document.getElementById("chatSendBtn").disabled = true;
}
function showSettings() {
  hideAll();
  document.getElementById("settings-screen").classList.remove("hidden");
  document.getElementById("iconInput").value = users[currentUser].icon || "";
  document.getElementById("displayNameInput").value = users[currentUser].displayName || "";
}

// ========== ユーザー管理 ==========
function register() {
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;
  const result = validatePassword(password);
  if (!result.valid) return alert("パスワードエラー: " + result.message);
  if (users[username]) return alert("既に登録されているユーザー名です。");

  users[username] = {
    password,
    displayName: username,
    icon: "",
    nameChanges: [],
    friends: [],
    friendRequests: [],
    chats: {}
  };
  saveUsers();
  alert("登録完了。ログインしてください。");
  showLogin();
}

function loginWithForm() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  if (!users[username] || users[username].password !== password) return alert("ログイン情報が正しくありません。");
  currentUser = username;
  localStorage.setItem("currentUser", currentUser);
  localStorage.setItem("loggedOut", "false");
  showHome();
}

function logout() {
  localStorage.setItem("loggedOut", "true");
  currentUser = null;
  showStartScreen();
}

// ========== 表示名・アイコン変更 ==========
function changeIcon() {
  const newIcon = document.getElementById("iconInput").value;
  users[currentUser].icon = newIcon;
  saveUsers();
  alert("アイコン変更完了！");
}

function changeDisplayName() {
  const newName = document.getElementById("displayNameInput").value;
  const now = Date.now();
  const history = users[currentUser].nameChanges || [];
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = history.filter(ts => ts > weekAgo);
  if (recent.length >= 2) return alert("表示名は7日間に2回まで変更可能です。");
  users[currentUser].displayName = newName;
  users[currentUser].nameChanges = [...recent, now];
  saveUsers();
  alert("表示名変更完了！");
}

// ========== フレンド・チャット ==========
function refreshFriendList() {
  const list = document.getElementById("friendList");
  list.innerHTML = "";
  users[currentUser].friends.forEach(friend => {
    const btn = document.createElement("button");
    btn.textContent = `${friend} (${users[friend].displayName})`;
    btn.onclick = () => openChat(friend);
    list.appendChild(btn);
  });
}

function searchFriend() {
  const name = document.getElementById("searchFriendInput").value;
  const result = document.getElementById("searchResult");
  if (!users[name]) return result.textContent = "ユーザーが見つかりません。";
  if (name === currentUser) return result.textContent = "自分自身を追加できません。";
  if (users[currentUser].friends.includes(name)) return result.textContent = "既にフレンドです。";

  users[currentUser].friends.push(name);
  users[name].friends.push(currentUser);
  saveUsers();
  result.textContent = "フレンド追加しました！";
  refreshFriendList();
}

function openChat(friend) {
  currentChatFriend = friend;
  document.getElementById("chatWithTitle").textContent = `チャット相手: ${friend}`;
  const area = document.getElementById("chatArea");
  area.innerHTML = "";
  const chat = users[currentUser].chats[friend] || [];
  chat.forEach(msg => {
    const p = document.createElement("p");
    p.textContent = msg.from === currentUser ? "あなた: " + msg.text : `${friend}: ` + msg.text;
    p.className = "chat-message " + (msg.from === currentUser ? "user" : "friend");
    area.appendChild(p);
  });
  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatSendBtn").disabled = false;
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const msg = input.value;
  if (!msg || !currentChatFriend) return;
  const chatObj = { from: currentUser, to: currentChatFriend, text: msg, time: Date.now() };

  users[currentUser].chats[currentChatFriend] = users[currentUser].chats[currentChatFriend] || [];
  users[currentUser].chats[currentChatFriend].push(chatObj);

  users[currentChatFriend].chats[currentUser] = users[currentChatFriend].chats[currentUser] || [];
  users[currentChatFriend].chats[currentUser].push(chatObj);

  saveUsers();
  input.value = "";
  openChat(currentChatFriend);
}
