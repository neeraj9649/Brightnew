import { api } from './api';

// Public retrieval base for uploaded files. The php_uploader service is
// deployed at the root of this subdomain, so a file_id is fetched at
// `${RESOURCE_BASE}/file.php?id=<uuid>` (no auth; served with its real
// Content-Type, so it works in <img>, <a> or a new tab).
const RESOURCE_BASE = (
  process.env.REACT_APP_RESOURCE_URL || 'https://resources.brightwingstravel.com'
).replace(/\/$/, '');

export const fileUrl = (fileId) =>
  fileId ? `${RESOURCE_BASE}/file.php?id=${encodeURIComponent(fileId)}` : '';

// Returns `{ file_id, url }` -- file_id is what the CRM quotation endpoint
// needs to link an upload to a booking; url is for displaying/downloading it.
async function uploadFile(path, file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.upload(path, formData);
}

export const uploadProfileImage = (file) =>
  uploadFile('/uploads/profile-image', file);

export const uploadBookingDocument = (file) =>
  uploadFile('/uploads/booking-document', file);

export const uploadVisaDocument = (file) =>
  uploadFile('/uploads/visa-document', file);

export const IMAGE_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
export const IMAGE_UPLOAD_ACCEPT = [...IMAGE_UPLOAD_TYPES, '.webp'].join(',');

// Validate file type and size
export const validateFile = (
  file,
  maxSize = 5 * 1024 * 1024,
  allowedTypes = [...IMAGE_UPLOAD_TYPES, 'application/pdf']
) => {
  if (file.size > maxSize) {
    throw new Error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
  }
  return true;
};
