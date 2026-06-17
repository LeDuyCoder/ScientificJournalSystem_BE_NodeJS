/**
 * Kiểm tra một chuỗi có phải là định dạng email hợp lệ hay không.
 * @param {string} email - Chuỗi email cần kiểm tra.
 * @returns {boolean} True nếu định dạng hợp lệ, ngược lại false.
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Kiểm tra một chuỗi có phải là định dạng UUID hợp lệ hay không.
 * @param {string} uuid - Chuỗi cần kiểm tra.
 * @returns {boolean} True nếu là UUID hợp lệ, ngược lại false.
 */
export const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') {
        return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};