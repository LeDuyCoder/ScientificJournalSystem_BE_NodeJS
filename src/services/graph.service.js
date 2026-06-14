import driver from "../config/neo4j.js";

export async function getArticles() {

  const session =
    driver.session();

  try {

    const result =
      await session.run(`
        MATCH (a:Article)
        RETURN a
        LIMIT 20
      `);

    return result.records.map(
      record =>
        record.get("a").properties
    );

  } finally {
    await session.close();
  }
}