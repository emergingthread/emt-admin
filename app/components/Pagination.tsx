"use client";

type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export default function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination" aria-label="Pagination">
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>Page {page} of {pageCount}</span>
      <button type="button" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
