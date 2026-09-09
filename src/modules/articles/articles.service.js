/**
 * Pass-through service layer.
 * Toàn bộ logic hiện đang được xử lý ở tầng Repository do tính chất phức tạp của Raw SQL và MeiliSearch.
 * Ở phase tiếp theo, khi chuyển sang Prisma, logic Cache và MeiliSearch sẽ được mang trở lại đây.
 */
export * from './articles.repository.js';
