import { loginUser, registerUser } from './auth.service.js';

export const login = async (request, reply) => {
  try {
    const { email, password } = request.body;
    const { token, user } = await loginUser(email, password);

    reply.setCookie('access_token', token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 // 1 day
    });

    return reply.send({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    return reply.code(401).send({
      success: false,
      message: error.message
    });
  }
};

export const register = async (request, reply) => {
  console.log('[Register API] Started');
  try {
    const { email, password, first_name, last_name, date_of_birth, gender, role } = request.body;
    console.log('[Register API] Extracted body:', { email, first_name, last_name, role });
    
    console.log('[Register API] Calling registerUser...');
    const user = await registerUser(email, password, first_name, last_name, date_of_birth, gender, role);
    console.log('[Register API] registerUser returned:', user?.user_id);

    return reply.code(201).send({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('[Register API] Error:', error);
    return reply.code(400).send({
      success: false,
      message: error.message
    });
  }
};

export const refreshToken = async (request, reply) => {
  // Logic refresh token placeholder
  return reply.send({ success: false, message: 'Chưa implement' });
};

export const logout = async (request, reply) => {
  reply.clearCookie('access_token');
  reply.clearCookie('refresh_token');
  return reply.send({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

export const checkAuth = async (request, reply) => {
  return reply.send({
    success: true,
    authenticated: true,
    user: request.user
  });
};
