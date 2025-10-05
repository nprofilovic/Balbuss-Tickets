import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { login, logout, isLoggedIn, getCurrentUser, getAuthToken } from '../services/authService';
import { API_CONFIG } from '../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  
  // User data
  const [userData, setUserData] = useState(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    setIsLoading(true);
    const loggedIn = await isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    
    if (loggedIn) {
      await loadUserProfile();
    }
    
    setIsLoading(false);
  };

  const loadUserProfile = async () => {
    try {
      const user = await getCurrentUser();
      
      if (user) {
        // Dobavi dodatne podatke sa servera
        const token = await getAuthToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/balbuss/v1/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const profileData = await response.json();
          setUserData(profileData);
        } else {
          setUserData(user);
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim()) {
      Alert.alert('Greška', 'Unesite korisničko ime ili email');
      return;
    }

    if (!loginPassword.trim()) {
      Alert.alert('Greška', 'Unesite lozinku');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await login(loginUsername, loginPassword);
      
      if (result.success) {
        Alert.alert('Uspešno', 'Uspešno ste se prijavili!');
        setIsUserLoggedIn(true);
        await loadUserProfile();
        
        // Reset forma
        setLoginUsername('');
        setLoginPassword('');
      } else {
        Alert.alert('Greška', result.message || 'Pogrešno korisničko ime ili lozinka');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Greška', 'Došlo je do greške pri prijavljivanju');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async () => {
    // Validacija
    if (!registerName.trim()) {
      Alert.alert('Greška', 'Unesite ime i prezime');
      return;
    }

    if (!registerEmail.trim()) {
      Alert.alert('Greška', 'Unesite email adresu');
      return;
    }

    if (!validateEmail(registerEmail)) {
      Alert.alert('Greška', 'Unesite validnu email adresu');
      return;
    }

    if (!registerPassword.trim()) {
      Alert.alert('Greška', 'Unesite lozinku');
      return;
    }

    if (registerPassword.length < 6) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      Alert.alert('Greška', 'Lozinke se ne poklapaju');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/balbuss/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          phone: registerPhone,
          password: registerPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        Alert.alert(
          'Uspešno',
          'Nalog je uspešno kreiran! Sada se možete prijaviti.',
          [
            {
              text: 'U redu',
              onPress: () => {
                // Prebaci na login tab
                setActiveTab('login');
                setLoginUsername(registerEmail);
                // Reset register forme
                setRegisterName('');
                setRegisterEmail('');
                setRegisterPhone('');
                setRegisterPassword('');
                setRegisterConfirmPassword('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Greška', result.message || 'Došlo je do greške pri registraciji');
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Greška', 'Došlo je do greške pri registraciji');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Odjava',
      'Da li ste sigurni da želite da se odjavite?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setIsUserLoggedIn(false);
            setUserData(null);
            Alert.alert('Uspešno', 'Uspešno ste se odjavili');
          }
        }
      ]
    );
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </SafeAreaView>
    );
  }

  // Logged in view
  if (isUserLoggedIn && userData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person-circle" size={80} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{userData.name || userData.displayName}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            
            {/* User role badge */}
            {userData.roles && userData.roles.length > 0 && (
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {userData.roles.includes('administrator') ? 'Administrator' :
                   userData.roles.includes('shop_manager') ? 'Shop Manager' :
                   userData.roles.includes('agent') ? 'Agent' : 'Korisnik'}
                </Text>
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informacije o nalogu</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{userData.email}</Text>
              </View>
            </View>

            {userData.phone && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Telefon</Text>
                  <Text style={styles.infoValue}>{userData.phone}</Text>
                </View>
              </View>
            )}

            {userData.registered_date && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Član od</Text>
                  <Text style={styles.infoValue}>
                    {new Date(userData.registered_date).toLocaleDateString('sr-Latn-RS')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="receipt-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>Moje rezervacije</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={24} color={colors.error} />
              <Text style={[styles.actionButtonText, { color: colors.error }]}>Odjavi se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Not logged in view - Login/Register tabs
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'login' && styles.tabActive]}
            onPress={() => setActiveTab('login')}
          >
            <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>
              Prijava
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'register' && styles.tabActive]}
            onPress={() => setActiveTab('register')}
          >
            <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>
              Registracija
            </Text>
          </TouchableOpacity>
        </View>

        {/* Login Form */}
        {activeTab === 'login' && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Prijavite se na svoj nalog</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Korisničko ime ili email"
                value={loginUsername}
                onChangeText={setLoginUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Lozinka"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={handleLogin}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Text style={styles.submitButtonText}>Prijavi se</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Kreirajte novi nalog</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ime i prezime"
                value={registerName}
                onChangeText={setRegisterName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Telefon (opciono)"
                value={registerPhone}
                onChangeText={setRegisterPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Lozinka"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Potvrdite lozinku"
                value={registerConfirmPassword}
                onChangeText={setRegisterConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.textWhite} />
              ) : (
                <Text style={styles.submitButtonText}>Registruj se</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    backgroundColor: colors.backgroundCard,
    padding: 30,
    paddingTop: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    padding: 4,
    marginTop: 0,
    marginHorizontal: 16,
    marginBottom: 0,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textWhite,
  },
  formContainer: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
    marginTop: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default ProfileScreen;