import { AppError } from "../../../shared/errors/AppError.js";

export const LEAD_STATUSES = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  WON: "won",
  LOST: "lost",
};

const VALID_LEAD_STATUSES = Object.values(LEAD_STATUSES);

function normalizeOptionalString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

export class Lead {
  constructor({
    id = null,
    businessId,
    conversationId = null,
    name = null,
    phone = null,
    email = null,
    notes = null,
    status = LEAD_STATUSES.NEW,
  }) {
    if (!businessId) {
      throw new AppError("Lead businessId is required", 400);
    }

    if (!VALID_LEAD_STATUSES.includes(status)) {
      throw new AppError(`Invalid lead status: ${status}`, 400);
    }

    const normalizedName = normalizeOptionalString(name);

    const normalizedPhone = normalizeOptionalString(phone);

    const normalizedEmail = normalizeOptionalString(email);

    const normalizedNotes = normalizeOptionalString(notes);

    /*
     * Un lead necesita al menos una forma
     * real de contacto.
     */
    if (!normalizedPhone && !normalizedEmail) {
      throw new AppError("A lead requires at least a phone or email", 400);
    }

    this.id = id;
    this.businessId = businessId;
    this.conversationId = conversationId;
    this.name = normalizedName;
    this.phone = normalizedPhone;
    this.email = normalizedEmail;
    this.notes = normalizedNotes;
    this.status = status;
  }
}
