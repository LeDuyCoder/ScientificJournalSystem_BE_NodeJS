export const createSubjectAreaSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Tạo mới một Subject Area",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["display_name"],
      properties: {
        display_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

export const getSubjectAreasSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Lấy danh sách Subject Area có hỗ trợ phân trang và tìm kiếm",
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        search: { type: "string" },
        sort_by: { type: "string", enum: ["subject_area_id", "display_name"], default: "display_name" },
        sort_order: { type: "string", enum: ["asc", "desc"], default: "asc" },
      },
    },
  },
};

export const getSubjectAreaByIdSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Lấy chi tiết một Subject Area theo ID",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const updateSubjectAreaSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Cập nhật thông tin một Subject Area theo ID",
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
        display_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

export const deleteSubjectAreaSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Xóa mềm một Subject Area theo ID",
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

export const restoreSubjectAreaSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Khôi phục Subject Area đã xóa mềm theo ID",
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

export const getSubjectAreaStatisticsSchema = {
  schema: {
    tags: ["Subject Area"],
    summary: "Thống kê số lượng journal, article, author theo Subject Area",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};
