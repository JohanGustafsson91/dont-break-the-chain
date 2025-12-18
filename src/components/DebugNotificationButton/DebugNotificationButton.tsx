import { useState } from "react";
import {
  requestNotificationPermission,
  areNotificationsEnabled,
} from "../../services/notificationService";

const styles = {
  container: {
    position: "fixed" as const,
    bottom: "20px",
    right: "20px",
    padding: "20px",
    backgroundColor: "#333",
    color: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
    zIndex: 9999,
    minWidth: "250px",
  },
  title: { margin: "0 0 10px 0", fontSize: "14px" },
  buttonContainer: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  button: (color: string) => ({
    padding: "8px",
    backgroundColor: color,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
  }),
  status: {
    marginTop: "10px",
    padding: "8px",
    backgroundColor: "#444",
    borderRadius: "4px",
    fontSize: "11px",
    wordBreak: "break-word" as const,
  },
};

const showTestNotification = (): void => {
  const options = {
    body: "This is a test notification from your habit tracker!",
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "test-notification",
  };

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) =>
      registration.showNotification("Test Notification", options)
    );
    return;
  }

  new Notification("Test Notification", options);
};

export const DebugNotificationButton = () => {
  const [status, setStatus] = useState<string>("");

  if (import.meta.env.PROD) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setStatus(granted ? "Permission granted!" : "Permission denied");
  };

  const handleTestNotification = () => {
    if (!areNotificationsEnabled()) {
      setStatus("Please grant permission first");
      return;
    }
    showTestNotification();
    setStatus("Test notification sent!");
  };

  const handleCheckStatus = () => {
    const enabled = areNotificationsEnabled();
    setStatus(`Permission: ${Notification.permission}, Enabled: ${enabled}`);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🔧 Debug: Notifications</h3>
      <div style={styles.buttonContainer}>
        <button
          type="button"
          onClick={handleRequestPermission}
          style={styles.button("#4CAF50")}
        >
          1. Request Permission
        </button>
        <button
          type="button"
          onClick={handleTestNotification}
          style={styles.button("#2196F3")}
        >
          2. Send Test Notification
        </button>
        <button
          type="button"
          onClick={handleCheckStatus}
          style={styles.button("#FF9800")}
        >
          Check Status
        </button>
      </div>
      {status && <div style={styles.status}>{status}</div>}
    </div>
  );
};
