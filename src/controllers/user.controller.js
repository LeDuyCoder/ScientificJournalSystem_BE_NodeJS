import * as userService from '../services/user.service.js';

export const getUserProfile = async (req, res) => {
    try {
        // Gọi xuống tầng Service để lấy logic xử lý dữ liệu
        const data = await userService.getProfileData();
        
        return res.status(200).json({
            success: true,
            message: "Lấy thông tin thành công!",
            data: data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
};