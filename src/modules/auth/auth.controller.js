import { loginUser, registerUser, verifyUserEmail } from './auth.service.js';

export const login = async (request, reply) => {
  try {
    const { email, password, remember } = request.body;
    const { token, refreshToken, user } = await loginUser(email, password);

    reply.setCookie('access_token', token, {
      path: '/',
      domain: process.env.COOKIE_DOMAIN || undefined,
      httpOnly: true,
      secure: false, // Tạm thời tắt vì chỉ có HTTP
      sameSite: 'lax', // sameSite 'none' bắt buộc phải có secure: true
      maxAge: parseInt(process.env.COOKIE_ACCESS_MAX_AGE || 3600000, 10) / 1000 // 1 hour default
    });

    if (remember) {
      reply.setCookie('refresh_token', refreshToken, {
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: parseInt(process.env.COOKIE_REFRESH_MAX_AGE || 2592000000, 10) / 1000 // 30 days default
      });
    } else {
      reply.setCookie('refresh_token', refreshToken, {
        path: '/',
        domain: process.env.COOKIE_DOMAIN || undefined,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
        // no maxAge = session cookie
      });
    }

    return reply.send({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        refresh_token: refreshToken,
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

export const verifyAccount = async (request, reply) => {
  try {
    const { token } = request.query || {};
    const result = await verifyUserEmail(token);
    return reply.send({
      success: true,
      message: result.message || 'Kích hoạt tài khoản thành công'
    });
  } catch (error) {
    return reply.code(400).send({
      success: false,
      message: error.message || 'Kích hoạt tài khoản thất bại'
    });
  }
};

export const refreshToken = async (request, reply) => {
  // Logic refresh token placeholder
  return reply.send({ success: false, message: 'Chưa implement' });
};

export const logout = async (request, reply) => {
  reply.clearCookie('access_token', { domain: process.env.COOKIE_DOMAIN || undefined, path: '/' });
  reply.clearCookie('refresh_token', { domain: process.env.COOKIE_DOMAIN || undefined, path: '/' });
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

