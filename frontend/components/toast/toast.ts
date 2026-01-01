import toast from "react-hot-toast";

type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export const showToast = (
  message: string,
  type: "success" | "error",
  position?: ToastPosition
) => {
  if (type === "success") {
    toast.success(message, { position });
  } else {
    toast.error(message, { position });
  }
};
