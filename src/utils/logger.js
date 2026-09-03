// Hàm lấy thời gian hiện tại theo định dạng chuẩn YYYY-MM-DD HH:mm:ss
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

const isTest = process.env.npm_lifecycle_event === 'test' || process.env.NODE_ENV === 'test';

const logger = {
  info: (message, ...args) => {
    if (isTest) return;
    console.log(`[${getTimestamp()}] [INFO]: ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    if (isTest) return;
    console.warn(`\x1b[33m[${getTimestamp()}] [WARN]: ${message}\x1b[0m`, ...args); 
  },
  
  error: (message, error = '') => {
    if (isTest) return;
    console.error(`\x1b[31m[${getTimestamp()}] [ERROR]: ${message}\x1b[0m`, error.stack || error);
  },
  
  db: (message, ...args) => {
    if (isTest) return;
    console.log(`\x1b[36m[${getTimestamp()}] [DATABASE]: ${message}\x1b[0m`, ...args);
  }
};

export default logger;