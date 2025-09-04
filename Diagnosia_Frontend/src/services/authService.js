// Mock authentication service for demonstration
const mockUsers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210',
    password: 'password123' // In real app, this would be hashed
  }
];

export const authService = {
  async login(email, password) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }
    
    const token = `mock-token-${user.id}-${Date.now()}`;
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token
    };
  },

  async register(userData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const newUser = {
      id: mockUsers.length + 1,
      ...userData,
      password: userData.password // In real app, this would be hashed
    };
    
    mockUsers.push(newUser);
    
    const token = `mock-token-${newUser.id}-${Date.now()}`;
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      user: userWithoutPassword,
      token
    };
  },

  async getCurrentUser() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const token = this.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    // Extract user ID from mock token
    const userId = parseInt(token.split('-')[2]);
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async refreshToken() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentUser = await this.getCurrentUser();
    const newToken = `mock-token-${currentUser.id}-${Date.now()}`;
    
    return {
      token: newToken,
      user: currentUser
    };
  },

  logout() {
    localStorage.removeItem('token');
  },

  getToken() {
    return localStorage.getItem('token');
  },

  isAuthenticated() {
    const token = this.getToken();
    return !!token;
  },
};