export const showToast = (message, type = "info") => {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll(".toast");
  existingToasts.forEach((toast) => toast.remove());

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    z-index: 1000;
    background: ${
      type === "error"
        ? "#ef4444"
        : type === "success"
        ? "#10b981"
        : type === "warning"
        ? "#f59e0b"
        : "#3b82f6"
    };
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
};
