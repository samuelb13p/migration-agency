import { Badge } from "../ui/badge";
import { Card } from "../ui/card";

export function NotificationsList({
  notifications,
}: {
  notifications: Array<{ id: string; type: string; title: string; message: string; isRead: boolean }>;
}) {
  return (
    <Card>
      <h2 className="text-xl font-semibold">Notifications</h2>
      <div className="mt-6 space-y-4">
        {notifications.map((notification) => (
          <div key={notification.id} className="rounded-3xl border border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{notification.title}</p>
              <Badge tone={notification.isRead ? "neutral" : "success"}>{notification.isRead ? "read" : "new"}</Badge>
            </div>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-400">{notification.type}</p>
            <p className="mt-3 text-sm text-slate-600">{notification.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
