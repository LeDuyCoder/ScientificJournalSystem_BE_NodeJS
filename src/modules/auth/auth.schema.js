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
    required: ['email', 'password', 'first_name', 'last_name'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      date_of_birth: { type: 'string', format: 'date' },
      gender: { type: 'boolean' },
      role: { type: 'string' }
    }
  }
};
