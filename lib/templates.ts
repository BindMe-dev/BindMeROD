export type TemplateCategory =
  | "personal"
  | "financial"
  | "shared"
  | "service"

export type CounterpartyType = "none" | "single" | "multiple"

export interface AgreementTemplate {
  id: string
  title: string
  description: string
  type: "one-time" | "recurring" | "deadline" | "bet"
  category: TemplateCategory
  counterpartyType: CounterpartyType
  icon: string
  tags: string[]
  defaultDuration?: number
  recurrenceFrequency?: "daily" | "weekly" | "monthly"
  popular?: boolean
  fields: TemplateField[]
}

export interface TemplateField {
  id: string
  label: string
  type: "text" | "textarea" | "date" | "number" | "select" | "checkbox" | "currency" | "multiselect"
  required: boolean
  placeholder?: string
  options?: readonly string[]
  defaultValue?: any
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; icon: string }> = {
  personal: { label: "Personal", icon: "P" },
  financial: { label: "Financial", icon: "F" },
  shared: { label: "Shared", icon: "S" },
  service: { label: "Service", icon: "Sv" },
}

const today = new Date().toISOString().split("T")[0]

const CONTACT_FIELDS: TemplateField[] = [
  { id: "partyAName", label: "Your legal name", type: "text", required: true, placeholder: "Full name as on ID" },
  { id: "partyAAddress", label: "Your address", type: "text", required: true, placeholder: "Street, city, postcode" },
  { id: "partyADob", label: "Your date of birth", type: "date", required: true },
  { id: "partyALicenceId", label: "Your licence/ID", type: "text", required: false, placeholder: "Driving licence or ID number" },
  { id: "partyBName", label: "Counterparty legal name", type: "text", required: true, placeholder: "Full name as on ID" },
  { id: "partyBAddress", label: "Counterparty address", type: "text", required: true, placeholder: "Street, city, postcode" },
  { id: "partyBDob", label: "Counterparty date of birth", type: "date", required: true },
  { id: "partyBLicenceId", label: "Counterparty licence/ID", type: "text", required: false, placeholder: "Driving licence or ID number" },
]

export const GOVERNING_LAWS = [
  "England and Wales",
  "Scotland", 
  "Northern Ireland",
  "Republic of Ireland",
  "United States (Federal)",
  "New York State",
  "California State",
  "Delaware State",
  "Canada (Federal)",
  "Ontario",
  "Quebec",
  "Australia (Federal)",
  "New South Wales",
  "Victoria",
  "European Union",
  "Germany",
  "France",
  "Netherlands",
  "Switzerland",
  "Singapore",
  "Hong Kong",
  "Other"
] as const

export type GoverningLaw = typeof GOVERNING_LAWS[number]

const CORE_FIELDS: TemplateField[] = [
  { id: "agreementDate", label: "Date of agreement", type: "date", required: true, defaultValue: today },
  { id: "contractStartDate", label: "Contract start date", type: "date", required: true, defaultValue: today },
  { id: "contractEndDate", label: "Contract end date", type: "date", required: false },
  { id: "isPermanent", label: "Permanent contract (no end date)", type: "checkbox", required: false, defaultValue: false },
  { id: "purpose", label: "Purpose of agreement", type: "textarea", required: true, placeholder: "Why this agreement exists and what it covers" },
  { id: "terms", label: "Key terms", type: "textarea", required: true, placeholder: "Obligations, deliverables, payment schedules, etc." },
  { id: "breachConsequences", label: "Breach consequences", type: "textarea", required: false, placeholder: "What happens if either party breaches the agreement" },
  { id: "witnessRequired", label: "Witness required", type: "checkbox", required: false, defaultValue: false },
  { id: "witnessNotes", label: "Witness notes", type: "textarea", required: false, placeholder: "Who will witness, when they sign, or conditions that trigger a witness" },
  { id: "governingLaw", label: "Governing law", type: "multiselect", required: true, options: GOVERNING_LAWS, defaultValue: ["England and Wales"] },
]

export const AGREEMENT_TEMPLATES: AgreementTemplate[] = [
  {
    id: "basic-agreement",
    title: "Basic Agreement",
    description: "Customisable agreement with core UK contract essentials and an optional witness.",
    type: "one-time",
    category: "shared",
    counterpartyType: "single",
    icon: "BA",
    tags: ["general", "contract", "custom"],
    popular: true,
    fields: [
      ...CONTACT_FIELDS,
      ...CORE_FIELDS,
      { id: "scopeOfWork", label: "Scope / subject matter", type: "textarea", required: false, placeholder: "What is being promised or exchanged" },
      { id: "paymentOrConsideration", label: "Payment or consideration", type: "textarea", required: false, placeholder: "Fees, consideration, or value being exchanged" },
      { id: "timeline", label: "Timeline / milestones", type: "textarea", required: false, placeholder: "Key dates, milestones, or delivery deadlines" },
      { id: "disputeResolution", label: "Dispute resolution", type: "textarea", required: false, placeholder: "How disputes will be handled" },
    ],
  },
  {
    id: "loan-agreement",
    title: "Loan Agreement",
    description: "Clear repayment, interest, and default terms for personal lending.",
    type: "deadline",
    category: "financial",
    counterpartyType: "single",
    icon: "LN",
    tags: ["loan", "lending", "money"],
    popular: false,
    fields: [
      ...CONTACT_FIELDS,
      ...CORE_FIELDS,
      { id: "loanAmount", label: "Loan amount (£)", type: "currency", required: true, placeholder: "0.00" },
      { id: "loanDisbursementDate", label: "Disbursement date", type: "date", required: true, defaultValue: today },
      { id: "paymentMethod", label: "Payment method", type: "text", required: true, placeholder: "Bank transfer, cash, etc." },
      { id: "repaymentStructure", label: "Repayment structure", type: "select", required: true, options: ["single", "instalments"], defaultValue: "single" },
      { id: "singleRepaymentAmount", label: "Single repayment amount (£)", type: "currency", required: false, placeholder: "Amount due if single repayment" },
      { id: "singleRepaymentDate", label: "Single repayment date", type: "date", required: false },
      { id: "instalmentAmount", label: "Instalment amount (£)", type: "currency", required: false },
      { id: "instalmentFrequency", label: "Instalment frequency", type: "select", required: false, options: ["weekly", "monthly", "other"], defaultValue: "monthly" },
      { id: "instalmentStart", label: "Instalment start date", type: "date", required: false },
      { id: "instalmentEnd", label: "Instalment end date", type: "date", required: false },
      { id: "interestType", label: "Interest type", type: "select", required: true, options: ["none", "simple", "compound"], defaultValue: "none" },
      { id: "interestRate", label: "Interest rate (%)", type: "number", required: false, placeholder: "0" },
      { id: "interestPaymentTiming", label: "Interest payable", type: "select", required: false, options: ["monthly", "with final repayment", "other"], defaultValue: "with final repayment" },
      { id: "earlyRepayment", label: "Early repayment terms", type: "textarea", required: false, placeholder: "Whether early repayment is allowed and any fees" },
      { id: "defaultClause", label: "Default and remedies", type: "textarea", required: true, placeholder: "What constitutes default and what happens" },
      { id: "assignment", label: "No assignment", type: "textarea", required: false, defaultValue: "The borrower may not transfer this agreement without written consent." },
      { id: "amendment", label: "Amendments", type: "textarea", required: false, defaultValue: "Changes must be in writing and signed by both parties." },
    ],
  },
  {
    id: "item-lending",
    title: "Item Lending",
    description: "Loan of goods with clear care, insurance, and return conditions.",
    type: "deadline",
    category: "service",
    counterpartyType: "single",
    icon: "IL",
    tags: ["goods", "borrow", "equipment"],
    fields: [
      ...CONTACT_FIELDS,
      ...CORE_FIELDS,
      { id: "itemDescription", label: "Item description", type: "textarea", required: true, placeholder: "Description incl. make/model" },
      { id: "serialNumber", label: "Registration / serial number", type: "text", required: false, placeholder: "Plate, VIN, or serial" },
      { id: "itemCondition", label: "Current condition", type: "textarea", required: true, placeholder: "Condition at handover" },
      { id: "itemValue", label: "Estimated value (£)", type: "currency", required: false, placeholder: "Replacement value" },
      { id: "loanStartDate", label: "Loan start date", type: "date", required: true, defaultValue: today },
      { id: "loanEndDate", label: "Loan end date", type: "date", required: true },
      { id: "returnPolicy", label: "Return policy", type: "select", required: true, options: ["on end date", "on demand with notice"], defaultValue: "on end date" },
      { id: "permittedUse", label: "Permitted use", type: "textarea", required: true, placeholder: "Purpose and lawful use only" },
      { id: "restrictedUse", label: "Restrictions", type: "textarea", required: false, placeholder: "No lending to others, limits on use, etc." },
      { id: "careExpectations", label: "Care and condition", type: "textarea", required: true, placeholder: "Maintenance, cleaning, storage expectations" },
      { id: "damageLossResponsibility", label: "Damage / loss", type: "textarea", required: true, placeholder: "Who pays for damage, loss, or theft" },
      { id: "insuranceResponsibility", label: "Insurance", type: "select", required: false, options: ["owner provides cover", "borrower provides cover", "not insured"], defaultValue: "owner provides cover" },
      { id: "insuranceDetails", label: "Insurance details", type: "textarea", required: false, placeholder: "Policy reference or proof required" },
      { id: "costResponsibilities", label: "Costs / expenses", type: "textarea", required: false, placeholder: "Fuel, cleaning, fines, other costs" },
      { id: "terminationRights", label: "Termination", type: "textarea", required: false, placeholder: "When the owner can end the loan" },
    ],
  },
  {
    id: "rental-agreement",
    title: "Residential Tenancy (AST)",
    description: "AST-style rental with rent, deposit, utilities, and break clause prompts.",
    type: "deadline",
    category: "service",
    counterpartyType: "single",
    icon: "RA",
    tags: ["rental", "tenancy", "housing"],
    fields: [
      ...CONTACT_FIELDS,
      ...CORE_FIELDS,
      { id: "propertyAddress", label: "Property address", type: "textarea", required: true, placeholder: "Full address of the property let" },
      { id: "termMonths", label: "Fixed term (months)", type: "number", required: true, placeholder: "e.g. 6" },
      { id: "startDate", label: "Start date", type: "date", required: true, defaultValue: today },
      { id: "endDate", label: "End date", type: "date", required: true },
      { id: "rentAmount", label: "Rent (£ per calendar month)", type: "currency", required: true, placeholder: "0.00" },
      { id: "rentDueDay", label: "Rent due day of month", type: "number", required: true, placeholder: "e.g. 1 for first of the month" },
      { id: "paymentMethod", label: "Payment method", type: "text", required: true, placeholder: "Standing order, bank transfer" },
      { id: "depositAmount", label: "Deposit (£)", type: "currency", required: true, placeholder: "Not more than 5 weeks' rent" },
      { id: "depositScheme", label: "Deposit protection scheme info", type: "textarea", required: false, placeholder: "Scheme name and reference" },
      { id: "breakClauseMonths", label: "Break clause earliest month", type: "number", required: false, placeholder: "Earliest month the break clause can be used" },
      { id: "breakClauseNotice", label: "Break clause notice", type: "textarea", required: false, placeholder: "Notice period (e.g., 2 months) and conditions" },
      { id: "includedUtilities", label: "Rent includes/excludes", type: "textarea", required: false, placeholder: "Utilities, council tax, other charges" },
      { id: "tenantObligations", label: "Tenant obligations", type: "textarea", required: true, placeholder: "Care of property, no nuisance, report repairs" },
      { id: "landlordObligations", label: "Landlord obligations", type: "textarea", required: true, placeholder: "Repairs, safety compliance, quiet enjoyment" },
      { id: "repairsAccess", label: "Repairs and access notice", type: "textarea", required: false, defaultValue: "24 hours' notice for inspections and repairs except emergencies." },
      { id: "inventoryNotes", label: "Inventory / condition notes", type: "textarea", required: false, placeholder: "Reference any inventory or condition report" },
      { id: "termination", label: "Ending tenancy", type: "textarea", required: false, placeholder: "Notice requirements at the end of the fixed term" },
    ],
  },
  {
    id: "private-wager",
    title: "Private Wager (18+)",
    description: "Private, non-commercial wager with clear stakes and outcome determination.",
    type: "bet",
    category: "financial",
    counterpartyType: "single",
    icon: "WG",
    tags: ["bet", "wager", "private"],
    fields: [
      ...CONTACT_FIELDS,
      ...CORE_FIELDS,
      { id: "eventDescription", label: "Event / outcome description", type: "textarea", required: true, placeholder: "What the wager is about and how it's measured" },
      { id: "stakeType", label: "Stake type", type: "select", required: true, options: ["monetary", "other"], defaultValue: "monetary" },
      { id: "stakeAmount", label: "Stake amount (£)", type: "currency", required: false, placeholder: "Fill if monetary stake" },
      { id: "stakeDescription", label: "Other stake description", type: "textarea", required: false, placeholder: "Goods or services to be provided by losing party" },
      { id: "determinationMethod", label: "How outcome will be determined", type: "textarea", required: true, placeholder: "Objective criteria or third-party source" },
      { id: "thirdPartySource", label: "Third-party source (if any)", type: "text", required: false, placeholder: "e.g., official league site" },
      { id: "paymentDeadlineDays", label: "Payment deadline (days)", type: "number", required: true, placeholder: "Days to settle after result" },
      { id: "betSettlementDate", label: "Settlement / payment date", type: "date", required: false, placeholder: "If known, when the stake must be paid" },
      { id: "paymentMethod", label: "Payment method", type: "text", required: false, placeholder: "Bank transfer, cash, etc." },
      { id: "lawfulConduct", label: "Lawful conduct confirmation", type: "textarea", required: false, defaultValue: "The wager is private, lawful, and not part of any business gambling operation." },
    ],
  },
]


