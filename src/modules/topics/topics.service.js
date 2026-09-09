import * as topicsRepository from "./topics.repository.js";
import pool from "../../config/database.js";

// Tránh import chéo
export const subjectAreaExist = async (id) => {
    const query = `SELECT 1 FROM "Subject_Area" WHERE subject_area_id = $1`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const subjectCategoryExist = async (id) => {
    const query = `SELECT 1 FROM "Subject_Category" WHERE subject_category_id = $1`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const getTopicById = async (topicId) => {
    return await topicsRepository.getTopicById(topicId);
};

export const checkDuplicateTopic = async (displayName, excludeId = null) => {
    return await topicsRepository.checkDuplicateTopic(displayName, excludeId);
};

export const createTopic = async (data) => {
    return await topicsRepository.createTopic(data);
};

export const getTopics = async (params) => {
    return await topicsRepository.getTopics(params);
};

export const getArticlesByTopicId = async (topicId, limit = 10, offset = 0) => {
    return await topicsRepository.getArticlesByTopicId(topicId, limit, offset);
};

export const countArticlesByTopicId = async (topicId) => {
    return await topicsRepository.countArticlesByTopicId(topicId);
};

export const createSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    return await topicsRepository.createSubTopicArticleRelationships(articleId, topicIds, primaryTopicId);
};

export const updateSubTopicArticleRelationships = async (articleId, topicIds, primaryTopicId) => {
    return await topicsRepository.updateSubTopicArticleRelationships(articleId, topicIds, primaryTopicId);
};

export const topicExists = async (topicId) => {
    return await topicsRepository.topicExists(topicId);
};

export const topicIsDeleted = async (id) => {
    return await topicsRepository.topicIsDeleted(id);
};

export const updateTopic = async (id, data) => {
    return await topicsRepository.updateTopic(id, data);
};

export const deleteTopic = async (id) => {
    return await topicsRepository.deleteTopic(id);
};

export const restoreTopic = async (id) => {
    return await topicsRepository.restoreTopic(id);
};
