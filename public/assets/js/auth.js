// Hàm đăng ký người dùng
function registerUser(email, password, displayName) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Lưu thông tin người dùng vào Firestore
            const user = userCredential.user;
            const db = firebase.firestore();
            
            return db.collection('users').doc(user.uid).set({
                displayName: displayName,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                photoURL: null,
                bio: ''
            });
        })
        .then(() => {
            // Chuyển hướng đến trang chủ
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error during registration: ', error);
            alert(`Lỗi đăng ký: ${error.message}`);
        });
}

// Hàm đăng nhập
function loginUser(email, password) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then(() => {
            // Chuyển hướng đến trang chủ
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error during login: ', error);
            alert(`Lỗi đăng nhập: ${error.message}`);
        });
}

// Hàm đăng xuất
function logoutUser() {
    firebase.auth().signOut()
        .then(() => {
            // Chuyển hướng đến trang đăng nhập
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error during logout: ', error);
            alert(`Lỗi đăng xuất: ${error.message}`);
        });
}

// Kiểm tra trạng thái đăng nhập
function checkAuthState() {
    firebase.auth().onAuthStateChanged((user) => {
        // Nếu không có trang đăng nhập/đăng ký và không có người dùng, chuyển hướng đến trang đăng nhập
        const isAuthPage = window.location.pathname.includes('login.html') || 
                          window.location.pathname.includes('register.html');
        
        if (!user && !isAuthPage) {
            window.location.href = 'login.html';
            return;
        }
        
        // Nếu đã đăng nhập và đang ở trang đăng nhập/đăng ký, chuyển hướng đến trang chủ
        if (user && isAuthPage) {
            window.location.href = 'index.html';
            return;
        }
        
        // Nếu đã đăng nhập, cập nhật thông tin người dùng trên UI
        if (user) {
            updateUserUI(user);
        }
    });
}

// Cập nhật UI với thông tin người dùng
function updateUserUI(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    
    if (!userNameElement || !userAvatarElement) return;
    
    // Lấy thông tin người dùng từ Firestore
    const db = firebase.firestore();
    db.collection('users').doc(user.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Cập nhật tên và ảnh đại diện
                userNameElement.textContent = userData.displayName || user.email;
                
                if (userData.photoURL) {
                    userAvatarElement.src = userData.photoURL;
                }
            } else {
                userNameElement.textContent = user.email;
            }
        })
        .catch((error) => {
            console.error('Error getting user data: ', error);
            userNameElement.textContent = user.email;
        });
    
    // Thêm sự kiện cho nút đăng xuất
    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
        logoutButton.addEventListener('click', logoutUser);
    }
}