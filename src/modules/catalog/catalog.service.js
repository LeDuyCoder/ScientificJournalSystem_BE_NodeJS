import * as catalogRepository from './catalog.repository.js';

export const getSubjectAreas = async () => {
    return catalogRepository.getSubjectAreas();
};

export const getSubjectCategories = async ({ subjectAreaId }) => {
    return catalogRepository.getSubjectCategories({ subjectAreaId });
};

export const getJournalRankings = async (journalId, filters = {}) => {
    const list = await catalogRepository.getJournalRankings(journalId, filters);
    
    const grouped = {};
    for (const item of list) {
        const yr = String(item.year);
        if (!grouped[yr]) {
            grouped[yr] = [];
        }
        grouped[yr].push(item);
    }
    return grouped;
};

export const getVolumes = async ({ journalId, page, limit }) => {
    return catalogRepository.getVolumes({ journalId, page, limit });
};

export const getIssues = async ({ volumeId, page, limit }) => {
    return catalogRepository.getIssues({ volumeId, page, limit });
};
