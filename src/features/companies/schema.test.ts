import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanCoreValues,
  cleanSocials,
  companySchema,
  emptyCompanyInput,
  isGst,
  normalizeGst,
  normalizeHttpUrl,
} from "./schema.ts";

describe("company details", () => {
  it("accepts a real GST number and ignores case and spaces", () => {
    assert.equal(normalizeGst(" 33abcde1234f1z5 "), "33ABCDE1234F1Z5");
    assert.equal(isGst("33ABCDE1234F1Z5"), true);
    assert.equal(isGst("33ABCDE1234F1X5"), false);
    assert.equal(isGst("1234"), false);
  });

  it("adds a scheme to a bare web address", () => {
    assert.equal(normalizeHttpUrl("maayasoft.in"), "https://maayasoft.in");
    assert.equal(normalizeHttpUrl("http://a.in"), "http://a.in");
    assert.equal(normalizeHttpUrl("  "), null);
  });

  it("keeps only social links that parse", () => {
    assert.deepEqual(cleanSocials({ linkedin: "linkedin.com/company/x", x: "not a url" }), {
      linkedin: "https://linkedin.com/company/x",
    });
  });

  it("drops blank and repeated core values", () => {
    assert.deepEqual(cleanCoreValues(["Trust", " trust ", "", "Craft"]), ["Trust", "Craft"]);
  });

  it("needs only a name", () => {
    const empty = emptyCompanyInput();
    assert.equal(companySchema.safeParse(empty).success, false);
    assert.equal(companySchema.safeParse({ ...empty, name: "Maaya Software" }).success, true);
  });

  it("explains a bad GST number and a bad year at the field", () => {
    const result = companySchema.safeParse({
      ...emptyCompanyInput(),
      name: "Maaya",
      gstNumber: "nope",
      foundedYear: "20",
    });
    assert.equal(result.success, false);
    const paths = result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
    assert.deepEqual(paths.sort(), ["foundedYear", "gstNumber"]);
  });
});
