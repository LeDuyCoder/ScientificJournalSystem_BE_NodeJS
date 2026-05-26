export const getProfileData = async () => {
    // Giả lập dữ liệu lấy từ Database lên
    const mockUser = {
        id: "SE190001",
        username: "Nguyễn Văn A",
        role: "Backend Developer",
        skills: ["Node.js", "Express", "Flutter", "Java"]
    };
    
    return mockUser;
};