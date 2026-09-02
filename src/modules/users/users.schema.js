export const updateProfileSchema = {
  tags: ['Users'],
  body: {
    type: 'object',
    properties: {
      first_name: { type: 'string' },
      last_name: { type: 'string' },
      date_of_birth: { type: 'string', format: 'date' },
      gender: { type: 'boolean' },
      url_image: { type: 'string' }
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
            user_id: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            date_of_birth: { type: 'string' },
            gender: { type: 'boolean' },
            url_image: { type: 'string' }
          }
        }
      }
    }
  }
};
