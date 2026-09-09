import * as issuesRepository from "./issues.repository.js";
import pool from "../../config/database.js";

// Tránh import chéo
export const volumeExist = async (id) => {
    const query = `SELECT 1 FROM "Volume" WHERE volume_id = $1 AND is_deleted = false`;
    const result = await pool.query(query, [BigInt(id)]);
    return result.rows.length > 0;
};

export const getIssues = async (params) => {
    return await issuesRepository.getIssues(params);
};

export const issueExist = async (id) => {
    return await issuesRepository.issueExist(id);
};

export const issueIsDeleted = async (id) => {
    return await issuesRepository.issueIsDeleted(id);
};

export const checkDuplicateIssue = async (volume_id, issue_number, excludeId = null) => {
    return await issuesRepository.checkDuplicateIssue(volume_id, issue_number, excludeId);
};

export const createIssue = async (data) => {
    return await issuesRepository.createIssue(data);
};

export const getIssueById = async (id) => {
    return await issuesRepository.getIssueById(id);
};

export const getIssueByIdInternal = async (id) => {
    return await issuesRepository.getIssueByIdInternal(id);
};

export const updateIssue = async (id, data) => {
    return await issuesRepository.updateIssue(id, data);
};

export const deleteIssue = async (id) => {
    return await issuesRepository.deleteIssue(id);
};

export const restoreIssue = async (id) => {
    return await issuesRepository.restoreIssue(id);
};
