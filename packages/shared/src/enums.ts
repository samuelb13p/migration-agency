export enum RoleName {
  CUSTOMER = "customer",
  AGENT = "agent",
  ADMIN = "admin",
}

export enum VisaCaseStatus {
  DRAFT = "draft",
  WAITING_DOCUMENTS = "waiting_documents",
  DOCUMENTS_UPLOADED = "documents_uploaded",
  UNDER_REVIEW = "under_review",
  APPROVED = "approved",
  REJECTED = "rejected",
  CONTRACT_SENT = "contract_sent",
  COMPLETED = "completed",
}

export enum UploadedDocumentStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  REUPLOAD_REQUESTED = "reupload_requested",
}

export enum ContractStatus {
  DRAFT = "draft",
  GENERATED = "generated",
  SENT = "sent",
  ACCEPTED = "accepted",
  DECLINED = "declined",
}

export enum NotificationType {
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_APPROVED = "document_approved",
  DOCUMENT_REJECTED = "document_rejected",
  REUPLOAD_REQUESTED = "reupload_requested",
  CHECKLIST_COMPLETED = "checklist_completed",
  CONTRACT_SENT = "contract_sent",
  CONTRACT_ACCEPTED = "contract_accepted",
}

export enum PermissionName {
  MANAGE_USERS = "manage_users",
  MANAGE_ROLES = "manage_roles",
  MANAGE_VISA_TYPES = "manage_visa_types",
  MANAGE_DOCUMENT_TYPES = "manage_document_types",
  MANAGE_VISA_RULES = "manage_visa_rules",
  MANAGE_CASES = "manage_cases",
  REVIEW_DOCUMENTS = "review_documents",
  GENERATE_CONTRACTS = "generate_contracts",
  VIEW_ASSIGNED_CASES = "view_assigned_cases",
  VIEW_OWN_CASES = "view_own_cases",
}
