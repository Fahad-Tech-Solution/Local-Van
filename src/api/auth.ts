import { apiClient } from './client'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: 'customer' | 'driver' | 'admin'
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },
  
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },
  
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
  
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  updateProfile: async (data: { name?: string; phone?: string; address?: string }): Promise<{ message: string; user: any }> => {
    const response = await apiClient.put('/auth/profile', data)
    return response.data
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/change-password', data)
    return response.data
  },
}

