import { Prisma } from "@prisma/client";
import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";

export const adminConfigService = {
  listRoles() {
    return prisma.role.findMany({
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { name: "asc" } },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  listPermissions() {
    return prisma.permission.findMany({
      orderBy: { name: "asc" },
    });
  },

  async getRolePermissions(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
          orderBy: { permission: { name: "asc" } },
        },
      },
    });

    if (!role) {
      throw new HttpError(404, "Role not found.");
    }

    return role;
  },

  async assignRolePermissions(roleId: string, permissionIds: string[]) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new HttpError(404, "Role not found.");
    }

    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
      select: { id: true },
    });

    if (permissions.length !== permissionIds.length) {
      throw new HttpError(422, "One or more permissions do not exist.");
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });

      if (permissionIds.length) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        });
      }
    });

    return this.getRolePermissions(roleId);
  },

  listContractTemplates() {
    return prisma.contractTemplate.findMany({
      orderBy: [{ name: "asc" }, { version: "asc" }],
    });
  },

  async getContractTemplate(templateId: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new HttpError(404, "Contract template not found.");
    }

    return template;
  },

  createContractTemplate(input: { name: string; version: string; body: string; isActive?: boolean }) {
    return prisma.contractTemplate.create({
      data: input,
    });
  },

  updateContractTemplate(
    templateId: string,
    input: { name?: string; version?: string; body?: string; isActive?: boolean },
  ) {
    return prisma.contractTemplate.update({
      where: { id: templateId },
      data: input,
    });
  },

  async deleteContractTemplate(templateId: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
      include: {
        contracts: {
          select: { id: true },
        },
      },
    });

    if (!template) {
      throw new HttpError(404, "Contract template not found.");
    }

    if (template.contracts.length) {
      throw new HttpError(409, "Cannot delete a contract template that has generated contracts.");
    }

    await prisma.contractTemplate.delete({ where: { id: templateId } });
  },

  listDocumentTypes() {
    return prisma.documentType.findMany({
      include: {
        visaTypeMappings: true,
      },
      orderBy: { name: "asc" },
    });
  },

  async getDocumentType(documentTypeId: string) {
    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
      include: {
        visaTypeMappings: true,
      },
    });

    if (!documentType) {
      throw new HttpError(404, "Document type not found.");
    }

    return documentType;
  },

  createDocumentType(input: {
    code: string;
    name: string;
    description?: string;
    allowedExtensions: string[];
    maxFileSizeMb: number;
  }) {
    return prisma.documentType.create({
      data: input,
    });
  },

  updateDocumentType(
    documentTypeId: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      allowedExtensions?: string[];
      maxFileSizeMb?: number;
    },
  ) {
    return prisma.documentType.update({
      where: { id: documentTypeId },
      data: input,
    });
  },

  async deleteDocumentType(documentTypeId: string) {
    const documentType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
      include: {
        visaTypeMappings: { select: { id: true } },
        uploadedDocuments: { select: { id: true } },
      },
    });

    if (!documentType) {
      throw new HttpError(404, "Document type not found.");
    }

    if (documentType.visaTypeMappings.length || documentType.uploadedDocuments.length) {
      throw new HttpError(409, "Cannot delete a document type that is assigned to visa types or uploads.");
    }

    await prisma.documentType.delete({
      where: { id: documentTypeId },
    });
  },
};
