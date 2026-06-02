export const KEYWORD_CODES = {
  // Success
  KEYWORD_FETCHED: "KEYWORD_FETCHED",
  KEYWORD_LIST_FETCHED: "KEYWORD_LIST_FETCHED",
  KEYWORD_CREATED: "KEYWORD_CREATED",
  KEYWORD_UPDATED: "KEYWORD_UPDATED",
  KEYWORD_DELETED: "KEYWORD_DELETED",
  KEYWORD_RESTORED: "KEYWORD_RESTORED",

  // Client errors
  KEYWORD_INVALID_ID: "KEYWORD_INVALID_ID",
  KEYWORD_INVALID_BODY: "KEYWORD_INVALID_BODY",
  KEYWORD_NOT_FOUND: "KEYWORD_NOT_FOUND",
  KEYWORD_DUPLICATE: "KEYWORD_DUPLICATE",
  KEYWORD_ALREADY_DELETED: "KEYWORD_ALREADY_DELETED",
  KEYWORD_ALREADY_ACTIVE: "KEYWORD_ALREADY_ACTIVE",

  // Server error
  KEYWORD_SERVER_ERROR: "KEYWORD_SERVER_ERROR",
};
/**
 * Validate display_name cho keyword
 * Dùng cho POST và PUT
 */
export const validateKeywordBody = (req, res, next) => {
  const display_name = req.body.display_name?.trim();

  if (!display_name) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_BODY,
      message: "Tên keyword không được để trống",
    });
  }
  if (display_name.length < 2) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_BODY,
      message: "Tên keyword phải có ít nhất 2 ký tự",
    });
  }
  if (display_name.length > 255) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_BODY,
      message: "Tên keyword không được vượt quá 255 ký tự",
    });
  }
  if (/[!@#$%^&*()_+={}\[\]|\\:;"'<>,?\/~`]/.test(display_name)) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_BODY,
      message: "Tên keyword không được chứa ký tự đặc biệt",
    });
  }
  if (/<[^>]*>/.test(display_name)) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_BODY,
      message: "Tên keyword không được chứa HTML hoặc script",
    });
  }

  req.body.display_name = display_name;
  next();
};

export const validateKeywordId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      code: KEYWORD_CODES.KEYWORD_INVALID_ID,
      message: "ID không hợp lệ",
    });
  }

  req.keywordId = id;
  next();
};
