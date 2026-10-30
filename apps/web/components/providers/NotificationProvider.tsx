"use client";

import {
  useEffect,
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  requestPermission: () => Promise<void>;
  subscribeUser: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isSubscribingRef = useRef(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const getVapidPublicKey = useCallback(async (): Promise<string> => {
    const envKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (envKey) return envKey;

    try {
      const res = await api.get<{ publicKey: string | null }>(
        "/auth/notifications/vapid-public-key",
      );
      if (res.data?.publicKey) {
        return res.data.publicKey;
      }
    } catch (e) {
      console.warn("Could not fetch VAPID key from API:", e);
    }

    return "";
  }, []);

  const subscribeUser = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("Notification" in window)
    ) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    if (isSubscribingRef.current) return;
    isSubscribingRef.current = true;

    try {
      // Get service worker registration with timeout
      let registration: ServiceWorkerRegistration;
      try {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("SW ready timeout")), 3000),
          ),
        ]);
      } catch {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
      }

      // Check if already subscribed in browser
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const vapidPublicKey = await getVapidPublicKey();
        if (!vapidPublicKey) {
          console.warn(
            "No VAPID public key available. Push subscription skipped.",
          );
          return;
        }
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      if (subscription) {
        setIsSubscribed(true);
        // Synchronize with backend if logged in
        const token = localStorage.getItem("finease_token");
        if (token) {
          try {
            await api.post("/auth/notifications/subscribe", subscription);
            console.log("Push subscription synchronized with sovereign node");
          } catch (syncErr) {
            console.warn(
              "Failed to synchronize push subscription with backend:",
              syncErr,
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
    } finally {
      isSubscribingRef.current = false;
    }
  }, [getVapidPublicKey]);

  // Auto-subscribe/synchronize if permission is already allowed and user is logged in
  useEffect(() => {
    if (permission === "granted" && user) {
      void subscribeUser();
    }
  }, [permission, user, subscribeUser]);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return;

    // Detection for iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isStandalone =
      "standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone: boolean }).standalone;

    if (!isSupported) {
      if (isIOS && !isStandalone) {
        toast(
          "To enable notifications on iOS: \n1. Share (up arrow) \n2. 'Add to Home Screen' \n3. Open from Home Screen",
          {
            duration: 6000,
            icon: "📱",
          },
        );
      } else {
        toast.error("Notifications not supported on this browser.");
      }
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await subscribeUser();
        toast.success(
          "Notifications enabled. You will receive intelligent reminders.",
        );
      } else if (result === "denied") {
        if (isIOS) {
          toast.error(
            "Notifications blocked. Go to Settings > Notifications > FinEase to enable.",
            { duration: 5000 },
          );
        } else {
          toast.error(
            "Notifications blocked. Enable notifications in browser settings.",
          );
        }
      }
    } catch (error: unknown) {
      console.error(
        "Error requesting notification permission:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }, [isSupported, subscribeUser]);

  const sendTestNotification = useCallback(async () => {
    if (typeof window === "undefined") return;

    if (Notification.permission !== "granted") {
      toast.error("Please enable notifications first.");
      return;
    }

    try {
      // 1. Immediately show notification on device via active service worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification("FinEase System Alert", {
          body: "Notifications are operational and verified on this device.",
          icon: "/icon-192x192.png",
          badge: "/favicon.svg",
          data: { url: "/dashboard" },
        });
      } else {
        new Notification("FinEase System Alert", {
          body: "Notifications are operational and verified on this device.",
          icon: "/icon-192x192.png",
        });
      }

      toast.success("Test notification displayed on your device!");

      // 2. Also test backend push roundtrip if user is logged in
      const token = localStorage.getItem("finease_token");
      if (token) {
        try {
          await api.post("/auth/notifications/test");
        } catch (apiErr) {
          console.warn("Backend push notification test ping:", apiErr);
        }
      }
    } catch (error) {
      console.error("Failed to display test notification:", error);
      toast.error(
        "Could not display notification. Check system alert permissions.",
      );
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        isSupported,
        permission,
        isSubscribed,
        requestPermission,
        subscribeUser,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
