"use client";

import { useEffect, useState } from "react";
import { apiFetchWithToken } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { sampleNotifications } from "../../lib/sample-data";
import { NotificationsList } from "./notifications-list";

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
};

export function LiveNotifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const accessToken = token;

    async function load() {
      try {
        const data = await apiFetchWithToken<NotificationRecord[]>("/api/notifications", accessToken);
        setNotifications(data);
      } catch {
        setNotifications([]);
      }
    }

    void load();
  }, []);

  return <NotificationsList notifications={notifications.length > 0 ? notifications : sampleNotifications} />;
}
