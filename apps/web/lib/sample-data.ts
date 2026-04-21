import { NotificationType, RoleName, UploadedDocumentStatus, VisaCaseStatus } from "@migration-agency/shared";

export const sampleUser = {
  id: "usr_demo_customer",
  email: "customer@migration.local",
  role: RoleName.CUSTOMER,
  profile: {
    fullName: "Demo Customer",
    nationality: "India",
    passportNumber: "N1234567",
    phone: "+61 412 345 678",
  },
};

export const sampleCase = {
  id: "case_demo_001",
  status: VisaCaseStatus.WAITING_DOCUMENTS,
  completenessPercent: 67,
  visaType: { name: "Student Visa Subclass 500" },
  assignedAgent: { profile: { fullName: "Case Agent" } },
};

export const sampleChecklist = [
  { id: "passport", name: "Passport", status: "approved", reviewStatus: UploadedDocumentStatus.APPROVED },
  { id: "visa_photo", name: "Visa Photo", status: "missing", reviewStatus: UploadedDocumentStatus.PENDING },
  { id: "coe", name: "Confirmation of Enrolment", status: "uploaded", reviewStatus: UploadedDocumentStatus.PENDING },
];

export const sampleNotifications = [
  {
    id: "noti_1",
    type: NotificationType.DOCUMENT_UPLOADED,
    title: "Passport uploaded",
    message: "Your document has been received and is waiting for review.",
    isRead: false,
  },
  {
    id: "noti_2",
    type: NotificationType.REUPLOAD_REQUESTED,
    title: "Re-upload requested",
    message: "Please upload a clearer photo for the visa photo requirement.",
    isRead: true,
  },
];

export const sampleContracts = [
  {
    id: "ctr_1",
    templateName: "migration-services-v1",
    generatedAt: "2026-04-09T14:00:00.000Z",
  },
];
