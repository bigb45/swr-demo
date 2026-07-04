import { toast } from "sonner";

export const notify = {
  success: (message: string) => toast.success(message, { duration: 3000 }),
  error: (message: string) => toast.error(message, { duration: 5000 }),
  info: (message: string) => toast(message, { duration: 4000 }),
};
