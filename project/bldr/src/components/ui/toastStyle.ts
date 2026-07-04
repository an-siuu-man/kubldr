export type ToastTheme = "light" | "dark";

export const toastStyle = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  fontSize: "14px",
  color: "#fff",
  backgroundColor: "#111111",
  border: "1px solid #2a2a2a",
};

export const lightToastStyle = {
  ...toastStyle,
  color: "#0f172a",
  backgroundColor: "#ffffff",
  border: "1px solid #cbd5e1",
  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
};

export function getToastStyle(theme: ToastTheme) {
  return theme === "light" ? lightToastStyle : toastStyle;
}

export default toastStyle;
