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
  const [idTime, setIdTime] = useState<NodeJS.Timeout | null>(null);

  const showNotification = (type: NotificationType, message: string) => {
    if (idTime) {
      clearTimeout(idTime);
    }
    setNotification({ type: notification.type, message: "", show: false });
    setTimeout(
      () => {
        setNotification({ type, message, show: true });
      },
      idTime ? 200 : 0
    );
    const id = setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
      setIdTime(null);
    }, 7000);
    setIdTime(id);
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
