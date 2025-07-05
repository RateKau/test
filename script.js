// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyC6xyiIqoZIzV9dp0DbPzSVAd4yUhy01Bk",
  authDomain: "mysocialapp-e31d7.firebaseapp.com",
  projectId: "mysocialapp-e31d7",
  storageBucket: "mysocialapp-e31d7.firebasestorage.app",
  messagingSenderId: "264449039674",
  appId: "1:264449039674:web:252e87c2d47e410b1b4403",
  measurementId: "G-84HYP1FC5H"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let currentDM = null;

// ログイン状態の監視
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    document.getElementById("auth-section").style.display = "none";
    document.getElementById("home-section").style.display = "block";
    document.getElementById("welcome").textContent = `ようこそ ${user.email}`;
  }
});

// 新規登録
function register() {
  const email = document.getElementById("email").value;
  const pw = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, pw)
    .then(cred => {
      document.getElementById("message").textContent = `登録成功: ${cred.user.email}`;
      return db.collection("users").doc(cred.user.uid).set({
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        displayName: "",
        icon: "",
        friends: []
      });
    })
    .catch(e => document.getElementById("message").textContent = e.message);
}

// ログイン
function login() {
  const email = document.getElementById("email").value;
  const pw = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, pw)
    .then(cred => {
      document.getElementById("message").textContent = `ログイン成功: ${cred.user.email}`;
    })
    .catch(e => document.getElementById("message").textContent = e.message);
}

// ログアウト
function logout() {
  auth.signOut()
    .then(() => {
      currentUser = null;
      document.getElementById("auth-section").style.display = "block";
      document.getElementById("home-section").style.display = "none";
      document.getElementById("message").textContent = "ログアウトしました。";
    });
}

// 設定画面の表示
function showSettings() {
  document.getElementById("settings-section").style.display = "block";
}

// 設定画面の非表示
function hideSettings() {
  document.getElementById("settings-section").style.display = "none";
}

// プロフィール更新
function updateProfile() {
  const displayName = document.getElementById("displayName").value;
  const iconFile = document.getElementById("iconUpload").files[0];

  const userRef = db.collection("users").doc(currentUser.uid);
  userRef.update({ displayName });
  document.getElementById("message").textContent = "プロフィール更新完了";
}

// 検索画面の表示
function showSearch() {
  document.getElementById("search-section").style.display = "block";
}

// ユーザー検索
function searchUser() {
  const query = document.getElementById("searchQuery").value;
  db.collection("users").where("email", "==", query).get().then(snapshot => {
    const result = document.getElementById("searchResult");
    result.innerHTML = "";
    if (snapshot.empty) {
      result.textContent = "ユーザーが見つかりません";
    } else {
      snapshot.forEach(doc => {
        const div = document.createElement("div");
        div.textContent = doc.data().email;
        div.onclick = () => openDM(doc.id);
        result.appendChild(div);
      });
    }
  });
}

// DMを開く
function openDM(otherId) {
  document.getElementById("dm-section").style.display = "block";
  currentDM = [currentUser.uid, otherId].sort().join("_");
  const chatLog = document.getElementById("chatLog");
  chatLog.innerHTML = "読み込み中...";
  db.collection("chats").doc(currentDM).collection("messages").orderBy("timestamp")
    .onSnapshot(snapshot => {
      chatLog.innerHTML = "";
      snapshot.forEach(doc => {
        const msg = doc.data();
        const p = document.createElement("p");
        p.textContent = `${msg.sender}: ${msg.text}`;
        chatLog.appendChild(p);
      });
    });
}

// メッセージ送信
function sendMessage() {
  const text = document.getElementById("chatInput").value;
  if (!text || !currentDM) return;
  db.collection("chats").doc(currentDM).collection("messages").add({
    sender: currentUser.email,
    text,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("chatInput").value = "";
}
