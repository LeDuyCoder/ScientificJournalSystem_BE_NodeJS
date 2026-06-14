import redis from "../config/redis.js";

export async function getCache(key) {

  const value = await redis.get(key);

  if (!value) return null;

  return JSON.parse(value);
}

export async function setCache(
  key,
  data,
  ttl = 3600
) {
  await redis.set(
    key,
    JSON.stringify(data),
    {
      EX: ttl
    }
  );
}