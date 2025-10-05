// services/authService.js

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORDPRESS_URL } from '../utils/constants';

/**
 * Login korisnika i čuvanje tokena
 */
export const login = async (username, password) => {
  try {
    console.log('Attempting login for:', username);
    
    const response = await fetch(`${WORDPRESS_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    });

    const result = await response.json();
    console.log('Login response:', result);

    if (response.ok && result.token) {
      // Sačuvaj token i user podatke
      await AsyncStorage.setItem('authToken', result.token);
      await AsyncStorage.setItem('userEmail', result.user_email);
      await AsyncStorage.setItem('userDisplayName', result.user_display_name);
      
      return {
        success: true,
        token: result.token,
        user: {
          email: result.user_email,
          displayName: result.user_display_name,
          niceName: result.user_nicename
        }
      };
    } else {
      return {
        success: false,
        message: result.message || 'Pogrešno korisničko ime ili lozinka'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Greška pri povezivanju sa serverom'
    };
  }
};

/**
 * Logout korisnika
 */
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userEmail');
    await AsyncStorage.removeItem('userDisplayName');
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
};

/**
 * Proveri da li je korisnik ulogovan
 */
export const isLoggedIn = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Dobavi auth token
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    return null;
  }
};

/**
 * Dobavi trenutnog korisnika
 */
export const getCurrentUser = async () => {
  try {
    const email = await AsyncStorage.getItem('userEmail');
    const displayName = await AsyncStorage.getItem('userDisplayName');
    
    if (email && displayName) {
      return {
        email,
        displayName
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Validiraj token sa serverom
 */
export const validateToken = async () => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return { valid: false };
    }

    const response = await fetch(`${WORDPRESS_URL}/wp-json/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    return {
      valid: response.ok && result.code === 'jwt_auth_valid_token',
      data: result
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false };
  }
};