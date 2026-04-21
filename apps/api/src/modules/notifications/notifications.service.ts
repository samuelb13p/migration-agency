import { NotificationType } from "@migration-agency/shared";
import { prisma } from "../../lib/prisma";

export const notificationsService = {
  list(recipientUserId: string) {
    return prisma.notification.findMany({
      where: { userId: recipientUserId },
      orderBy: { createdAt: "desc" },
    });
  },

  markRead(notificationId: string, recipientUserId: string) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: recipientUserId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  },

  create(input: {
    recipientUserId: string;
    caseId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: input.recipientUserId,
        visaCaseId: input.caseId,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });
  },

  sendEmailReadyNotification(input: {
    recipientUserId: string;
    caseId?: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.create(input);
  },
};
