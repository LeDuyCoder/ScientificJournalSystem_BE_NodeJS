import { checkAuthorsExistence } from '../services/author.service.js';

/**
 * Middleware validate cho hành động tạo mới bài báo (POST)
 */
export const validateCreateArticle = async (req, res, next) => {
  try {
    const {
      title, publication_year, issue_id, primary_topic, 
      sub_topic, authors, keywords
    } = req.body;

    // 1. Validate các trường bắt buộc & kiểu dữ liệu cơ bản
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, code: 'TITLE_REQUIRED', message: 'Title is required' });
    }
    if (publication_year === undefined || publication_year === null) {
      return res.status(400).json({ success: false, code: 'PUB_YEAR_REQUIRED', message: 'Publication year is required' });
    }
    if (typeof publication_year !== 'number') {
      return res.status(400).json({ success: false, code: 'PUB_YEAR_INVALID', message: 'Publication year must be a number' });
    }
    if (issue_id !== undefined && issue_id !== null && typeof issue_id !== 'number') {
      return res.status(400).json({ success: false, code: 'ISSUE_ID_INVALID', message: 'Issue ID must be a number' });
    }
    if (primary_topic !== undefined && primary_topic !== null && typeof primary_topic !== 'number') {
      return res.status(400).json({ success: false, code: 'PRIMARY_TOPIC_INVALID', message: 'Primary topic must be a number' });
    }

    // 2. Validate mảng tác giả (authors)
    if (authors !== undefined) {
      if (!Array.isArray(authors)) {
        return res.status(400).json({ success: false, code: 'AUTHORS_MUST_BE_ARRAY', message: 'Authors must be an array of author IDs' });
      }
      if (!authors.every(id => Number.isInteger(id))) {
        return res.status(400).json({ success: false, code: 'AUTHOR_ID_MUST_BE_INT', message: 'Each author ID must be an integer' });
      }
    }

    // 3. Validate mảng chủ đề phụ (sub_topic)
    if (sub_topic !== undefined) {
      if (!Array.isArray(sub_topic)) {
        return res.status(400).json({ success: false, code: 'SUB_TOPIC_MUST_BE_ARRAY', message: 'Sub_topic must be an array of strings or IDs' });
      }
      if (!sub_topic.every(item => typeof item === 'string' || Number.isInteger(item))) {
        return res.status(400).json({ success: false, code: 'SUB_TOPIC_ITEM_INVALID', message: 'Each sub_topic item must be a string or integer' });
      }
    }

    // 4. Validate cấu trúc phức tạp của từ khóa (keywords)
    if (keywords !== undefined && keywords !== null) {
      if (Array.isArray(keywords)) {
        if (!keywords.every(kw => typeof kw === 'string')) {
          return res.status(400).json({ success: false, code: 'KEYWORD_ITEM_INVALID', message: 'Each keyword must be a string when keywords is an array' });
        }
      } else if (typeof keywords === 'object') {
        const invalidKeyword = Object.entries(keywords).find(
          ([keyword, score]) => typeof keyword !== 'string' || keyword.trim() === '' || typeof score !== 'number'
        );
        if (invalidKeyword) {
          return res.status(400).json({ success: false, code: 'KEYWORDS_OBJECT_INVALID', message: 'Keywords must be an object mapping string names to numeric scores' });
        }
      } else {
        return res.status(400).json({ success: false, code: 'KEYWORDS_TYPE_INVALID', message: 'Keywords must be an array or object' });
      }
    }

    // 5. Kiểm tra logic Database: Check xem danh sách tác giả có tồn tại hay không
    if (authors && authors.length > 0) {
      const authorIdsNotExist = await checkAuthorsExistence(authors);
      if (authorIdsNotExist.length > 0) {
        return res.status(400).json({
          success: false,
          code: 'AUTHORS_NOT_FOUND',
          message: `Các tác giả với ID sau không tồn tại: ${authorIdsNotExist.join(', ')}`
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, code: 'VALIDATION_ERROR', message: 'Lỗi hệ thống trong quá trình validate bài báo', error: error.message });
  }
};

/**
 * Middleware validate cho hành động cập nhật bài báo (PUT)
 */
export const validateUpdateArticle = async (req, res, next) => {
  try {
    const dataBody = req.body;

    if (dataBody.sub_topic !== undefined && !Array.isArray(dataBody.sub_topic)) {
      return res.status(400).json({ success: false, code: 'SUB_TOPIC_MUST_BE_ARRAY', message: 'sub_topic phải là mảng' });
    }

    if (dataBody.authors !== undefined && !Array.isArray(dataBody.authors)) {
      return res.status(400).json({ success: false, code: 'AUTHORS_MUST_BE_ARRAY', message: 'authors phải là mảng' });
    }

    if (dataBody.keywords !== undefined) {
      if (Array.isArray(dataBody.keywords)) {
        if (!dataBody.keywords.every(kw => typeof kw === 'string')) {
          return res.status(400).json({ success: false, code: 'KEYWORD_ITEM_INVALID', message: 'Each keyword must be a string when keywords is an array' });
        }
      } else if (dataBody.keywords !== null && typeof dataBody.keywords === 'object') {
        const invalidKeyword = Object.entries(dataBody.keywords).find(
          ([keyword, score]) => typeof keyword !== 'string' || keyword.trim() === '' || typeof score !== 'number'
        );
        if (invalidKeyword) {
          return res.status(400).json({ success: false, code: 'KEYWORDS_OBJECT_INVALID', message: 'Keywords must be an object mapping string names to numeric scores' });
        }
      } else {
        return res.status(400).json({ success: false, code: 'KEYWORDS_TYPE_INVALID', message: 'Keywords must be an array or object' });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, code: 'VALIDATION_ERROR', message: 'Lỗi hệ thống trong quá trình validate bài báo', error: error.message });
  }
};

/**
 * Middleware validate định dạng param ID chung cho các route GET/:id, PUT/:id, DELETE/:id
 */
export const validateArticleParams = (req, res, next) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_ARTICLE_ID',
      message: 'ID bài báo phải là một số nguyên hợp lệ'
    });
  }
  next();
};