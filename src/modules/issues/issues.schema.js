export const getIssuesSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Lấy danh sách các số báo (Issue)",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        volume_id: { type: "integer" },
        journal_id: { type: "integer" },
      },
    },
  },
};

export const getIssueByIdSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Lấy thông tin chi tiết một Issue theo ID",
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

export const createIssueSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Tạo mới một Issue",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["volume_id", "issue_number", "publication_year"],
      properties: {
        volume_id: { type: "integer", minimum: 1 },
        issue_number: { type: "integer", minimum: 1 },
        publication_year: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const updateIssueSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Cập nhật thông tin Issue theo ID",
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
        issue_number: { type: "integer", minimum: 1 },
        publication_year: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const deleteIssueSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Xóa mềm một Issue theo ID",
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

export const restoreIssueSchema = {
  schema: {
    tags: ["Issue"],
    summary: "Khôi phục Issue đã xóa mềm theo ID",
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
