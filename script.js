// script.js（統合バージョン：ログイン、ホーム、設定画面分離版）

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
  if (savedUser && loggedOut !== "true" && users[savedUser]) {
    currentUser = savedUser;
    showHome();
  } else {
    showStartScreen();
  }
};

// ========== パスワードバリデーション ==========
function validatePassword(pw) {
  if (pw.length < 10) return { valid: false, message: "パスワードは10文字以上必要です。" };
  if (!/^[a-zA-Z0-9%@#\$&\*!\?\^\~]+$/.test(pw)) return { valid: false, message: "使えるのは英字・数字・記号（%@#$&*!?^~）だけです。" };
  if (!/[%@#\$&\*!\?\^\~]/.test(pw)) return { valid: false, message: "記号を1文字以上含めてください。" };
  if (!/\d/.test(pw)) return { valid: false, message: "数字を1文字以上含めてください。" };
  if (!/[a-zA-Z]/.test(pw)) return { valid: false, message: "英字を1文字以上含めてください。" };
  return { valid: true, message: "" };
}

// ========== 画面表示切り替え ==========
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
  document.getElementById("userDisplaynameSpan").textContent = users[currentUser].displayName || currentUser;
  refreshFriendList();
  document.getElementById("chatWithTitle").textContent = "チャット相手を選択してください";
  document.getElementById("chatArea").innerHTML = "";
  document.getElementById("chatInput").value = "";
  document.getElementById("chatInput").disabled = true;
  document.getElementById("chatSendBtn").disabled = true;
}

function showSettings() {
  document.getElementById("main-screen").classList.add("hidden");
  document.getElementById("settings-screen").classList.remove("hidden");
  const iconData = users[currentUser].icon;
  const preview = document.getElementById("iconPreview");
  if (iconData) {
    preview.src = iconData;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
  document.getElementById("displayNameInput").value = users[currentUser].displayName || "";
}

function backToHomeFromSettings() {
  document.getElementById("settings-screen").classList.add("hidden");
  document.getElementById("main-screen").classList.remove("hidden");
}

// ========== 登録・ログイン ==========
function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!username) return alert("ユーザー名を入力してください。");
  const result = validatePassword(password);
  if (!result.valid) return alert("パスワードエラー: " + result.message);
  if (users[username]) return alert("既に登録されています。");

  users[username] = {
    password,
    displayName: username,
    icon: "",
    nameChanges: [],
    friends: [],
    chats: {}
  };
  saveUsers();
  alert("登録完了！ログインしてください。");
  showLogin();
}

function loginWithForm() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!users[username] || users[username].password !== password) return alert("ログイン失敗。ユーザー名またはパスワードが正しくありません。");
  currentUser = username;
  localStorage.setItem("currentUser", currentUser);
  localStorage.setItem("loggedOut", "false");
  showHome();
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  localStorage.setItem("loggedOut", "true");
  showStartScreen();
}

// ========== フレンド機能 ==========
function searchFriend() {
  const input = document.getElementById("searchFriendInput").value.trim();
  const resultDiv = document.getElementById("searchResult");
  resultDiv.innerHTML = "";
  if (!input) return alert("ユーザー名を入力してください。");
  if (!users[input]) return resultDiv.textContent = "ユーザーが見つかりません。";
  if (input === currentUser) return resultDiv.textContent = "自分自身は追加できません。";
  if (users[currentUser].friends.includes(input)) return resultDiv.textContent = "すでにフレンドです。";

  const btn = document.createElement("button");
  btn.textContent = input + " をフレンドに追加";
  btn.onclick = () => {
    users[currentUser].friends.push(input);
    users[input].friends.push(currentUser);
    saveUsers();
    alert(input + " をフレンドに追加しました。");
    resultDiv.innerHTML = "";
    refreshFriendList();
  };
  resultDiv.appendChild(btn);
}

function refreshFriendList() {
  const friendList = document.getElementById("friendList");
  friendList.innerHTML = "";
  users[currentUser].friends.forEach(friend => {
    const btn = document.createElement("button");
    btn.textContent = friend;
    btn.onclick = () => startChat(friend);
    friendList.appendChild(btn);
  });
}

// ========== チャット ==========
function startChat(friend) {
  currentChatFriend = friend;
  document.getElementById("chatWithTitle").textContent = friend + " さんとのチャット";
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = "";
  const messages = users[currentUser].chats[friend] || [];
  messages.forEach(msg => {
    addMessageToChat(msg.sender === currentUser ? "user" : "friend", msg.text);
  });
  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatSendBtn").disabled = false;
}

function sendMessage() {
  const text = document.getElementById("chatInput").value.trim();
  if (!text || !currentChatFriend) return;
  const msg = { sender: currentUser, text };
  users[currentUser].chats[currentChatFriend] = users[currentUser].chats[currentChatFriend] || [];
  users[currentChatFriend].chats[currentUser] = users[currentChatFriend].chats[currentUser] || [];
  users[currentUser].chats[currentChatFriend].push(msg);
  users[currentChatFriend].chats[currentUser].push(msg);
  saveUsers();
  addMessageToChat("user", text);
  document.getElementById("chatInput").value = "";
}

function addMessageToChat(type, text) {
  const chatArea = document.getElementById("chatArea");
  const div = document.createElement("div");
  div.className = "chat-message " + type;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ========== 設定変更 ==========
function changeDisplayName() {
  const input = document.getElementById("displayNameInput").value.trim();
  const now = Date.now();
  const history = users[currentUser].nameChanges || [];
  users[currentUser].nameChanges = history.filter(t => now - t < 7 * 24 * 60 * 60 * 1000);
  if (users[currentUser].nameChanges.length >= 2) {
    alert("表示名は7日間に2回まで変更できます。");
    return;
  }
  users[currentUser].displayName = input;
  users[currentUser].nameChanges.push(now);
  saveUsers();
  alert("表示名を変更しました。");
  showSettings();
}

function changeIcon() {
  const input = document.getElementById("iconFileInput");
  if (!input.files[0]) return alert("画像を選択してください。");
  const reader = new FileReader();
  reader.onload = e => {
    users[currentUser].icon = e.target.result;
    saveUsers();
    alert("アイコンを変更しました。");
    showSettings();
  };
  reader.readAsDataURL(input.files[0]);
}

document.getElementById("iconFileInput").addEventListener("change", function () {
  const preview = document.getElementById("iconPreview");
  if (this.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(this.files[0]);
  } else {
    preview.style.display = "none";
  }
});
