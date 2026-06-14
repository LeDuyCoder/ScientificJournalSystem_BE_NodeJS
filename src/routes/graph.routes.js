import express from "express";

import {
  getArticles
} from "../services/graph.service.js";

import {
  getCache,
  setCache
} from "../services/cache.service.js";

const router = express.Router();

router.get(
  "/articles",
  async (req, res) => {

    const cacheKey =
      "articles";

    const cached =
      await getCache(cacheKey);

    if (cached) {

      return res.json({
        source: "redis",
        data: cached
      });
    }

    const data =
      await getArticles();

    await setCache(
      cacheKey,
      data,
      3600
    );

    res.json({
      source: "neo4j",
      data
    });
  }
);

export default router;