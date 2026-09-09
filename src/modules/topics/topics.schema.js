export const getTopicsSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Lấy danh sách Topic",
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        search: { type: "string" },
        subject_area_id: { type: "integer" },
        subject_category_id: { type: "integer" },
        sort_by: { type: "string", default: "display_name" },
        sort_order: { type: "string", enum: ["asc", "desc"], default: "asc" },
      },
    },
  },
};

export const getTopicByIdSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Lấy chi tiết Topic",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const getArticlesByTopicSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Lấy danh sách bài báo thuộc Topic",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
      },
    },
  },
};

export const createTopicSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Tạo mới Topic",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["display_name"],
      properties: {
        display_name: { type: "string" },
        score: { type: "number" },
        subject_area_id: { type: "integer" },
        subject_category_id: { type: "integer" },
      },
    },
  },
};

export const updateTopicSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Cập nhật thông tin Topic",
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
        score: { type: "number" },
        subject_area_id: { type: "integer" },
        subject_category_id: { type: "integer" },
      },
    },
  },
};

export const deleteTopicSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Xóa mềm một Topic theo ID",
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

export const restoreTopicSchema = {
  schema: {
    tags: ["Topic"],
    summary: "Khôi phục Topic đã xóa mềm theo ID",
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
