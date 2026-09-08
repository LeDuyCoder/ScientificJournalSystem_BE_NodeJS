export const loginSchema = {
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
      remember: { type: 'boolean' }
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
            refresh_token: { type: 'string' },
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

export const forgotPasswordSchema = {
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

export const resetPasswordSchema = {
  tags: ['Auth'],
  body: {
    type: 'object',
    required: ['token', 'new_password'],
    properties: {
      token: { type: 'string', minLength: 1 },
      new_password: { type: 'string', minLength: 6 }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

