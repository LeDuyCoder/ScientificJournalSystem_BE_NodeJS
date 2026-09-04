import * as zonesRepository from './zones.repository.js';

export const getCountryStats = async (params) => {
    return zonesRepository.getCountryStats(params);
};

export const getRegionStats = async (params) => {
    return zonesRepository.getRegionStats(params);
};

export const getCountryRegionsStats = async (countryCode) => {
    return zonesRepository.getCountryRegionsStats(countryCode);
};

export const zoneExist = async (id) => {
    return zonesRepository.zoneExist(id);
};
