/**
 * Data Transfer Object cho biểu đồ Trending Keywords.
 * Chuyển đổi dữ liệu raw query thành format tương thích với frontend chart.
 */
export class TrendingKeywordChartDTO {
  /**
   * @param {Array<Object>} rows - Dữ liệu thô từ repository.
   * @param {string} metric - Metric đang được truy vấn (articleCount, citationCount, avgScore).
   */
  constructor(rows, metric) {
    this.type = "horizontal-bar";
    this.metric = metric;
    
    // Khởi tạo mảng labels và mảng data
    this.labels = [];
    const dataValues = [];

    // Map các trường dữ liệu
    for (const row of rows) {
      this.labels.push(row.keyword);
      if (metric === 'articleCount') {
        dataValues.push(Number(row.articleCount));
      } else if (metric === 'citationCount') {
        dataValues.push(Number(row.citationCount));
      } else if (metric === 'avgScore') {
        // Format điểm trung bình làm tròn 2 chữ số thập phân
        dataValues.push(Number(parseFloat(row.avgScore).toFixed(2)));
      } else {
        dataValues.push(Number(row.articleCount)); // Default
      }
    }

    // Set dataset label dựa trên metric
    let datasetLabel = "Number of Articles";
    if (metric === 'citationCount') {
      datasetLabel = "Total Citations";
    } else if (metric === 'avgScore') {
      datasetLabel = "Average Score";
    }

    this.datasets = [
      {
        label: datasetLabel,
        data: dataValues
      }
    ];
  }
}
