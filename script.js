// script.js（全体コード）

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
  document.getElementById("userDisplayname").textContent = users[currentUser].displayName || currentUser;
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

// ========== ユーザー管理 ==========
function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  if (!username) return alert("ユーザー名を入力してください。");
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
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (!users[username] || users[username].password !== password) return alert("ログイン情報が正しくありません。");
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

// ========== フレンド検索・追加 ==========
function searchFriend() {
  const input = document.getElementById("searchFriendInput").value.trim();
  const resultDiv = document.getElementById("searchResult");
  resultDiv.innerHTML = "";
  if (!input) {
    alert("ユーザー名を入力してください。");
    return;
  }
  if (!users[input]) {
    resultDiv.textContent = "ユーザーが見つかりません。";
    return;
  }
  if (input === currentUser) {
    resultDiv.textContent = "自分自身は追加できません。";
    return;
  }
  if (users[currentUser].friends.includes(input)) {
    resultDiv.textContent = "すでにフレンドです。";
    return;
  }

  // 追加ボタン表示
  const btn = document.createElement("button");
  btn.textContent = "フレンド追加：" + input;
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
  const friendListDiv = document.getElementById("friendList");
  friendListDiv.innerHTML = "";
  users[currentUser].friends.forEach(friend => {
    const btn = document.createElement("button");
    btn.textContent = friend + (users[friend].displayName ? ` (${users[friend].displayName})` : "");
    btn.onclick = () => {
      startChat(friend);
    };
    friendListDiv.appendChild(btn);
  });
}

// ========== チャット機能 ==========
function startChat(friend) {
  currentChatFriend = friend;
  document.getElementById("chatWithTitle").textContent = friend + " さんとチャット";
  const chatArea = document.getElementById("chatArea");
  chatArea.innerHTML = "";

  const chatKey1 = friend;
  const chatKey2 = currentUser;
  // 過去メッセージ読み込み
  const messages = users[currentUser].chats[friend] || [];
  messages.forEach(({ sender, text }) => {
    addMessageToChat(sender === currentUser ? "user" : "friend", text);
  });

  document.getElementById("chatInput").disabled = false;
  document.getElementById("chatSendBtn").disabled = false;
  document.getElementById("chatInput").focus();
}

function addMessageToChat(type, text) {
  const chatArea = document.getElementById("chatArea");
  const div = document.createElement("div");
  div.textContent = text;
  div.classList.add("chat-message");
  div.classList.add(type === "user" ? "user" : "friend");
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;
  if (!currentChatFriend) {
    alert("チャット相手を選択してください。");
    return;
  }
  // 自分のチャットに追加
  users[currentUser].chats[currentChatFriend] = users[currentUser].chats[currentChatFriend] || [];
  users[currentUser].chats[currentChatFriend].push({ sender: currentUser, text });

  // 相手のチャットにも追加（片方だけだと相手に見えないので）
  users[currentChatFriend].chats[currentUser] = users[currentChatFriend].chats[currentUser] || [];
  users[currentChatFriend].chats[currentUser].push({ sender: currentUser, text });

  saveUsers();
  addMessageToChat("user", text);
  input.value = "";
  input.focus();
}

// ========== 設定画面機能 ==========
function changeIcon() {
  const input = document.getElementById("iconFileInput");
  if (input.files.length === 0) {
    alert("画像ファイルを選択してください。");
    return;
  }
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    users[currentUser].icon = e.target.result;
    saveUsers();
    alert("アイコン変更完了！");
    showSettings();
  };
  reader.readAsDataURL(file);
}

function changeDisplayName() {
  const input = document.getElementById("displayNameInput");
  const newName = input.value.trim();
  if (!newName) return alert("表示名を入力してください。");

  const userData = users[currentUser];
  // 変更履歴を7日以内のものに限定
  const now = Date.now();
  userData.nameChanges = userData.nameChanges.filter(t => now - t < 7 * 24 * 60 * 60 * 1000);
  if (userData.nameChanges.length >= 2) {
    alert("表示名は7日間に2回までしか変更できません。");
    return;
  }
  userData.displayName = newName;
  userData.nameChanges.push(now);
  saveUsers();
  alert("表示名を変更しました。");
  showSettings();
}
  
// プレビュー画像表示
document.getElementById("iconFileInput").addEventListener("change", function () {
  const file = this.files[0];
  const preview = document.getElementById("iconPreview");
  if (!file) {
    preview.style.display = "none";
    return;
  }
  const reader = new FileReader();
  reader.onload = function (e) {
    preview.src = e.target.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
});
