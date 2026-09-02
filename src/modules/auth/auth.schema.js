export const loginSchema = {
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
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
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                user_id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }
};

export const registerSchema = {
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email', 'password', 'fullname'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      fullname: { type: 'string' },
      role: { type: 'string' }
    }
  }
};
