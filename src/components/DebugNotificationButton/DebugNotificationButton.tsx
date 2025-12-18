/**
 * DEBUG ONLY - Notification Test Button
 * This component is only visible in development mode
 * Remove after testing notifications
 */

import { useState } from "react";
import {
  requestNotificationPermission,
  areNotificationsEnabled,
} from "../../services/notificationService";

export const DebugNotificationButton = () => {
  const [status, setStatus] = useState<string>("");

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setStatus(granted ? "Permission granted!" : "Permission denied");
  };

  const handleTestNotification = () => {
    if (!areNotificationsEnabled()) {
      setStatus("Please grant permission first");
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Test Notification", {
          body: "This is a test notification from your habit tracker!",
          icon: "/icon.svg",
          badge: "/icon.svg",
          tag: "test-notification",
        });
        setStatus("Test notification sent!");
      });
    } else {
      new Notification("Test Notification", {
        body: "This is a test notification from your habit tracker!",
        icon: "/icon.svg",
      });
      setStatus("Test notification sent!");
    }
  };

  const handleCheckStatus = () => {
    const enabled = areNotificationsEnabled();
    const permission = Notification.permission;
    setStatus(`Permission: ${permission}, Enabled: ${enabled}`);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "20px",
        backgroundColor: "#333",
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        zIndex: 9999,
        minWidth: "250px",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
        🔧 Debug: Notifications
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          type="button"
          onClick={handleRequestPermission}
          style={{
            padding: "8px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          1. Request Permission
        </button>
        <button
          type="button"
          onClick={handleTestNotification}
          style={{
            padding: "8px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          2. Send Test Notification
        </button>
        <button
          type="button"
          onClick={handleCheckStatus}
          style={{
            padding: "8px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Check Status
        </button>
      </div>
      {status && (
        <div
          style={{
            marginTop: "10px",
            padding: "8px",
            backgroundColor: "#444",
            borderRadius: "4px",
            fontSize: "11px",
            wordBreak: "break-word",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};
