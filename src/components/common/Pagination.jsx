import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  getPageItems,
} from '../../utils/pagination';
import './Pagination.css';

/**
 * Paginação padronizada para listagens (pacientes, prontuários, etc.).
 */
export function Pagination({
  page,
  totalPages,
  totalItems,
  startItem,
  endItem,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabel = (n) => (n === 1 ? 'item' : 'itens'),
  idPrefix = 'list',
  ariaLabel = 'Navegação de páginas',
}) {
  const reducedMotion = useReducedMotion();
  const pageItems = getPageItems(page, totalPages);
  const progress =
    totalPages > 1 ? ((page - 1) / (totalPages - 1)) * 100 : 100;
  const label =
    typeof itemLabel === 'function' ? itemLabel(totalItems) : itemLabel;

  if (totalItems <= 0) return null;

  return (
    <motion.footer
      className="pagination"
      style={{ '--pagination-progress': progress }}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      aria-label={ariaLabel}
    >
      <div className="pagination-info">
        <span>
          Mostrando <strong>{startItem}</strong>–<strong>{endItem}</strong> de{' '}
          <strong>{totalItems}</strong> {label}
        </span>
      </div>

      <nav className="pagination-nav" aria-label={ariaLabel}>
        <button
          type="button"
          className="pagination-btn pagination-btn--prev"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>

        <div className="pagination-numbers" role="group" aria-label="Números de página">
          {pageItems.map((item, idx) =>
            item === 'ellipsis-start' || item === 'ellipsis-end' ? (
              <span key={`${item}-${idx}`} className="pagination-ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pagination-num${item === page ? ' pagination-num--active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="pagination-btn pagination-btn--next"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </nav>

      <div className="pagination-per-page">
        <label htmlFor={`${idPrefix}-per-page`}>Por página:</label>
        <select
          id={`${idPrefix}-per-page`}
          value={itemsPerPage}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Itens por página"
        >
          {pageSizeOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </motion.footer>
  );
}
