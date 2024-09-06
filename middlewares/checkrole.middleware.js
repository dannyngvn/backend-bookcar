const  roleCheck = (role) => {
    return function (req, res, next) {
        const userRole = req.role; // Vai trò của người dùng, giả sử lưu trong req.user.role
console.log(userRole)
        if (userRole === role) {
            next(); // Người dùng có quyền, tiếp tục xử lý
        } else {
            res.status(403).json({ message: 'Bạn không có quyền truy cập!' }); // Người dùng không có quyền
        }
    };
}
export default roleCheck