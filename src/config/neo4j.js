import neo4j from "neo4j-driver";
import logger from "../utils/logger.js";

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);

driver.verifyConnectivity().then(() => {
  logger.db("Kết nối tới Neo4j thành công!");
}).catch((err) => {
  logger.error("Kết nối tới Neo4j thất bại:", err);
})


export default driver;