export const FORM_STEPS = [
  { num: '1', label: 'App Type' },
  { num: '2', label: 'Applicant' },
  { num: '3', label: 'Parcel' },
  { num: '4', label: 'Documents' },
]

export const APP_TYPES = [
  { key: 'first_registration',  label: 'First Registration',  desc: 'Register a new land parcel for the first time.' },
  { key: 'ownership_transfer',  label: 'Ownership Transfer',  desc: 'Transfer ownership of an existing parcel.' },
  { key: 'parcel_subdivision',  label: 'Parcel Subdivision',  desc: 'Split an existing parcel into smaller plots.' },
  { key: 'parcel_merge',        label: 'Parcel Merge',        desc: 'Combine adjacent parcels into one.' },
  { key: 'boundary_correction', label: 'Boundary Correction', desc: 'Adjust boundaries of an existing parcel.' },
  { key: 'certificate_request', label: 'Certificate Request', desc: 'Request an official ownership certificate.' },
]

export const DOC_TYPES = [
  { value: 'sale_contract',              label: 'Sale Contract' },
  { value: 'ownership_deed',             label: 'Ownership Deed' },
  { value: 'id_copy',                    label: 'National ID Copy' },
  { value: 'power_of_attorney',          label: 'Power of Attorney' },
  { value: 'survey_report',              label: 'Survey Report' },
  { value: 'other',                      label: 'Other' },
]

export const ZONES = ['ZONE-RM-01', 'ZONE-RM-02', 'ZONE-RM-03']

export const LAND_USES = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use']

export const APPLICANT_TYPE_LABELS = {
  citizen:                   'Citizen',
  lawyer:                    'Lawyer',
  company:                   'Company',
  surveyor:                  'Surveyor',
  authorized_representative: 'Representative',
}
