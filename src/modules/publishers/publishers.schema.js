export const getPublishersSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Lấy danh sách nhà xuất bản (Publisher)',
        description: 'Lấy danh sách nhà xuất bản, hỗ trợ tìm kiếm và phân trang',
        querystring: {
            type: 'object',
            properties: {
                page: { type: 'integer', default: 1, minimum: 1 },
                limit: { type: 'integer', default: 100, minimum: 1 },
                search: { type: 'string' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                publisher_id: { type: 'string' },
                                display_name: { type: 'string' },
                                image_url: { type: 'string', nullable: true },
                                created_at: { type: 'string' }
                            }
                        }
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            total: { type: 'integer' },
                            total_pages: { type: 'integer' }
                        }
                    }
                }
            }
        }
    }
};

export const getPublisherByIdSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Lấy thông tin chi tiết nhà xuất bản theo ID',
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            publisher_id: { type: 'string' },
                            display_name: { type: 'string' },
                            image_url: { type: 'string', nullable: true },
                            created_at: { type: 'string' }
                        }
                    }
                }
            }
        }
    }
};

export const createPublisherSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Tạo nhà xuất bản mới (chỉ Admin)',
        security: [{ bearerAuth: [] }],
        body: {
            type: 'object',
            required: ['display_name'],
            properties: {
                display_name: { type: 'string', minLength: 1 },
                image_url: { type: 'string', nullable: true }
            }
        },
        response: {
            201: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            publisher_id: { type: 'string' },
                            display_name: { type: 'string' },
                            image_url: { type: 'string', nullable: true },
                            created_at: { type: 'string' }
                        }
                    }
                }
            }
        }
    }
};

export const updatePublisherSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Cập nhật thông tin nhà xuất bản (chỉ Admin)',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' }
            }
        },
        body: {
            type: 'object',
            properties: {
                display_name: { type: 'string', minLength: 1 },
                image_url: { type: 'string', nullable: true }
            }
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: {
                        type: 'object',
                        properties: {
                            publisher_id: { type: 'string' },
                            display_name: { type: 'string' },
                            image_url: { type: 'string', nullable: true },
                            created_at: { type: 'string' }
                        }
                    }
                }
            }
        }
    }
};

export const deletePublisherSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Xóa nhà xuất bản (chỉ Admin)',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' }
            }
        }
    }
};

export const restorePublisherSchema = {
    schema: {
        tags: ['Publisher'],
        summary: 'Khôi phục nhà xuất bản đã bị xóa mềm (chỉ Admin)',
        security: [{ bearerAuth: [] }],
        params: {
            type: 'object',
            required: ['id'],
            properties: {
                id: { type: 'string', format: 'uuid' }
            }
        }
    }
};
