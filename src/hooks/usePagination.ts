
import { useState } from "react";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
  totalItems: number;
}

export function usePagination({ 
  initialPage = 1, 
  initialPageSize = 9, 
  totalItems 
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  
  // Ensure currentPage is within valid range
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }
  
  const paginatedItems = <T>(items: T[]): T[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  };
  
  const goToPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(targetPage);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const changePageSize = (newSize: number) => {
    setPageSize(newSize);
    // Adjust current page to avoid empty results
    const newTotalPages = Math.ceil(totalItems / newSize);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  };

  return {
    pagination: {
      currentPage,
      pageSize,
      totalItems,
      totalPages
    },
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    changePageSize
  };
}
