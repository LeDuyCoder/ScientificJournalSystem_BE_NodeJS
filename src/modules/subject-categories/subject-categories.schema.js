export const createSubjectCategorySchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Tạo mới một Subject Category",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["subject_area_id", "display_name"],
      properties: {
        subject_area_id: { type: "string" },
        display_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

export const getSubjectCategoriesSchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Lấy danh sách Subject Category có hỗ trợ phân trang, tìm kiếm và lọc",
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        search: { type: "string" },
        subject_area_id: { type: "string" },
        sort_by: { type: "string", enum: ["subject_category_id", "display_name", "subject_area_id"], default: "display_name" },
        sort_order: { type: "string", enum: ["asc", "desc"], default: "asc" },
      },
    },
  },
};

export const getSubjectCategoryByIdSchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Lấy chi tiết một Subject Category theo ID",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const updateSubjectCategorySchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Cập nhật thông tin một Subject Category theo ID",
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
        subject_area_id: { type: "string" },
        display_name: { type: "string" },
        description: { type: "string" },
      },
    },
  },
};

export const deleteSubjectCategorySchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Xóa mềm một Subject Category theo ID",
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

export const restoreSubjectCategorySchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Khôi phục Subject Category đã xóa mềm theo ID",
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

export const getSubjectCategoryStatisticsSchema = {
  schema: {
    tags: ["Subject Category"],
    summary: "Thống kê số lượng journal, article, author theo Subject Category",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "integer", minimum: 1 },
      },
    },
  },
};
