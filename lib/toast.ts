import { toast, type ExternalToast } from "sonner";

export function toastSuccess(message: string, options?: ExternalToast) {
  toast.success(message, options);
}

export function toastError(message: string, options?: ExternalToast) {
  toast.error(message, options);
}

export function toastInfo(message: string, options?: ExternalToast) {
  toast(message, options);
}
