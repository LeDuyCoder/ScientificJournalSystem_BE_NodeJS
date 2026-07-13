/**
 * Middleware kiểm tra tính hợp lệ của query parameters cho API Trending Keywords.
 */
export const validateTrendingKeywordsQuery = (req, res, next) => {
  const { projectId, limit, fromYear, toYear, metric } = req.query;

  // 1. Kiểm tra projectId (Optional, số nguyên dương)
  if (projectId !== undefined && projectId !== null && projectId !== '') {
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

  // 2. Kiểm tra limit (Optional, số nguyên dương)
  if (limit !== undefined && limit !== null && limit !== '') {
    const lim = Number(limit);
    if (!Number.isInteger(lim) || lim <= 0) {
      return res.status(400).json({
        success: false,
        message: "limit phải là số nguyên dương",
        code: "INVALID_LIMIT",
        data: null
      });
    }
  }

  // 3. Kiểm tra fromYear (Optional, số nguyên dương)
  let fYear = null;
  if (fromYear !== undefined && fromYear !== null && fromYear !== '') {
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

  // 4. Kiểm tra toYear (Optional, số nguyên dương)
  let tYear = null;
  if (toYear !== undefined && toYear !== null && toYear !== '') {
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

  // 5. Kiểm tra logic fromYear <= toYear
  if (fYear !== null && tYear !== null && fYear > tYear) {
    return res.status(400).json({
      success: false,
      message: "fromYear không được lớn hơn toYear",
      code: "INVALID_YEAR_RANGE",
      data: null
    });
  }

  // 6. Kiểm tra metric (Optional, enum: articleCount | citationCount | avgScore)
  if (metric !== undefined && metric !== null && metric !== '') {
    const validMetrics = ['articleCount', 'citationCount', 'avgScore'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({
        success: false,
        message: "metric chỉ được nhận một trong các giá trị: articleCount, citationCount, avgScore",
        code: "INVALID_METRIC",
        data: null
      });
    }
  }

  next();
};
