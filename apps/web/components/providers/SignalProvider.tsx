"use client";

import {
  useEffect,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface SignalContextType {
  isSupported: boolean;
  permission: NotificationPermission;
  requestPermission: () => Promise<void>;
  subscribeUser: () => Promise<void>;
}

const SignalContext = createContext<SignalContextType | undefined>(undefined);

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

export function SignalProvider({ children }: { children: React.ReactNode }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

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

  const subscribeUser = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await api.post("/auth/notifications/subscribe", existingSubscription);
        return;
      }

      // Load VAPID public key from env or use a placeholder
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
         console.warn("VAPID public key not found. Push subscription might fail.");
         return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      await api.post("/auth/notifications/subscribe", subscription);
      console.log("Push subscription synchronized with sovereign node");
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
    }
  }, [isSupported]);

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
          "To enable signals on iOS: \n1. Share (up arrow) \n2. 'Add to Home Screen' \n3. Open from Home Screen",
          {
            duration: 6000,
            icon: "📱",
          },
        );
      } else {
        toast.error("Signals not supported on this browser.");
      }
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        await subscribeUser();
        toast.success(
          "Signals enabled. You will receive intelligent reminders.",
        );
      } else if (result === "denied") {
        if (isIOS) {
          toast.error(
            "Signals blocked. Go to Settings > Notifications > FinEase to enable.",
            { duration: 5000 },
          );
        } else {
          toast.error(
            "Signals blocked. Enable notifications in browser settings.",
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

  return (
    <SignalContext.Provider
      value={{ isSupported, permission, requestPermission, subscribeUser }}
    >
      {children}
    </SignalContext.Provider>
  );
}

export const useSignals = () => {
  const context = useContext(SignalContext);
  if (context === undefined) {
    throw new Error("useSignals must be used within a SignalProvider");
  }
  return context;
};
