
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { type PaginationState } from "@/hooks/usePagination";

interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({
  pagination,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const { currentPage, totalPages } = pagination;
  
  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    
    // Always show first page
    pageNumbers.push(1);
    
    // Calculate start and end page numbers
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Adjust to show at least 3 page numbers (when possible)
    if (startPage === 2) endPage = Math.min(totalPages - 1, endPage + 1);
    if (endPage === totalPages - 1) startPage = Math.max(2, startPage - 1);
    
    // Add ellipsis after first page if needed
    if (startPage > 2) pageNumbers.push("ellipsis");
    
    // Add page numbers in the middle
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) pageNumbers.push("ellipsis");
    
    // Always show last page if there is more than one page
    if (totalPages > 1) pageNumbers.push(totalPages);
    
    return pageNumbers;
  };

  // Don't show pagination if there's only one page
  if (totalPages <= 1) return null;

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={currentPage === 1}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          page === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={`page-${page}`}>
              <PaginationLink
                isActive={currentPage === page}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={typeof page === 'number' ? "cursor-pointer" : ""}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            aria-disabled={currentPage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
