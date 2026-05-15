export type CustomerProfileRecord = {
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiryDate?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  country?: string | null;
  acceptPolicy?: boolean | null;
};

const requiredCustomerProfileFields: Array<keyof CustomerProfileRecord> = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "nationality",
  "passportNumber",
  "passportExpiryDate",
  "phone",
  "addressLine1",
  "city",
  "postcode",
  "country",
];

export function isCustomerProfileComplete(profile: CustomerProfileRecord | null | undefined) {
  if (!profile) return false;

  const hasAllFields = requiredCustomerProfileFields.every((field) => {
    const value = profile[field];
    return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
  });

  return hasAllFields && profile.acceptPolicy === true;
}
