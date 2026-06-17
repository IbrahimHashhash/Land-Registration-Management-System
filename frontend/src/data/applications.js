export const APPLICATIONS = [
  { id: 'LRMIS-2026-0001', type: 'ownership_transfer',  applicantName: 'Nour Ahmad',     applicantType: 'citizen',        parcel: '145 / 12', zone: 'ZONE-RM-01', status: 'pre_checked',        submitted: 'Feb 01, 2026', registrar: 'staff_14' },
  { id: 'LRMIS-2026-0002', type: 'first_registration',  applicantName: 'Khaled Mansour', applicantType: 'lawyer',         parcel: '210 / 04', zone: 'ZONE-RM-02', status: 'legal_review',       submitted: 'Feb 03, 2026', registrar: 'staff_14' },
  { id: 'LRMIS-2026-0003', type: 'parcel_subdivision',  applicantName: 'Lina Haddad',    applicantType: 'citizen',        parcel: '88 / 17',  zone: 'ZONE-RM-01', status: 'survey_required',    submitted: 'Feb 04, 2026', registrar: 'staff_22' },
  { id: 'LRMIS-2026-0004', type: 'boundary_correction', applicantName: 'Tariq Saleh',    applicantType: 'representative', parcel: '301 / 22', zone: 'ZONE-RM-03', status: 'missing_documents',  submitted: 'Feb 05, 2026', registrar: 'staff_22' },
  { id: 'LRMIS-2026-0005', type: 'ownership_transfer',  applicantName: 'Rana Yousef',    applicantType: 'citizen',        parcel: '145 / 12', zone: 'ZONE-RM-01', status: 'under_objection',    submitted: 'Feb 06, 2026', registrar: 'staff_14' },
  { id: 'LRMIS-2026-0006', type: 'certificate_request', applicantName: 'Omar Khalil',    applicantType: 'company',        parcel: '57 / 09',  zone: 'ZONE-RM-02', status: 'approved',           submitted: 'Feb 07, 2026', registrar: 'staff_09' },
  { id: 'LRMIS-2026-0007', type: 'parcel_merge',        applicantName: 'Huda Nasser',    applicantType: 'citizen',        parcel: '12 / 01',  zone: 'ZONE-RM-03', status: 'surveyed',           submitted: 'Feb 08, 2026', registrar: 'staff_22' },
  { id: 'LRMIS-2026-0008', type: 'first_registration',  applicantName: 'Sami Darwish',   applicantType: 'lawyer',         parcel: '420 / 30', zone: 'ZONE-RM-02', status: 'certificate_issued', submitted: 'Feb 09, 2026', registrar: 'staff_09' },
]

export const BREAKDOWN = [
  { key: 'submitted',          count: 9 },
  { key: 'pre_checked',        count: 7 },
  { key: 'survey_required',    count: 5 },
  { key: 'surveyed',           count: 4 },
  { key: 'legal_review',       count: 6 },
  { key: 'approved',           count: 5 },
  { key: 'certificate_issued', count: 8 },
  { key: 'under_objection',    count: 3 },
]
