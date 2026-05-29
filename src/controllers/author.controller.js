import * as authorService from "../services/author.service.js";

export const authorServiceRef = { ...authorService };

export const getAuthorAreasBreakdown = async (req, res) => {
    try {

        const authorId = Number(req.params.id);

        if (!Number.isInteger(authorId) || authorId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'ID tác giả không hợp lệ'
            });
        }

        //call service
        const authorInfo = await authorServiceRef.getAuthorById(authorId);
        const areasBreakdown = await authorServiceRef.getAuthorAreasBreakdownService(authorId);
        
        
        // 5. Trả response
        return res.status(200).json({
            success: true,
            message: "Phân tích lĩnh vực nghiên cứu của tác giả thành công",
            data: {
                ...authorInfo,
                "breakdown": areasBreakdown
            }
        });
    } catch (error) {
        console.error('getArticlesByKeywords error:', error);
        return res.status(500).json({
            success: false,
            message: "Có lỗi xảy ra ở Server!"
        });
    }
}