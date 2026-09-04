export const getVolumesSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Lấy danh sách Volume có hỗ trợ phân trang, tìm kiếm và lọc",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        journal_id: { type: "string" },
        publication_year: { type: "integer" },
        search: { type: "string" },
        sort_by: { type: "string", enum: ["volume_id", "volume_number", "publication_year"], default: "volume_number" },
        sort_order: { type: "string", enum: ["asc", "desc"], default: "asc" },
      },
    },
  },
};

export const getVolumeByIdSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Lấy thông tin chi tiết một Volume theo ID",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const createVolumeSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Tạo mới một Volume",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["journal_id", "volume_number", "publication_year"],
      properties: {
        journal_id: { type: "integer", minimum: 1 },
        volume_number: { type: "integer", minimum: 1 },
        publication_year: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const updateVolumeSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Cập nhật thông tin Volume theo ID",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
    body: {
      type: "object",
      properties: {
        volume_number: { type: "integer", minimum: 1 },
        publication_year: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const deleteVolumeSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Xóa mềm một Volume theo ID",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const restoreVolumeSchema = {
  schema: {
    tags: ["Volume"],
    summary: "Khôi phục Volume đã xóa mềm theo ID",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};
