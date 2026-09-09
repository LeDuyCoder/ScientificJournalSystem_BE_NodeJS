import * as volumesRepository from "./volumes.repository.js";
import pool from "../../config/database.js";

// Lấy từ db trực tiếp cho journalExist vì ko muốn import chéo gây lỗi hoặc ta có thể viết lại ở đây
export const journalExist = async (id) => {
  const query = `SELECT 1 FROM "Journal" WHERE journal_id = $1 AND is_deleted = false`;
  const result = await pool.query(query, [BigInt(id)]);
  return result.rows.length > 0;
};

export const volumeExist = async (id) => {
  return await volumesRepository.volumeExist(id);
};

export const volumeIsDeleted = async (id) => {
  return await volumesRepository.volumeIsDeleted(id);
};

export const checkDuplicateVolume = async (journalId, volumeNumber, excludeId = null) => {
  return await volumesRepository.checkDuplicateVolume(journalId, volumeNumber, excludeId);
};

export const createVolume = async (data) => {
  return await volumesRepository.createVolume(data);
};

export const getVolumes = async (params) => {
  return await volumesRepository.getVolumes(params);
};

export const getVolumeById = async (id) => {
  return await volumesRepository.getVolumeById(id);
};

export const getVolumeByIdInternal = async (id) => {
  return await volumesRepository.getVolumeByIdInternal(id);
};

export const updateVolume = async (id, data) => {
  return await volumesRepository.updateVolume(id, data);
};

export const deleteVolume = async (id) => {
  return await volumesRepository.deleteVolume(id);
};

export const restoreVolume = async (id) => {
  return await volumesRepository.restoreVolume(id);
};
