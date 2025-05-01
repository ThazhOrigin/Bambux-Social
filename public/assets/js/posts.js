// Hàm tạo bài đăng mới
function createPost(content, imageFile = null) {
    const user = firebase.auth().currentUser;
    if (!user) return Promise.reject(new Error('Không có người dùng đăng nhập'));
    
    const db = firebase.firestore();
    
    // Chuẩn bị dữ liệu bài đăng
    const postData = {
        userId: user.uid,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        comments: []
    };
    
    // Nếu có hình ảnh, tải lên Storage
    if (imageFile) {
        const storageRef = firebase.storage().ref();
        const imageRef = storageRef.child(`posts/${user.uid}/${Date.now()}_${imageFile.name}`);
        
        return imageRef.put(imageFile)
            .then(() => {
                return imageRef.getDownloadURL();
            })
            .then((url) => {
                postData.imageURL = url;
                return db.collection('posts').add(postData);
            });
    } else {
        return db.collection('posts').add(postData);
    }
}

// Hàm tải bài đăng gần đây
function loadRecentPosts() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '<p class="loading">Đang tải bài đăng...</p>';
    
    const db = firebase.firestore();
    
    db.collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                postsContainer.innerHTML = '<p class="loading">Chưa có bài đăng nào.</p>';
                return;
            }
            
            // Xóa thông báo "đang tải"
            postsContainer.innerHTML = '';
            
            // Mảng chứa các promise lấy thông tin người dùng
            const userPromises = [];
            
            // Tạo các phần tử bài đăng
            querySnapshot.forEach((doc) => {
                const postData = doc.data();
                const postId = doc.id;
                
                // Lấy thông tin người dùng đăng bài
                const userPromise = db.collection('users').doc(postData.userId).get()
                    .then((userDoc) => {
                        const userData = userDoc.exists ? userDoc.data() : { displayName: 'Người dùng không xác định' };
                        
                        // Tạo HTML cho bài đăng
                        const postElement = createPostElement(postId, postData, userData);
                        postsContainer.appendChild(postElement);
                    });
                
                userPromises.push(userPromise);
            });
            
            // Đợi tất cả thông tin người dùng được tải xong
            return Promise.all(userPromises);
        })
        .catch((error) => {
            console.error('Error loading posts: ', error);
            postsContainer.innerHTML = '<p class="loading">Có lỗi khi tải bài đăng. Vui lòng thử lại.</p>';
        });
}

// Hàm tạo phần tử HTML cho bài đăng
function createPostElement(postId, postData, userData) {
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.id = `post-${postId}`;
    
    // Format thời gian
    const timestamp = postData.createdAt ? postData.createdAt.toDate() : new Date();
    const timeString = formatTime(timestamp);
    
    // HTML cho bài đăng
    let postHTML = `
        <div class="post-header">
            <img src="${userData.photoURL || 'assets/images/default-avatar.png'}" alt="Avatar" class="avatar">
            <div class="post-user-info">
                <div class="post-user-name">${userData.displayName || userData.email || 'Người dùng không xác định'}</div>
                <div class="post-timestamp">${timeString}</div>
            </div>
        </div>
        <div class="post-content">
            <p class="post-text">${postData.content}</p>
    `;
    
    // Nếu có hình ảnh, thêm vào
    if (postData.imageURL) {
        postHTML += `<img src="${postData.imageURL}" alt="Post image" class="post-image">`;
    }
    
    postHTML += `
        </div>
        <div class="post-actions">
            <button class="post-action-btn like-btn" data-post-id="${postId}">
                <i class="far fa-heart"></i> Thích (${postData.likes || 0})
            </button>
            <button class="post-action-btn comment-btn" data-post-id="${postId}">
                <i class="far fa-comment"></i> Bình luận (${postData.comments ? postData.comments.length : 0})
            </button>
        </div>
    `;
    
    postElement.innerHTML = postHTML;
    
    // Thêm sự kiện cho nút Thích
    const likeBtn = postElement.querySelector('.like-btn');
    likeBtn.addEventListener('click', () => {
        likePost(postId);
    });
    
    return postElement;
}

// Hàm định dạng thời gian
function formatTime(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
    } else if (diffDays < 30) {
        return `${diffDays} ngày trước`;
    } else {
        return date.toLocaleDateString();
    }
}

// Hàm thích bài đăng
function likePost(postId) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const db = firebase.firestore();
    const postRef = db.collection('posts').doc(postId);
    
    // Sử dụng transaction để cập nhật an toàn
    return db.runTransaction((transaction) => {
        return transaction.get(postRef).then((postDoc) => {
            if (!postDoc.exists) {
                throw new Error('Bài đăng không tồn tại!');
            }
            
            const postData = postDoc.data();
            const newLikes = (postData.likes || 0) + 1;
            
            transaction.update(postRef, { likes: newLikes });
            
            // Cập nhật UI
            const likeBtn = document.querySelector(`.like-btn[data-post-id="${postId}"]`);
            if (likeBtn) {
                likeBtn.innerHTML = `<i class="fas fa-heart"></i> Thích (${newLikes})`;
                likeBtn.classList.add('liked');
            }
            
            return newLikes;
        });
    }).catch((error) => {
        console.error('Error liking post: ', error);
    });
}

// Hàm lấy bài đăng của người dùng
function getUserPosts(userId, container) {
    const db = firebase.firestore();
    
    db.collection('posts')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                container.innerHTML = '<p class="loading">Bạn chưa có bài đăng nào.</p>';
                return;
            }
            
            // Xóa thông báo "đang tải"
            container.innerHTML = '';
            
            // Lấy thông tin người dùng
            return db.collection('users').doc(userId).get().then((userDoc) => {
                const userData = userDoc.exists ? userDoc.data() : { displayName: 'Người dùng không xác định' };
                
                // Tạo các phần tử bài đăng
                querySnapshot.forEach((doc) => {
                    const postData = doc.data();
                    const postId = doc.id;
                    
                    // Tạo HTML cho bài đăng
                    const postElement = createPostElement(postId, postData, userData);
                    container.appendChild(postElement);
                });
            });
        })
        .catch((error) => {
            console.error('Error loading user posts: ', error);
            container.innerHTML = '<p class="loading">Có lỗi khi tải bài đăng. Vui lòng thử lại.</p>';
        });
}