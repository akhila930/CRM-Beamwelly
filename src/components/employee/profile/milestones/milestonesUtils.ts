
import { Milestone } from "@/types/employee";
import * as XLSX from 'xlsx';

export const exportMilestonesToExcel = (milestones: Milestone[], employeeId: string) => {
  try {
    // Prepare the data for export
    const exportData = milestones.map((m) => ({
      title: m.title,
      description: m.description,
      achievedDate: m.achievedDate,
      type: m.type,
    }));
    
    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Milestones');
    
    // Generate and download the Excel file
    XLSX.writeFile(workbook, `milestones_${employeeId}.xlsx`);
  } catch (error) {
    console.error('Error exporting milestones to Excel:', error);
  }
};
