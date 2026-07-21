import * as searchService from '../services/search.service.js';
import logger from '../utils/logger.js';

export const search = async (req, res) => {
    const { keyword } = req.params;
    
    // Safety check for empty keyword just in case middleware is bypassed
    if (!keyword || !keyword.trim()) {
        return res.status(400).json({
            success: false,
            code: 'INVALID_KEYWORD',
            message: 'Keyword không được để trống'
        });
    }

    // Sanitize and parse limit
    let limit = Number(req.query.limit) || 20;
    if (limit <= 0) limit = 20;
    if (limit > 100) limit = 100; // Cap at 100 for safety

    try {
        // Trim special regex characters if they can cause Meilisearch parse issues,
        // although modern Meilisearch handle them well. We will pass trimmed keyword.
        const result = await searchService.search(
            keyword.trim(),
            limit
        );

        return res.status(200).json({
            success: true,
            code: 'SEARCH_SUCCESS',        
            data: result
        });
    } catch (error) {
        logger.error('Lỗi khi thực hiện controller search:', error);
        return res.status(500).json({
            success: false,
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Lỗi hệ thống khi tìm kiếm'
        });
    }
};