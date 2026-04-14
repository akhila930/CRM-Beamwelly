import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

const leadTemplateColumns = [
  { header: "Name", key: "name", required: true },
  { header: "Email", key: "email", required: true },
  { header: "Mobile Number", key: "mobile_number", required: false },
  { header: "Company Name", key: "company_name", required: false },
  { header: "Profession", key: "profession", required: false },
  { header: "Qualification", key: "qualification", required: false },
  { header: "Income", key: "income", required: false },
  { header: "Date of Investment", key: "date_of_investment", required: false },
  { header: "Investment Type", key: "investment_type", required: false },
  { header: "Reference Name", key: "reference_name", required: false },
  { header: "Reference Email", key: "reference_email", required: false },
  { header: "Reference Contact", key: "reference_contact", required: false },
  { header: "Relationship Manager", key: "relationship_manager", required: false },
  { header: "Interaction Type", key: "interaction_type", required: false },
  { header: "Source", key: "source", required: false },
  { header: "Notes", key: "notes", required: false },
  { header: "Expected Value", key: "expected_value", required: false },
  { header: "Assigned To", key: "assigned_to", required: false },
];

const clientTemplateColumns = [
  { header: "Name", key: "name", required: true },
  { header: "Email", key: "email", required: true },
  { header: "Mobile Number", key: "mobile_number", required: false },
  { header: "Company Name", key: "company_name", required: false },
  { header: "Profession", key: "profession", required: false },
  { header: "Qualification", key: "qualification", required: false },
  { header: "Income", key: "income", required: false },
  { header: "Date of Investment", key: "date_of_investment", required: false },
  { header: "Investment Type", key: "investment_type", required: false },
  { header: "Reference Name", key: "reference_name", required: false },
  { header: "Reference Email", key: "reference_email", required: false },
  { header: "Reference Contact", key: "reference_contact", required: false },
  { header: "Relationship Manager", key: "relationship_manager", required: false },
  { header: "Interaction Type", key: "interaction_type", required: false },
  { header: "Status", key: "status", required: false },
  { header: "Notes", key: "notes", required: false },
  { header: "Assigned To", key: "assigned_to", required: false },
];

const investmentTypes = [
  "equity",
  "sip",
  "lumsum",
  "insurance",
  "PMS",
  "AID",
  "others"
];

const interactionTypes = [
  "call",
  "meeting",
  "email",
  "other"
];

const statusTypes = [
  "active",
  "inactive"
];

export function BulkImportTemplates() {
  const downloadTemplate = (type: "lead" | "client") => {
    const columns = type === "lead" ? leadTemplateColumns : clientTemplateColumns;
    const worksheet = XLSX.utils.aoa_to_sheet([
      columns.map(col => col.header),
      columns.map(col => col.required ? "Required" : "Optional"),
    ]);

    // Add data validation for dropdowns
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    // Add data validation for investment type
    const investmentTypeCol = columns.findIndex(col => col.key === "investment_type");
    if (investmentTypeCol !== -1) {
      worksheet["!dataValidation"] = {
        [`${String.fromCharCode(65 + investmentTypeCol)}2:${String.fromCharCode(65 + investmentTypeCol)}1000`]: {
          type: "list",
          values: investmentTypes,
        },
      };
    }

    // Add data validation for interaction type
    const interactionTypeCol = columns.findIndex(col => col.key === "interaction_type");
    if (interactionTypeCol !== -1) {
      worksheet["!dataValidation"] = {
        [`${String.fromCharCode(65 + interactionTypeCol)}2:${String.fromCharCode(65 + interactionTypeCol)}1000`]: {
          type: "list",
          values: interactionTypes,
        },
      };
    }

    // Add data validation for status (client template only)
    if (type === "client") {
      const statusCol = columns.findIndex(col => col.key === "status");
      if (statusCol !== -1) {
        worksheet["!dataValidation"] = {
          [`${String.fromCharCode(65 + statusCol)}2:${String.fromCharCode(65 + statusCol)}1000`]: {
            type: "list",
            values: statusTypes,
          },
        };
      }
    }

    // Save the file
    XLSX.writeFile(workbook, `${type}_import_template.xlsx`);
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => downloadTemplate("lead")}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Lead Template
      </Button>
      <Button
        variant="outline"
        onClick={() => downloadTemplate("client")}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Client Template
      </Button>
    </div>
  );
} 