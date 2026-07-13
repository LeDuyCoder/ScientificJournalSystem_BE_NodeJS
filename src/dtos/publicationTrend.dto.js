/**
 * Data Transfer Object for Publication Trend data.
 * Normalizes database query results into the client response format.
 */
export class PublicationTrendDTO {
  /**
   * @param {Object} row - Raw row from database query.
   * @param {string|number} row.year - The publication year.
   * @param {string|number} row.totalPublications - Total articles published in that year.
   */
  constructor(row) {
    this.year = parseInt(row.year, 10);
    this.totalPublications = parseInt(row.totalPublications, 10) || 0;
  }
}
