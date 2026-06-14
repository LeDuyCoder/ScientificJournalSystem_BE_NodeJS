import { createClient } from "redis";
import logger from "../utils/logger.js";

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

await redis.connect();

logger.db("Kết nối tới Redis thành công!");

export default redis;