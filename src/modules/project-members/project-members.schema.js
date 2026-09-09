export const getProjectMembersSchema = {
  schema: {
    tags: ["Project Members"],
    summary: "Lấy danh sách thành viên của dự án",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
      },
    },
  },
};

export const inviteMemberSchema = {
  schema: {
    tags: ["Project Members"],
    summary: "Gửi email mời một người dùng tham gia dự án",
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
      required: ["email", "role"],
      properties: {
        email: { type: "string", format: "email" },
        role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] },
      },
    },
  },
};

export const acceptInviteSchema = {
  schema: {
    tags: ["Project Members"],
    summary: "Xác nhận lời mời tham gia dự án qua token",
    querystring: {
      type: "object",
      required: ["token"],
      properties: {
        token: { type: "string", minLength: 1 },
      },
    },
  },
};

export const updateMemberRoleSchema = {
  schema: {
    tags: ["Project Members"],
    summary: "Cập nhật quyền (role) của thành viên trong dự án",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId", "userId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
        userId: { type: "string", minLength: 1 },
      },
    },
    body: {
      type: "object",
      required: ["role"],
      properties: {
        role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] },
      },
    },
  },
};

export const removeMemberSchema = {
  schema: {
    tags: ["Project Members"],
    summary: "Xóa một thành viên khỏi dự án",
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      required: ["projectId", "userId"],
      properties: {
        projectId: { type: "integer", minimum: 1 },
        userId: { type: "string", minLength: 1 },
      },
    },
  },
};
