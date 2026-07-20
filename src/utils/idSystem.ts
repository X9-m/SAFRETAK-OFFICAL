/**
 * ID System Generator
 * Custom user/role ID formatting based on Jordanian platform specs.
 * 
 * 1. Traveler / General User: USR-XXXXXXXXXXX (11 uppercase alphanumeric characters)
 * 2. Travel Office: OFC-{"office_name"}_{"office_city"}
 * 3. Admin: ADMN-{"admin_fname_fletter"}_ADMIN_{1-9}\{3} (where {1-9}\{3} are 3 digits, each from 1 to 9)
 */

export function generateTravelerId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 11; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `USR-${result}`;
}

export function generateOfficeId(officeName: string, officeCity: string): string {
  // Trim, clean out Arabic and special characters, and replace spaces with underscores.
  const cleanOffice = officeName.trim()
    .split('/')[0] // extract English name if it has slash bilingual names (e.g., Dallas / دالاس)
    .replace(/&/g, 'and')
    .replace(/[^a-zA-Z0-9_\s-]/g, '') // strip special symbols and Arabic characters
    .trim()
    .replace(/\s+/g, '_');
  const cleanCity = officeCity.trim().replace(/\s+/g, '_');
  return `OFC-${cleanOffice}_${cleanCity}`;
}

export function generateAdminId(adminFirstName: string): string {
  const fLetter = adminFirstName ? adminFirstName.trim().charAt(0).toUpperCase() : 'A';
  // Generate three non-zero digits (1-9)
  const d1 = Math.floor(Math.random() * 9) + 1;
  const d2 = Math.floor(Math.random() * 9) + 1;
  const d3 = Math.floor(Math.random() * 9) + 1;
  return `ADMN-${fLetter}_ADMIN_${d1}${d2}${d3}`;
}
