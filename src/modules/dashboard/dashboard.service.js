import * as dashboardRepository from './dashboard.repository.js';
import logger from '../../utils/logger.js';

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

export const getTrendingKeywordsChart = async ({ userId, projectId, fromYear, toYear, metric = 'articleCount', limit = 10 }) => {
    if (projectId) {
        const isOwned = await dashboardRepository.projectBelongsToUser(projectId, userId);
        if (!isOwned) {
            const error = new Error('Dự án không tồn tại hoặc bạn không có quyền truy cập dự án này');
            error.statusCode = 403;
            error.code = 'FORBIDDEN';
            throw error;
        }
    }

    const activeMetric = metric || 'articleCount';
    const activeLimit = parseInt(limit, 10) || 10;

    const rows = await dashboardRepository.getTrendingKeywords({
        userId,
        projectId,
        fromYear: fromYear ? parseInt(fromYear, 10) : null,
        toYear: toYear ? parseInt(toYear, 10) : null,
        metric: activeMetric,
        limit: activeLimit
    });

    return formatTrendingKeywordChartData(rows, activeMetric);
};
