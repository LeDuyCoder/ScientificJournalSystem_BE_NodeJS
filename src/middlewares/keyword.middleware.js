/**
 * Validate display_name cho keyword
 * Dùng cho POST và PUT
 */
export const validateKeywordBody = (req, res, next) => {
  const display_name = req.body.display_name?.trim();

  if (!display_name) {
    return res.status(400).json({
      success: false,
      message: "Tên keyword không được để trống",
    });
  }

  if (display_name.length < 2) {
    return res.status(400).json({
      success: false,
      message: "Tên keyword phải có ít nhất 2 ký tự",
    });
  }

  if (display_name.length > 255) {
    return res.status(400).json({
      success: false,
      message: "Tên keyword không được vượt quá 255 ký tự",
    });
  }

  if (/[!@#$%^&*()_+={}\[\]|\\:;"'<>,?\/~`]/.test(display_name)) {
    return res.status(400).json({
      success: false,
      message: "Tên keyword không được chứa ký tự đặc biệt",
    });
  }

  if (/<[^>]*>/.test(display_name)) {
    return res.status(400).json({
      success: false,
      message: "Tên keyword không được chứa HTML hoặc script",
    });
  }

  // Gắn display_name đã trim vào req.body để controller dùng luôn
  req.body.display_name = display_name;
  next();
};

/**
 * Validate keyword ID từ params
 * Dùng cho GET/:id, PUT, DELETE, PATCH restore
 */
export const validateKeywordId = (req, res, next) => {
  const id = parseInt(req.params.id);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "ID không hợp lệ",
    });
  }

  // Gắn id đã parse vào req để controller dùng luôn
  req.keywordId = id;
  next();
};
