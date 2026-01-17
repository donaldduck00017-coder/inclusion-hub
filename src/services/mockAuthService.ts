import { config } from '@/lib/config';
import usersData from '@/data/users.json';
import type { User, AuthResponse, LoginCredentials } from '@/types';

interface UserData extends User {
  password: string;
}

const users = usersData as UserData[];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(config.mockDelay);
    
    const user = users.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      token: `mock-token-${user.id}-${Date.now()}`,
      user: userWithoutPassword,
      expiresIn: 3600,
    };
  },
  
  async logout(): Promise<void> {
    await delay(config.mockDelay);
  },
  
  async getCurrentUser(userId: string): Promise<User | null> {
    await delay(config.mockDelay);
    
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  async validateToken(token: string): Promise<boolean> {
    await delay(config.mockDelay);
    return token.startsWith('mock-token-');
  },
  
  async refreshToken(): Promise<{ token: string; expiresIn: number }> {
    await delay(config.mockDelay);
    return {
      token: `mock-token-refresh-${Date.now()}`,
      expiresIn: 3600,
    };
  },
};

export type MockAuthService = typeof mockAuthService;
