/**
 * Middleware kiểm tra tính hợp lệ của query parameters cho API Publication Trends.
 */
export const validatePublicationTrendsQuery = (req, res, next) => {
  const { projectId, fromYear, toYear } = req.query;

  // 1. Kiểm tra projectId (Optional, kiểu số nguyên dương/bigint)
  if (projectId !== undefined && projectId !== null) {
    const pId = Number(projectId);
    if (!Number.isInteger(pId) || pId <= 0) {
      return res.status(400).json({
        success: false,
        message: "projectId phải là số nguyên dương",
        code: "INVALID_PROJECT_ID",
        data: null
      });
    }
  }

  // 2. Kiểm tra fromYear (Optional, kiểu số nguyên)
  let fYear = null;
  if (fromYear !== undefined && fromYear !== null) {
    fYear = Number(fromYear);
    if (!Number.isInteger(fYear) || fYear <= 0) {
      return res.status(400).json({
        success: false,
        message: "fromYear phải là số nguyên dương hợp lệ",
        code: "INVALID_FROM_YEAR",
        data: null
      });
    }
  }

  // 3. Kiểm tra toYear (Optional, kiểu số nguyên)
  let tYear = null;
  if (toYear !== undefined && toYear !== null) {
    tYear = Number(toYear);
    if (!Number.isInteger(tYear) || tYear <= 0) {
      return res.status(400).json({
        success: false,
        message: "toYear phải là số nguyên dương hợp lệ",
        code: "INVALID_TO_YEAR",
        data: null
      });
    }
  }

  // 4. Kiểm tra logic fromYear <= toYear
  if (fYear !== null && tYear !== null && fYear > tYear) {
    return res.status(400).json({
      success: false,
      message: "fromYear không được lớn hơn toYear",
      code: "INVALID_YEAR_RANGE",
      data: null
    });
  }

  next();
};
