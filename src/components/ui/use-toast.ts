
// This file is deprecated - use sonner toast instead
// Import sonner directly: import { toast } from "sonner";

export const useToast = () => {
  console.warn("useToast is deprecated, use sonner toast instead");
  return { toast: () => {} };
};

export const toast = () => {
  console.warn("Custom toast is deprecated, use sonner toast instead");
};
