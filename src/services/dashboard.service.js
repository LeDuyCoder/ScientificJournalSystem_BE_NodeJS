import * as dashboardRepository from '../repositories/dashboard.repository.js';
import logger from '../utils/logger.js';

/**
 * Định dạng dữ liệu raw repository thành format tương thích với frontend chart.
 * Thay thế cho TrendingKeywordChartDTO class cũ.
 *
 * @param {Array<Object>} rows - Dữ liệu thô từ repository.
 * @param {string} metric - Metric đang được truy vấn (articleCount, citationCount, avgScore).
 * @returns {Object} Dữ liệu biểu đồ định dạng hoàn chỉnh.
 */
const formatTrendingKeywordChartData = (rows, metric) => {
  const labels = [];
  const dataValues = [];

  for (const row of rows) {
    labels.push(row.keyword);
    if (metric === 'articleCount') {
      dataValues.push(Number(row.articleCount));
    } else if (metric === 'citationCount') {
      dataValues.push(Number(row.citationCount));
    } else if (metric === 'avgScore') {
      dataValues.push(Number(parseFloat(row.avgScore).toFixed(2)));
    } else {
      dataValues.push(Number(row.articleCount));
    }
  }

  let datasetLabel = "Number of Articles";
  if (metric === 'citationCount') {
    datasetLabel = "Total Citations";
  } else if (metric === 'avgScore') {
    datasetLabel = "Average Score";
  }

  return {
    type: "horizontal-bar",
    metric: metric,
    labels: labels,
    datasets: [
      {
        label: datasetLabel,
        data: dataValues
      }
    ]
  };
};

/**
 * Lấy danh sách thống kê xu hướng từ khóa của user (Trending Keywords) định dạng biểu đồ.
 *
 * @async
 * @param {Object} params
 * @param {string} params.userId - UUID của người dùng.
 * @param {string|number|null} params.projectId - ID của project (optional).
 * @param {number|null} params.fromYear - Năm bắt đầu (optional).
 * @param {number|null} params.toYear - Năm kết thúc (optional).
 * @param {string} [params.metric='articleCount'] - Chỉ số thống kê (articleCount, citationCount, avgScore).
 * @param {number} [params.limit=10] - Giới hạn số lượng từ khóa.
 * @returns {Promise<Object>} Dữ liệu biểu đồ hoàn thiện.
 * @throws {Error} Ném lỗi 403 nếu dự án không thuộc quyền sở hữu của user.
 */
export const getTrendingKeywordsChart = async ({ userId, projectId, fromYear, toYear, metric = 'articleCount', limit = 10 }) => {
  try {
    // 1. Kiểm tra Project có thuộc về User không nếu có truyền projectId
    if (projectId) {
      const isOwned = await dashboardRepository.projectBelongsToUser(projectId, userId);
      if (!isOwned) {
        const error = new Error('Dự án không tồn tại hoặc bạn không có quyền truy cập dự án này');
        error.statusCode = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }
    }

    // 2. Định nghĩa mặc định cho các tham số tùy chọn
    const activeMetric = metric || 'articleCount';
    const activeLimit = parseInt(limit, 10) || 10;

    // 3. Thực hiện truy vấn dữ liệu từ DB
    const rows = await dashboardRepository.getTrendingKeywords({
      userId,
      projectId,
      fromYear,
      toYear,
      metric: activeMetric,
      limit: activeLimit
    });

    // 4. Map dữ liệu trả về qua formatter
    return formatTrendingKeywordChartData(rows, activeMetric);
  } catch (error) {
    logger.error('[Dashboard Service] Lỗi khi xử lý getTrendingKeywordsChart:', error.message);
    throw error;
  }
};
