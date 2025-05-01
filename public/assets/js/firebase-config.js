// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyALcgAlyKSvk5wVRJMccFTfzI3Crvg4juY",
    authDomain: "bambux-social.firebaseapp.com",
    projectId: "bambux-social",
    storageBucket: "bambux-social.firebasestorage.app",
    messagingSenderId: "189043360246",
    appId: "1:189043360246:web:07454636f819e7c75b47d7"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Hàm cập nhật thông tin người dùng
function updateUserData(data) {
    const user = firebase.autbambux-social.firebasestorage.apph().currentUser;
    if (!user) return Promise.reject(new Error('Không có người dùng đăng nhập'));
    
    const db = firebase.firestore();
    return db.collection('users').doc(user.uid).set(data, { merge: true });
      }
