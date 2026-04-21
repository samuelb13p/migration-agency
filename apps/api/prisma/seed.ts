import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import {
  ContractStatus,
  NotificationType,
  PermissionName,
  RoleName,
  UploadedDocumentStatus,
  VisaCaseStatus,
} from "@migration-agency/shared";

const prisma = new PrismaClient();

async function ensureRole(name: RoleName, description: string) {
  return prisma.role.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function ensurePermission(name: PermissionName, description: string) {
  return prisma.permission.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash("ExamplePass123!", 10);

  const [customerRole, agentRole, adminRole] = await Promise.all([
    ensureRole(RoleName.CUSTOMER, "Customer portal access"),
    ensureRole(RoleName.AGENT, "Assigned case review access"),
    ensureRole(RoleName.ADMIN, "Platform administration access"),
  ]);

  const permissionDefinitions = [
    [PermissionName.VIEW_OWN_CASES, "View own visa cases"],
    [PermissionName.VIEW_ASSIGNED_CASES, "View assigned visa cases"],
    [PermissionName.REVIEW_DOCUMENTS, "Review uploaded documents"],
    [PermissionName.GENERATE_CONTRACTS, "Generate contracts"],
    [PermissionName.MANAGE_USERS, "Manage users"],
    [PermissionName.MANAGE_ROLES, "Manage roles and permissions"],
    [PermissionName.MANAGE_VISA_TYPES, "Manage visa types"],
    [PermissionName.MANAGE_DOCUMENT_TYPES, "Manage document types"],
    [PermissionName.MANAGE_VISA_RULES, "Manage visa document rules"],
    [PermissionName.MANAGE_CASES, "Manage visa cases"],
  ] as const;

  const permissions = await Promise.all(
    permissionDefinitions.map(([name, description]) => ensurePermission(name, description)),
  );

  const permissionByName = new Map(permissions.map((permission) => [permission.name, permission]));

  const rolePermissionMap = [
    [customerRole.id, PermissionName.VIEW_OWN_CASES],
    [agentRole.id, PermissionName.VIEW_ASSIGNED_CASES],
    [agentRole.id, PermissionName.REVIEW_DOCUMENTS],
    [agentRole.id, PermissionName.GENERATE_CONTRACTS],
    [adminRole.id, PermissionName.MANAGE_USERS],
    [adminRole.id, PermissionName.MANAGE_ROLES],
    [adminRole.id, PermissionName.MANAGE_VISA_TYPES],
    [adminRole.id, PermissionName.MANAGE_DOCUMENT_TYPES],
    [adminRole.id, PermissionName.MANAGE_VISA_RULES],
    [adminRole.id, PermissionName.MANAGE_CASES],
  ] as const;

  for (const [roleId, permissionName] of rolePermissionMap) {
    const permission = permissionByName.get(permissionName);
    if (!permission) continue;

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId: permission.id,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@migration.local" },
    update: { roleId: adminRole.id, passwordHash },
    create: {
      email: "admin@migration.local",
      passwordHash,
      roleId: adminRole.id,
      adminProfile: {
        create: {
          firstName: "Admin",
          lastName: "User",
        },
      },
    },
    include: { adminProfile: true },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: "agent@migration.local" },
    update: { roleId: agentRole.id, passwordHash },
    create: {
      email: "agent@migration.local",
      passwordHash,
      roleId: agentRole.id,
      agentProfile: {
        create: {
          firstName: "Case",
          lastName: "Agent",
          phone: "+61 811 111 111",
        },
      },
    },
    include: { agentProfile: true },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: "customer@migration.local" },
    update: { roleId: customerRole.id, passwordHash },
    create: {
      email: "customer@migration.local",
      passwordHash,
      roleId: customerRole.id,
      customerProfile: {
        create: {
          firstName: "Demo",
          lastName: "Customer",
          nationality: "India",
          passportNumber: "N1234567",
          acceptPolicy: true,
          acceptedPolicyAt: new Date(),
          city: "Adelaide",
          country: "Australia",
        },
      },
    },
    include: { customerProfile: true },
  });

  const studentVisa = await prisma.visaType.upsert({
    where: { code: "STU" },
    update: {},
    create: {
      code: "STU",
      name: "Student Visa",
      description: "Demo student visa pathway",
      isActive: true,
    },
  });

  const passportDocumentType = await prisma.documentType.upsert({
    where: { code: "PASSPORT" },
    update: {},
    create: {
      code: "PASSPORT",
      name: "Passport",
      description: "Identity and passport document",
      allowedExtensions: ["pdf", "jpg", "jpeg", "png"],
      maxFileSizeMb: 10,
    },
  });

  const photoDocumentType = await prisma.documentType.upsert({
    where: { code: "VISA_PHOTO" },
    update: {},
    create: {
      code: "VISA_PHOTO",
      name: "Visa Photo",
      description: "Passport-style photograph",
      allowedExtensions: ["jpg", "jpeg", "png"],
      maxFileSizeMb: 5,
    },
  });

  const coeDocumentType = await prisma.documentType.upsert({
    where: { code: "COE" },
    update: {},
    create: {
      code: "COE",
      name: "Confirmation of Enrolment",
      description: "Confirmation of enrolment document",
      allowedExtensions: ["pdf"],
      maxFileSizeMb: 10,
    },
  });

  const mappings = [
    [passportDocumentType.id, 1],
    [photoDocumentType.id, 2],
    [coeDocumentType.id, 3],
  ] as const;

  for (const [documentTypeId, sortOrder] of mappings) {
    await prisma.visaTypeRequiredDocument.upsert({
      where: {
        visaTypeId_documentTypeId: {
          visaTypeId: studentVisa.id,
          documentTypeId,
        },
      },
      update: { isRequired: true, sortOrder },
      create: {
        visaTypeId: studentVisa.id,
        documentTypeId,
        isRequired: true,
        sortOrder,
      },
    });
  }

  if (!customerUser.customerProfile || !agentUser.agentProfile) {
    throw new Error("Required seeded profiles were not created.");
  }

  const visaCase = await prisma.visaCase.upsert({
    where: { caseNumber: "CASE-2026-0001" },
    update: {},
    create: {
      caseNumber: "CASE-2026-0001",
      visaTypeId: studentVisa.id,
      customerProfileId: customerUser.customerProfile.id,
      agentProfileId: agentUser.agentProfile.id,
      status: VisaCaseStatus.WAITING_DOCUMENTS,
    },
  });

  const uploadedDocument = await prisma.uploadedDocument.upsert({
    where: {
      visaCaseId_documentTypeId_versionNumber: {
        visaCaseId: visaCase.id,
        documentTypeId: passportDocumentType.id,
        versionNumber: 1,
      },
    },
    update: {},
    create: {
      visaCaseId: visaCase.id,
      documentTypeId: passportDocumentType.id,
      uploadedByUserId: customerUser.id,
      originalFileName: "passport-demo.pdf",
      storedFileName: "case-2026-0001-passport-v1.pdf",
      fileUrl: "private/cases/CASE-2026-0001/passport-v1.pdf",
      mimeType: "application/pdf",
      fileSizeBytes: 1024,
      versionNumber: 1,
      status: UploadedDocumentStatus.PENDING,
    },
  });

  const contractTemplate = await prisma.contractTemplate.upsert({
    where: {
      name_version: {
        name: "Migration Services Agreement",
        version: "v1",
      },
    },
    update: {},
    create: {
      name: "Migration Services Agreement",
      version: "v1",
      body: "Agreement for {{customer_name}} regarding {{visa_type_name}}.",
      isActive: true,
    },
  });

  await prisma.contract.upsert({
    where: { id: "seed-contract-case-2026-0001" },
    update: {},
    create: {
      id: "seed-contract-case-2026-0001",
      visaCaseId: visaCase.id,
      contractTemplateId: contractTemplate.id,
      generatedByUserId: adminUser.id,
      generatedFileUrl: "private/contracts/CASE-2026-0001/agreement-v1.pdf",
      status: ContractStatus.GENERATED,
    },
  });

  await prisma.notification.deleteMany({
    where: {
      visaCaseId: visaCase.id,
      userId: { in: [customerUser.id, agentUser.id] },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customerUser.id,
        visaCaseId: visaCase.id,
        type: NotificationType.CHECKLIST_COMPLETED,
        title: "Welcome to your case",
        message: "Your visa case has been created. Upload your remaining required documents.",
      },
      {
        userId: agentUser.id,
        visaCaseId: visaCase.id,
        type: NotificationType.DOCUMENT_UPLOADED,
        title: "Document uploaded",
        message: `A new ${passportDocumentType.name} upload is ready for review.`,
      },
    ],
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      visaCaseId: visaCase.id,
      action: "seed.initialize",
      entityType: "VisaCase",
      entityId: visaCase.id,
      metadata: {
        uploadedDocumentId: uploadedDocument.id,
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
