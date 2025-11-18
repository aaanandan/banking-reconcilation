export class AuthResponseDto {
  token: string; // Access token (kept for backward compatibility)
  accessToken?: string; // Access token (new field)
  refreshToken?: string; // Refresh token
  expiresIn?: number; // Token expiry in seconds
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    companyName: string;
  };
}
