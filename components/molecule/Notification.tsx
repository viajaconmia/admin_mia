import { useNotification } from "@/context/useNotificacion";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export const Notification = () => {
  const { notification, hideNotification } = useNotification();

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] transform transition-transform duration-300 ${
        notification.show ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className={`px-4 py-3 text-white flex justify-between items-center text-center relative ${
          notification.type === "success"
            ? "bg-emerald-500"
            : notification.type === "error"
            ? "bg-red-500"
            : "bg-blue-500"
        }`}
      >
        <div className="flex items-center justify-center gap-2 w-full">
          <div className="w-5 h-5">
            {notification.type === "success" && (
              <CheckCircle className="w-5 h-5" />
            )}
            {notification.type === "error" && (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <span className="font-medium">{notification.message}</span>
        </div>
        <button
          onClick={hideNotification}
          className="transform -translate-y-1/2 hover:bg-white/20 rounded-full p-1 w-6 h-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
