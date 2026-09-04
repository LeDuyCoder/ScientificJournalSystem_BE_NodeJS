import * as searchRepository from './search.repository.js';

export const performSearch = async (keyword, limit) => {
    return searchRepository.globalSearch(keyword, limit);
};
