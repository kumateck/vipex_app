export type AuthUser = {
  sub: string;
  email: string;
  userType?: number | null;
  fullname?: string | null;
  branchId?: string | null;
  companyId?: string | null;
  branch?: {
    id: string;
    name: string;
    type?: number | null;
    telephone?: string | null;
    phone?: string | null;
    address?: string | null;
    location?: string | null;
  } | null;
  branchType?: number | null;
  location?: { id: string; name: string } | null;
  company?: { id: string; name: string } | null;
  role?: { id?: string; name?: string } | null;
  permissions?: string[];
};

export type LoginResponse = {
  user: AuthUser;
  tokens?: { accessToken: string; refreshToken: string };
  accessToken?: string;
  refreshToken?: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type SessionState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};
