import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cleanRoleTitle,
  companyFromHost,
  isBoilerplateCompany,
  isBoilerplateTitle,
  titleCaseSlug,
  truncateDescription
} from "../text";

test("isBoilerplateTitle rejects careers landing pages", () => {
  // The exact title Microsoft's redirect target serves.
  assert.equal(isBoilerplateTitle("Careers at Microsoft"), true);
  assert.equal(isBoilerplateTitle("Careers"), true);
  assert.equal(isBoilerplateTitle("Careers | Microsoft"), true);
  assert.equal(isBoilerplateTitle("Search Jobs"), true);
  assert.equal(isBoilerplateTitle("Just a moment..."), true);
  assert.equal(isBoilerplateTitle("Access Denied"), true);
  assert.equal(isBoilerplateTitle(""), true);
  assert.equal(isBoilerplateTitle(null), true);
});

test("isBoilerplateTitle keeps real roles", () => {
  assert.equal(isBoilerplateTitle("Software Engineer"), false);
  assert.equal(isBoilerplateTitle("Career Coach"), false);
  assert.equal(isBoilerplateTitle("Job Architect"), false);
  assert.equal(isBoilerplateTitle("Staff Engineer, Jobs Platform"), false);
});

test("cleanRoleTitle no longer produces the 'Careers' bug", () => {
  // Regression: the old blanket /\s+at\s+.+$/ turned this into "Careers".
  assert.equal(cleanRoleTitle("Careers at Microsoft"), null);
  assert.notEqual(cleanRoleTitle("Careers at Microsoft"), "Careers");
});

test("cleanRoleTitle strips trailing site branding only", () => {
  assert.equal(cleanRoleTitle("Software Engineer | Microsoft Careers"), "Software Engineer");
  assert.equal(cleanRoleTitle("SDE II | Careers at Microsoft"), "SDE II");
  assert.equal(cleanRoleTitle("Backend Engineer - LinkedIn"), "Backend Engineer");
  // Regression: "Jobs" mid-title is part of the role, not branding.
  assert.equal(cleanRoleTitle("Staff Engineer – Jobs Platform"), "Staff Engineer – Jobs Platform");
});

test("cleanRoleTitle only strips ' at <Company>' for the resolved company", () => {
  assert.equal(cleanRoleTitle("Engineer at Acme", { company: "Acme" }), "Engineer");
  assert.equal(cleanRoleTitle("Engineer at Scale", { company: "Acme" }), "Engineer at Scale");
});

test("titleCaseSlug handles roman numerals and separators", () => {
  assert.equal(titleCaseSlug("Software-Engineer-II"), "Software Engineer II");
  assert.equal(titleCaseSlug("senior-software-engineer-ii"), "Senior Software Engineer II");
  assert.equal(titleCaseSlug("data_scientist"), "Data Scientist");
});

test("companyFromHost resolves employers but not ATS hosts", () => {
  assert.equal(companyFromHost("microsoft.com"), "Microsoft");
  // "Apply" is page furniture, not an employer — the Eightfold importer passes
  // the registrable domain here instead of the raw host for exactly this reason.
  assert.equal(companyFromHost("apply.careers.microsoft.com"), null);
  assert.equal(companyFromHost("boards.greenhouse.io"), null);
  assert.equal(companyFromHost("jobs.lever.co"), null);
  assert.equal(companyFromHost("linkedin.com"), null);
});

test("isBoilerplateCompany rejects branding and bare hosts", () => {
  assert.equal(isBoilerplateCompany("Careers"), true);
  assert.equal(isBoilerplateCompany("example.com", "example.com"), true);
  assert.equal(isBoilerplateCompany("Microsoft"), false);
});

test("truncateDescription collapses whitespace and caps length", () => {
  assert.equal(truncateDescription("  a   b \n c "), "a b c");
  assert.equal(truncateDescription("x".repeat(50), 10).length, 11); // 10 + ellipsis
});
