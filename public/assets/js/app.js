// Khởi tạo ứng dụng khi trang đã tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái đăng nhập
    checkAuthState();
    
    // Xử lý form tạo bài đăng
    const createPostForm = document.getElementById('createPostBtn');
    if (createPostForm) {
        createPostForm.addEventListener('click', handleCreatePost);
    }
    
    // Xử lý nút thêm ảnh
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    const postImage = document.getElementById('postImage');
    if (addPhotoBtn && postImage) {
        addPhotoBtn.addEventListener('click', function() {
            postImage.click();
        });
    }
    
    // Tải bài đăng gần đây
    const postsContainer = document.getElementById('postsContainer');
    if (postsContainer) {
        loadRecentPosts();
    }
});

// Hàm xử lý tạo bài đăng mới
function handleCreatePost() {
    const contentInput = document.getElementById('postContent');
    const imageInput = document.getElementById('postImage');
    
    if (!contentInput) return;
    
    const content = contentInput.value.trim();
    if (!content) {
        alert('Vui lòng nhập nội dung bài đăng!');
        return;
    }
    
    // Kiểm tra xem có hình ảnh không
    const imageFile = imageInput && imageInput.files.length > 0 ? imageInput.files[0] : null;
    
    // Hiển thị trạng thái đang tải
    const createPostBtn = document.getElementById('createPostBtn');
    const originalText = createPostBtn.innerHTML;
    createPostBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng...';
    createPostBtn.disabled = true;
    
    // Tạo bài đăng
    createPost(content, imageFile)
        .then(() => {
            // Đặt lại form
            contentInput.value = '';
            if (imageInput) {
                imageInput.value = '';
            }
            
            // Tải lại bài đăng
            loadRecentPosts();
            
            // Đặt lại nút
            createPostBtn.innerHTML = originalText;
            createPostBtn.disabled = false;
        })
        .catch((error) => {
            console.error('Error creating post: ', error);
            alert('Có lỗi khi tạo bài đăng. Vui lòng thử lại.');
            
            // Đặt lại nút
            createPostBtn.innerHTML = originalText;
            createPostBtn.disabled = false;
        });
}