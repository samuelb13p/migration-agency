import { HttpError } from "../../common/http-error";
import { prisma } from "../../lib/prisma";

export const visaTypesService = {
  list() {
    return prisma.visaType.findMany({
      include: {
        requiredDocumentMappings: {
          include: { documentType: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  },

  async getById(id: string) {
    const record = await prisma.visaType.findUnique({
      where: { id },
      include: {
        requiredDocumentMappings: {
          include: { documentType: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!record) {
      throw new HttpError(404, "Visa type not found.");
    }

    return record;
  },

  createVisaType(input: { code: string; name: string; description?: string; isActive?: boolean }) {
    return prisma.visaType.create({
      data: input,
    });
  },

  updateVisaType(id: string, input: { code?: string; name?: string; description?: string; isActive?: boolean }) {
    return prisma.visaType.update({
      where: { id },
      data: input,
    });
  },

  deleteVisaType(id: string) {
    return prisma.visaType.delete({
      where: { id },
    });
  },

  listDocumentRules(visaTypeId: string) {
    return prisma.visaTypeRequiredDocument.findMany({
      where: { visaTypeId },
      include: { documentType: true },
      orderBy: { sortOrder: "asc" },
    });
  },

  createDocumentRule(
    visaTypeId: string,
    input: { documentTypeId: string; isRequired?: boolean; sortOrder?: number },
  ) {
    return prisma.visaTypeRequiredDocument.create({
      data: {
        visaTypeId,
        ...input,
      },
    });
  },

  updateDocumentRule(
    id: string,
    input: { documentTypeId?: string; isRequired?: boolean; sortOrder?: number },
  ) {
    return prisma.visaTypeRequiredDocument.update({
      where: { id },
      data: input,
    });
  },

  deleteDocumentRule(id: string) {
    return prisma.visaTypeRequiredDocument.delete({
      where: { id },
    });
  },

  listDocumentTypes() {
    return prisma.documentType.findMany({
      orderBy: { name: "asc" },
    });
  },

  createDocumentType(input: {
    code: string;
    name: string;
    description?: string;
    allowedExtensions: string[];
    maxFileSizeMb: number;
  }) {
    return prisma.documentType.create({ data: input });
  },

  updateDocumentType(
    id: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      allowedExtensions?: string[];
      maxFileSizeMb?: number;
    },
  ) {
    return prisma.documentType.update({
      where: { id },
      data: input,
    });
  },
};
