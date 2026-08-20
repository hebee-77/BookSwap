export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  roles?: string[];
}

export interface LoginResponse {
  token: string;
}
