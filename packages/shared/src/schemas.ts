import { z } from "zod";
import { ContractStatus, RoleName, UploadedDocumentStatus, VisaCaseStatus } from "./enums";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(10)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  roleName: z.nativeEnum(RoleName).default(RoleName.CUSTOMER),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const adminManagedUserBaseSchema = z.object({
  email: z.string().email(),
  roleName: z.nativeEnum(RoleName),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  phone: z.string().min(6).max(30).optional(),
  isActive: z.boolean().default(true),
});

export const adminCreateUserSchema = adminManagedUserBaseSchema.extend({
  password: z
    .string()
    .min(10)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
});

export const adminUpdateUserSchema = adminManagedUserBaseSchema
  .extend({
    password: z
      .string()
      .min(10)
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(/[a-z]/, "Password must include a lowercase letter")
      .regex(/[0-9]/, "Password must include a number")
      .optional(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one field must be provided.");

export const adminUpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const customerProfileSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  dateOfBirth: z.string().datetime().optional(),
  nationality: z.string().max(80).optional(),
  passportNumber: z.string().max(40).optional(),
  passportExpiryDate: z.string().datetime().optional(),
  phone: z.string().min(6).max(30).optional(),
  addressLine1: z.string().max(120).optional(),
  addressLine2: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(80).optional(),
  postcode: z.string().max(20).optional(),
  country: z.string().max(80).optional(),
  acceptPolicy: z.boolean().default(false),
  acceptedPolicyAt: z.string().datetime().optional(),
});

export const agentProfileSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  phone: z.string().min(6).max(30).optional(),
});

export const adminProfileSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
});

export const visaTypeSchema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const documentTypeSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2).max(120),
  description: z.string().max(300).optional(),
  allowedExtensions: z.array(z.string().min(2)).min(1),
  maxFileSizeMb: z.number().int().min(1).max(50),
});

export const visaTypeRequiredDocumentSchema = z.object({
  documentTypeId: z.string().min(1),
  isRequired: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export const createVisaCaseSchema = z.object({
  visaTypeId: z.string().min(1),
  customerProfileId: z.string().min(1),
  agentProfileId: z.string().optional(),
});

export const createAgentVisaCaseSchema = z.object({
  caseNumber: z.string().min(3).max(60),
  visaTypeId: z.string().min(1),
  contractTemplateId: z.string().min(1),
  status: z.nativeEnum(VisaCaseStatus).default(VisaCaseStatus.WAITING_DOCUMENTS),
  customer: z.object({
    firstName: z.string().min(2).max(80),
    lastName: z.string().min(2).max(80),
    email: z.string().email(),
    passportNumber: z.string().min(4).max(40),
  }),
});

export const updateVisaCaseSchema = z.object({
  status: z.nativeEnum(VisaCaseStatus).optional(),
  agentProfileId: z.string().nullable().optional(),
  submittedAt: z.string().datetime().optional(),
});

export const reviewUploadedDocumentSchema = z.object({
  status: z.nativeEnum(UploadedDocumentStatus),
  reviewNotes: z.string().max(500).optional(),
});

export const contractTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  version: z.string().min(1).max(40),
  body: z.string().min(10),
  isActive: z.boolean().default(true),
});

export const rolePermissionsAssignmentSchema = z.object({
  permissionIds: z.array(z.string().min(1)),
});

export const updateContractSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  sentAt: z.string().datetime().optional(),
  acceptedAt: z.string().datetime().optional(),
});

export const acceptContractSchema = z.object({
  accepted: z.literal(true),
});

export const markNotificationReadSchema = z.object({
  isRead: z.literal(true),
});
