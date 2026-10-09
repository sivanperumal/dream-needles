import { describe, expect, it } from "vitest";
import {
  addressSchema,
  fieldErrors,
  phoneSchema,
  profileSchema,
} from "@/lib/validation/account";

const valid = {
  full_name: "Asha K",
  phone: "+91 98765 43210",
  line1: "12 Main Road",
  city: "Chennai",
  state: "Tamil Nadu",
  pincode: "600017",
};

describe("phoneSchema", () => {
  it("normalises Indian mobile numbers", () => {
    expect(phoneSchema.parse("+91 98765 43210")).toBe("9876543210");
    expect(phoneSchema.parse("09876543210")).toBe("9876543210");
  });

  it("rejects landlines and short numbers", () => {
    expect(phoneSchema.safeParse("4423456789").success).toBe(false);
    expect(phoneSchema.safeParse("98765").success).toBe(false);
  });
});

describe("addressSchema", () => {
  it("accepts a complete address and fills optional fields with null", () => {
    expect(addressSchema.parse(valid)).toMatchObject({
      phone: "9876543210",
      line2: null,
      is_default: false,
    });
  });

  it("reports one message per bad field", () => {
    const result = addressSchema.safeParse({
      ...valid,
      pincode: "06001",
      state: "Atlantis",
      full_name: " ",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toMatchObject({
        pincode: "Enter a valid 6-digit pincode.",
        state: "Choose your state.",
        full_name: "Full name is required.",
      });
    }
  });

  it("reads checkbox values", () => {
    expect(addressSchema.parse({ ...valid, is_default: "on" }).is_default).toBe(
      true,
    );
  });
});

describe("profileSchema", () => {
  it("allows an empty phone", () => {
    expect(profileSchema.parse({ full_name: "Asha", phone: "" })).toEqual({
      full_name: "Asha",
      phone: undefined,
    });
  });
});

describe("contactSchema", async () => {
  const { contactSchema } = await import("@/lib/validation/contact");
  const valid = {
    name: "Asha",
    email: " Asha@Example.com ",
    subject: "Custom order",
    message: "Can you make a blue elephant?",
  };

  it("accepts and normalises a message", () => {
    expect(contactSchema.parse(valid)).toMatchObject({
      email: "asha@example.com",
      phone: null,
    });
  });

  it("rejects short messages, unknown topics and a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(
      false,
    );
    expect(contactSchema.safeParse({ ...valid, subject: "Spam" }).success).toBe(
      false,
    );
    expect(
      contactSchema.safeParse({ ...valid, website: "http://spam" }).success,
    ).toBe(false);
  });
});
