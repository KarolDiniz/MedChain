/**
 * Helpers de paginação client-side (listagens).
 */

export const DEFAULT_PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_PAGE_SIZE = 12;

/** Números de página com reticências (1 … 4 5 6 … 20). */
export function getPageItems(currentPage, totalPages) {
  if (totalPages < 1) return [];
  if (totalPages === 1) return [1];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const items = [1];
  if (currentPage > 3) items.push('ellipsis-start');

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i += 1) {
    if (!items.includes(i)) items.push(i);
  }

  if (currentPage < totalPages - 2) items.push('ellipsis-end');
  if (totalPages > 1) items.push(totalPages);
  return items;
}

/** Métricas de fatia para a página atual. */
export function getPaginationMeta(totalItems, currentPage, itemsPerPage) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safePage * itemsPerPage, totalItems);
  return { totalPages, safePage, startItem, endItem };
}
