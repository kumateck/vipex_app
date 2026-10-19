export interface CurrentUserProfileResponse {
  id: string;
  fullname: string;
  email: string;
  telephone: string;
  employeeId: string | null;
  role: { id: string; name: string } | null;
  branch: { id: string; name: string; type: number } | null;
  company: { id: string; name: string; useAccounting: boolean } | null;
  location: { id: string; name: string } | null;
  locationId: string | null;
  locationName: string | null;
  userType: number | null;
  cashierType: number | null;
}
