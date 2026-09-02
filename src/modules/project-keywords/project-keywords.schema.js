export const getTrendingKeywordsSchema = {
  schema: {
    tags: ["Project Keywords"],
    summary: "Lấy Top 20 từ khóa trending của project",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
      },
    },
    querystring: {
      type: "object",
      properties: {
        limit: { type: "integer", default: 20 },
        sort_by: { type: "string", enum: ["count", "score"], default: "count" },
      },
    },
  },
};

export const getWatchedKeywordArticlesSchema = {
  schema: {
    tags: ["Project Keywords"],
    summary: "Lấy luồng bài báo mới nhất từ các từ khóa đang theo dõi",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
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

export const watchKeywordsSchema = {
  schema: {
    tags: ["Project Keywords"],
    summary: "Thêm mới danh sách từ khóa vào danh sách theo dõi của dự án",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
      },
    },
    body: {
      type: "object",
      required: ["keyword_ids"],
      properties: {
        keyword_ids: {
          type: "array",
          items: { type: "integer", minimum: 1 },
        },
      },
    },
  },
};

export const updateWatchedKeywordsSchema = {
  schema: {
    tags: ["Project Keywords"],
    summary: "Cập nhật (ghi đè) danh sách từ khóa mà dự án theo dõi",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
      },
    },
    body: {
      type: "object",
      required: ["keyword_ids"],
      properties: {
        keyword_ids: {
          type: "array",
          items: { type: "integer", minimum: 1 },
        },
      },
    },
  },
};

export const deleteWatchedKeywordSchema = {
  schema: {
    tags: ["Project Keywords"],
    summary: "Xóa một từ khóa khỏi danh sách theo dõi của dự án",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId", "keywordId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
        keywordId: { type: "integer", minimum: 1 },
      },
    },
  },
};
