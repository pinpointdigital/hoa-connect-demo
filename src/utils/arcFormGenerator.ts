import { Request, User } from '../types';
import jsPDF from 'jspdf';

export interface ARCFormData {
  homeowner: string;
  address: string;
  lotNumber: string;
  descriptionOfImprovement: string;
  attachmentTypes: string[];
  submittedDate: string;
  communityName: string;
}

export const generateARCForm = (request: Request, homeowner: User): ARCFormData => {
  return {
    homeowner: homeowner.name,
    address: homeowner.homeownerData?.address || '',
    lotNumber: request.lotNumber || 'Not Specified',
    descriptionOfImprovement: request.description,
    attachmentTypes: request.attachmentTypes || [],
    submittedDate: new Date(request.submittedAt).toLocaleDateString(),
    communityName: 'Rancho Madrina Community Association'
  };
};

export const downloadARCFormPDF = (formData: ARCFormData) => {
  try {
    const doc = new jsPDF();
  
  // Load company profile data
  const getCompanyProfile = () => {
    const saved = localStorage.getItem('hoa-company-profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading company profile:', error);
      }
    }
    
    return {
      name: 'Seabreeze Management Company',
      address: '26840 Aliso Viejo Pkwy, Suite 100, Aliso Viejo, CA 92656',
      phone: '(949) 855-9300',
      email: 'info@seabreezemgmt.com',
      logo: undefined
    };
  };
  
  const companyProfile = getCompanyProfile();
  
  // Set up fonts and colors
  doc.setFont('helvetica');
  
  let yPos = 20;
  let leftColumnX = 20; // Left margin for company info
  let logoX = 154; // Right-aligned logo position (210mm - 36mm - 20mm right margin)
  
  // Add company logo on the right side
  if (companyProfile.logo) {
    try {
      // Detect image format from data URL
      const imageFormat = companyProfile.logo.includes('data:image/png') ? 'PNG' : 'JPEG';
      
      // Add logo (right-aligned, rectangular format)
      doc.addImage(companyProfile.logo, imageFormat, logoX, yPos, 36, 12);
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
      // Add rectangular placeholder on the right
      doc.setDrawColor(200, 200, 200); // Light gray border
      doc.setFillColor(250, 250, 250); // Very light gray fill
      
      // Rectangular dimensions (3:1 ratio for professional logo format)
      const rectWidth = 27; // 27mm wide
      const rectHeight = 9; // 9mm tall
      
      doc.rect(logoX + 4.5, yPos + 1.5, rectWidth, rectHeight, 'FD'); // F=fill, D=draw border
      
      // Add text in center of rectangle
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('[Logo]', logoX + 18, yPos + 6, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
    }
  } else {
    // Add rectangular placeholder when no logo is uploaded (right-aligned)
    doc.setDrawColor(200, 200, 200); // Light gray border
    doc.setFillColor(250, 250, 250); // Very light gray fill
    
    // Rectangular dimensions
    const rectWidth = 27; // 27mm wide
    const rectHeight = 9; // 9mm tall
    
    doc.rect(logoX + 4.5, yPos + 1.5, rectWidth, rectHeight, 'FD'); // F=fill, D=draw border
    
    // Add text in center of rectangle
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('[Logo]', logoX + 18, yPos + 6, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
  }
  
  // Left-aligned company info
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(companyProfile.name.toUpperCase(), leftColumnX, yPos, { align: 'left' });
  yPos += 7;
  
  doc.setFontSize(11);
  doc.text(formData.communityName.toUpperCase(), leftColumnX, yPos, { align: 'left' });
  yPos += 7;
  
  doc.setFontSize(10);
  doc.text('REQUEST FOR ARCHITECTURAL APPROVAL', leftColumnX, yPos, { align: 'left' });
  yPos += 8;
  
  // Add company contact info (left-aligned)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(companyProfile.address, leftColumnX, yPos, { align: 'left' });
  yPos += 5;
  doc.text(`Phone: ${companyProfile.phone} | Email: ${companyProfile.email}`, leftColumnX, yPos, { align: 'left' });
  yPos += 10;
  
  // Draw a line separator
  doc.line(20, yPos, 190, yPos);
  yPos += 15;
  
  // Homeowner Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('HOMEOWNER:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formData.homeowner, 55, yPos);
  
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('ADDRESS:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formData.address, 45, yPos);
  
  doc.setFont('helvetica', 'bold');
  doc.text('LOT#:', 140, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(formData.lotNumber, 155, yPos);
  
  yPos += 15;
  
  // Description
  doc.setFont('helvetica', 'bold');
  doc.text('DESCRIPTION OF IMPROVEMENT:', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  const descriptionLines = doc.splitTextToSize(formData.descriptionOfImprovement, 170);
  doc.text(descriptionLines, 20, yPos);
  yPos += descriptionLines.length * 5 + 10;
  
  // Items Attached
  doc.setFont('helvetica', 'bold');
  doc.text('ITEMS ATTACHED:', 20, yPos);
  yPos += 8;
  
  const attachmentOptions = [
    'Plot Plan', 'Rendering', 'Cross Section', 'Floor Plan', 'Material Samples', 'Contractor Information'
  ];
  
  attachmentOptions.forEach(option => {
    const isChecked = formData.attachmentTypes.some(type => 
      type.replace('_', ' ').toLowerCase() === option.toLowerCase().replace(' ', '_')
    );
    
    // Draw checkbox
    doc.rect(20, yPos - 3, 3, 3);
    if (isChecked) {
      doc.text('✓', 21, yPos);
    }
    
    doc.setFont('helvetica', 'normal');
    doc.text(option, 28, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // Draw separator line
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  // Architectural Review Committee Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ARCHITECTURAL REVIEW COMMITTEE', 105, yPos, { align: 'center' });
  yPos += 15;
  
  doc.setFontSize(10);
  doc.text('APPROVED ____________', 40, yPos);
  doc.text('DISAPPROVED ____________', 120, yPos);
  yPos += 15;
  
  doc.text('Condition of Approval/or Reason for Disapproval:', 20, yPos);
  yPos += 8;
  
  // Draw lines for comments
  for (let i = 0; i < 3; i++) {
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
  }
  
  yPos += 10;
  
  // Signature lines
  doc.text('ARC Member', 40, yPos);
  doc.text('ARC Member', 130, yPos);
  yPos += 5;
  
  doc.line(20, yPos, 80, yPos);
  doc.line(110, yPos, 170, yPos);
  yPos += 15;
  
  doc.text('DATE: _______________', 20, yPos);
  doc.text('Signature: _________________________', 100, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.text('Architectural Review Committee', 130, yPos);
  doc.setFontSize(10);
  yPos += 10;
  doc.text('Chairperson', 20, yPos);
  
  // Footer
  yPos = 280;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Generated by HOA Connect on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, yPos, { align: 'center' });
  
    // Save the PDF
    const fileName = `ARC_Application_${formData.homeowner.replace(/\s+/g, '_')}_${formData.submittedDate.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again or contact support.\n\nThis may happen if the uploaded logo file is too large or in an unsupported format.');
    throw error;
  }
};

export const downloadARCForm = (formData: ARCFormData) => {
  const attachmentsList = formData.attachmentTypes.length > 0 
    ? formData.attachmentTypes.map(type => {
        switch(type) {
          case 'plot_plan': return '☑ Plot Plan';
          case 'rendering': return '☑ Rendering';
          case 'cross_section': return '☑ Cross Section';
          case 'floor_plan': return '☑ Floor Plan';
          case 'material_samples': return '☑ Material Samples';
          case 'contractor_info': return '☑ Contractor Information';
          default: return `☑ ${type}`;
        }
      }).join('\n')
    : '☐ No specific attachments indicated';

  const formContent = `
${formData.communityName.toUpperCase()}
REQUEST FOR ARCHITECTURAL APPROVAL

HOMEOWNER: ${formData.homeowner}

ADDRESS: ${formData.address}                    LOT#: ${formData.lotNumber}

DESCRIPTION OF IMPROVEMENT:
${formData.descriptionOfImprovement}


ITEMS ATTACHED:
${attachmentsList}

________________________________________________________________________________
ARCHITECTURAL REVIEW COMMITTEE

APPROVED____________         DISAPPROVED____________

Condition of Approval/or Reason for Disapproval:
________________________________________________
________________________________________________
________________________________________________


ARC Member                              ARC Member

DATE: ___________________    Signature: ________________________________
                                        Architectural Review Committee
Chairperson


REQUEST FOR HEARING BEFORE BOARD OF DIRECTORS

PURPOSE:    To appeal decision of Architectural Review Committee

            APPROVED _______________     DISAPPROVED _______________

Reason for Approval or Disapproval:
________________________________________________
________________________________________________

Date: ___________________
Signature: ________________________________  Board of Directors President

This approval does not relieve applicant from obtaining the necessary building permits
from the governmental agencies involved.


MAINTENANCE DISCLAIMER

Installation to be at no cost whatsoever to the Association. Any further maintenance shall be the
responsibility of the homeowner, heirs or assigns.

________________________________________________    _______________
HOMEOWNER'S SIGNATURE                               DATE


${formData.communityName.toUpperCase()} ARCHITECTURAL REVIEW COMMITTEE ACTION:

____    Returned for Additional Information
        Comments: ________________________________________________
        ________________________________________________

____    Approved

____    Disapproved (Revise & Resubmit)


________________________________________________    _______________
COMMITTEE CHAIRMAN                                  DATE


FINAL INSPECTION

____    Approved
        Comments: ________________________________________________
        ________________________________________________

____    Disapproved


________________________________________________    _______________
INSPECTOR SIGNATURE                                 DATE

Submitted by:    Name: ${formData.homeowner}    Date: ${formData.submittedDate}
Address: ${formData.address}
  `;

  // Create and download the form
  const blob = new Blob([formContent], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ARC_Application_${formData.homeowner.replace(/\s+/g, '_')}_${formData.submittedDate.replace(/\//g, '-')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateARCFormHTML = (formData: ARCFormData): string => {
  const attachmentsList = formData.attachmentTypes.length > 0 
    ? formData.attachmentTypes.map(type => {
        switch(type) {
          case 'plot_plan': return '<input type="checkbox" checked> Plot Plan';
          case 'rendering': return '<input type="checkbox" checked> Rendering';
          case 'cross_section': return '<input type="checkbox" checked> Cross Section';
          case 'floor_plan': return '<input type="checkbox" checked> Floor Plan';
          case 'material_samples': return '<input type="checkbox" checked> Material Samples';
          case 'contractor_info': return '<input type="checkbox" checked> Contractor Information';
          default: return `<input type="checkbox" checked> ${type}`;
        }
      }).join('<br>')
    : '<input type="checkbox"> No specific attachments indicated';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 16px; font-weight: bold; text-decoration: underline;">
          ${formData.communityName.toUpperCase()}
        </h1>
        <h2 style="font-size: 14px; font-weight: bold; margin-top: 5px;">
          REQUEST FOR ARCHITECTURAL APPROVAL
        </h2>
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>HOMEOWNER:</strong> <span style="border-bottom: 1px solid #000; padding-bottom: 2px; display: inline-block; min-width: 300px;">${formData.homeowner}</span>
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>ADDRESS:</strong> <span style="border-bottom: 1px solid #000; padding-bottom: 2px; display: inline-block; min-width: 200px;">${formData.address}</span>
        <span style="margin-left: 50px;"><strong>LOT#:</strong> <span style="border-bottom: 1px solid #000; padding-bottom: 2px; display: inline-block; min-width: 100px;">${formData.lotNumber}</span></span>
      </div>
      
      <div style="margin-bottom: 20px;">
        <strong>DESCRIPTION OF IMPROVEMENT:</strong><br>
        <div style="border-bottom: 1px solid #000; min-height: 60px; padding: 10px; margin-top: 5px;">
          ${formData.descriptionOfImprovement}
        </div>
      </div>
      
      <div style="margin-bottom: 30px;">
        <strong>ITEMS ATTACHED:</strong><br>
        <div style="margin-top: 10px; line-height: 1.8;">
          ${attachmentsList}
        </div>
      </div>
      
      <div style="border-top: 2px solid #000; padding-top: 15px; margin-bottom: 20px;">
        <div style="text-align: center; font-weight: bold; margin-bottom: 15px;">
          ARCHITECTURAL REVIEW COMMITTEE
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>APPROVED</strong> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 100px; margin-left: 20px;"></span>
          <span style="margin-left: 100px;"><strong>DISAPPROVED</strong> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 100px; margin-left: 20px;"></span></span>
        </div>
        
        <div style="margin-bottom: 30px;">
          <strong>Condition of Approval/or Reason for Disapproval:</strong><br>
          <div style="border-bottom: 1px solid #000; min-height: 20px; margin-top: 5px;"></div>
          <div style="border-bottom: 1px solid #000; min-height: 20px; margin-top: 10px;"></div>
          <div style="border-bottom: 1px solid #000; min-height: 20px; margin-top: 10px;"></div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <div style="border-bottom: 1px solid #000; min-width: 200px; margin-bottom: 5px;"></div>
            <div style="text-align: center; font-size: 12px;">ARC Member</div>
          </div>
          <div>
            <div style="border-bottom: 1px solid #000; min-width: 200px; margin-bottom: 5px;"></div>
            <div style="text-align: center; font-size: 12px;">ARC Member</div>
          </div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong>DATE:</strong> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 150px; margin-left: 20px;"></span>
          <span style="margin-left: 50px;"><strong>Signature:</strong> <span style="border-bottom: 1px solid #000; display: inline-block; min-width: 200px; margin-left: 20px;"></span></span>
        </div>
        <div style="text-align: right; font-size: 12px; margin-bottom: 20px;">
          Architectural Review Committee
        </div>
        <div style="text-align: left; font-size: 12px;">
          Chairperson
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 11px; color: #666;">
        <p><strong>Generated by HOA Connect</strong> - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        <p>This form was automatically generated from the digital request submission.</p>
      </div>
    </div>
  `;
};
