export interface RegisterBody {
  email?: string;
  password?: string;
}

export interface LoginBody {
  email?: string;
  password?: string;
}

export interface AuthResponse {
  id: string;
  email: string;
  token: string;
}
