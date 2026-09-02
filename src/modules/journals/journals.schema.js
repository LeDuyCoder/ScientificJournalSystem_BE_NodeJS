export const getJournalsSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Lấy danh sách journal",
    security: [{ bearerAuth: [] }],
    querystring: {
      type: "object",
      properties: {
        search: { type: "string" },
        page: { type: "integer", minimum: 1, default: 1 },
        limit: { type: "integer", minimum: 1, default: 10 },
        subjectAreaIds: { type: "string" },
        subjectCategoryIds: { type: "string" },
        isOpenAccess: { type: "boolean" },
        quartiles: { type: "string" },
        rankingYear: { type: "integer" },
        isOaDiamond: { type: "boolean" },
        countryIds: { type: "string" },
        subject_area_id: { type: "string" },
        publisher_id: { type: "integer" },
        sort_by: { type: "string", enum: ["display_name", "volume_count"] },
        sort_order: { type: "string", enum: ["asc", "desc"] },
        sort: { type: "string" },
      },
    },
  },
};

export const getJournalsByIdSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Lấy thông tin chi tiết journal theo ID",
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

export const createJournalSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Tạo mới journal",
    security: [{ bearerAuth: [] }],
    body: {
      type: "object",
      required: ["display_name", "publisher_id", "country", "region"],
      properties: {
        source_id: { type: "string", nullable: true },
        publisher_id: { type: "integer", minimum: 1 },
        country: { type: "integer", minimum: 1 },
        region: { type: "integer", minimum: 1 },
        display_name: { type: "string", minLength: 1 },
        type: { type: "string", default: "Journal" },
        is_open_access: { type: "boolean", default: false },
        is_oa_diamond: { type: "boolean", default: false },
        coverage: { type: "string", nullable: true },
        issn: { 
          anyOf: [
            { type: "string" },
            { type: "array", items: { type: "string" } },
            { type: "null" }
          ]
        },
        scope_detail: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
      },
    },
  },
};

export const updateJournalSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Cập nhật thông tin journal",
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
        source_id: { type: "string", nullable: true },
        publisher_id: { type: "integer", minimum: 1 },
        country: { type: "integer", minimum: 1 },
        region: { type: "integer", minimum: 1 },
        display_name: { type: "string", minLength: 1 },
        type: { type: "string", default: "Journal" },
        is_open_access: { type: "boolean", default: false },
        is_oa_diamond: { type: "boolean", default: false },
        coverage: { type: "string", nullable: true },
        issn: { 
          anyOf: [
            { type: "string" },
            { type: "array", items: { type: "string" } },
            { type: "null" }
          ]
        },
        scope_detail: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
      },
    },
  },
};

export const deleteJournalSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Xóa mềm journal",
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

export const restoreJournalSchema = {
  schema: {
    tags: ["Journal"],
    summary: "Khôi phục journal đã bị xóa mềm",
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
