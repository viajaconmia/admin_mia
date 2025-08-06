import { createContext, useContext, useState } from "react";

type NotificationType = "success" | "error" | "info";

interface Notification {
  type: NotificationType;
  message: string;
  show: boolean;
}

type NotificationContextProps = {
  notification: Notification;
  showNotification: (type: NotificationType, message: string) => void;
  hideNotification: () => void;
};

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notification, setNotification] = useState<Notification>({
    type: "info",
    message: "",
    show: false,
  });

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({ type, message, show: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 7000);
  };
  const hideNotification = () => {
    setNotification((prev) => ({ ...prev, show: false }));
  };

  return (
    <NotificationContext.Provider
      value={{ notification, showNotification, hideNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
