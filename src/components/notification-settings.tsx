"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/app/(app)/notifications-actions";

type Status = "checking" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationSettings({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    async function detectStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const sub = await registration.pushManager.getSubscription();
        setStatus(sub ? "subscribed" : "unsubscribed");
      } catch {
        setStatus("unsubscribed");
      }
    }
    detectStatus();
  }, []);

  async function handleSubscribe() {
    setPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
      await savePushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("subscribed");
    } finally {
      setPending(false);
    }
  }

  async function handleUnsubscribe() {
    setPending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setPending(false);
    }
  }

  if (status === "unsupported") {
    return (
      <p className="text-xs text-text-faint">
        เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน — บน iPhone ต้องเพิ่มแอปนี้ไปที่หน้าจอโฮมก่อน (Share → Add to Home Screen)
      </p>
    );
  }

  if (status === "checking") return null;

  if (status === "denied") {
    return (
      <p className="text-xs text-text-faint">
        การแจ้งเตือนถูกปิดไว้ในตั้งค่าเบราว์เซอร์/iPhone — ไปเปิดใน Settings ของอุปกรณ์
      </p>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="flex items-center justify-between rounded-card border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="h-4 w-4 text-teal" />
          เปิดการแจ้งเตือนอยู่
        </div>
        <Button size="sm" variant="secondary" disabled={pending} onClick={handleUnsubscribe}>
          <BellOff className="h-4 w-4" />
          ปิด
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-card border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <BellOff className="h-4 w-4" />
        ยังไม่เปิดการแจ้งเตือน
      </div>
      <Button size="sm" disabled={pending} onClick={handleSubscribe}>
        <Bell className="h-4 w-4" />
        เปิด
      </Button>
    </div>
  );
}
