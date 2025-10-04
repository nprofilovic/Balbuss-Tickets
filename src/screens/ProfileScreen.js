import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './../styles/colors';
import { API_CONFIG } from './../utils/constants';

const ProfileScreen = ({ navigation }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLogin, setShowLogin] = useState(true);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (userToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        loadBookingHistory(parsedUser.id);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingHistory = async (userId) => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}balbuss/v1/bookings/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('userToken')}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookingHistory(data);
      }
    } catch (error) {
      console.error('Error loading booking history:', error);
    }
  };

  const handleLogin = async () => {
  if (!loginEmail || !loginPassword) {
    Alert.alert('Greška', 'Molimo unesite email i lozinku');
    return;
  }

  setLoginLoading(true);

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/jwt-auth/v1/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.token) {
      // JWT vraća user_email, user_nicename, user_display_name
      // Napravite user objekat ručno
      const userData = {
        email: data.user_email,
        name: data.user_display_name || data.user_nicename,
        nicename: data.user_nicename,
      };

      // Sačuvajte token i user data
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setUser(userData);
      setIsLoggedIn(true);
      
      // Sad učitajte profile da dobijete ID i ostale podatke
      const profileResponse = await fetch(
        `${API_CONFIG.BASE_URL}/balbuss/v1/users/profile`,
        {
          headers: {
            'Authorization': `Bearer ${data.token}`,
          },
        }
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        // Ažurirajte sa kompletnim podacima
        await AsyncStorage.setItem('userData', JSON.stringify(profileData));
        setUser(profileData);
        loadBookingHistory(profileData.id);
      }
      
      Alert.alert('Uspešno', 'Uspešno ste se prijavili!');
    } else {
      Alert.alert('Greška', data.message || 'Neispravni podaci za prijavu');
    }
  } catch (error) {
    Alert.alert('Greška', 'Došlo je do greške pri prijavljivanju');
    console.error('Login error:', error);
  } finally {
    setLoginLoading(false);
  }
};

  const handleRegister = async () => {
    // Validation
    if (!registerName || !registerEmail || !registerPhone || !registerPassword) {
      Alert.alert('Greška', 'Molimo popunite sva polja');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      Alert.alert('Greška', 'Lozinke se ne poklapaju');
      return;
    }

    if (registerPassword.length < 6) {
      Alert.alert('Greška', 'Lozinka mora imati najmanje 6 karaktera');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      Alert.alert('Greška', 'Unesite validnu email adresu');
      return;
    }

    setRegisterLoading(true);

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/wp-json/balbuss/v1/users/register`,
        {
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
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Uspešno',
          'Nalog je uspešno kreiran! Možete se sada prijaviti.',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowLogin(true);
                setLoginEmail(registerEmail);
              },
            },
          ]
        );
        
        // Clear registration form
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPhone('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
      } else {
        Alert.alert('Greška', data.message || 'Greška pri registraciji');
      }
    } catch (error) {
      Alert.alert('Greška', 'Došlo je do greške pri registraciji');
      console.error('Register error:', error);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Odjava',
      'Da li ste sigurni da želite da se odjavite?',
      [
        { text: 'Otkaži', style: 'cancel' },
        {
          text: 'Odjavi se',
          style: 'destructive',
          onPress: async () => {
            try {
              const userToken = await AsyncStorage.getItem('userToken');
              
              // Pozovi logout API da obriše server-side session
              if (userToken) {
                await fetch(
                  `${API_CONFIG.BASE_URL}/balbuss/v1/auth/logout`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${userToken}`,
                    },
                  }
                ).catch(err => console.log('Logout API error:', err));
              }
            } catch (error) {
              console.log('Logout error:', error);
            } finally {
              // Uvek obriši lokalne podatke
              await AsyncStorage.removeItem('userToken');
              await AsyncStorage.removeItem('userData');
              
              setIsLoggedIn(false);
              setUser(null);
              setBookingHistory([]);
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (user) {
      await loadBookingHistory(user.id);
    }
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };


  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Potvrđeno';
      case 'pending':
        return 'Na čekanju';
      case 'cancelled':
        return 'Otkazano';
      case 'completed':
        return 'Završeno';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  // Auth Screen (Login/Register)
  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {showLogin ? 'Prijavite se' : 'Registrujte se'}
          </Text>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={styles.authContainer}>
          <View style={styles.authCard}>
            {showLogin ? (
              // Login Form
              <>
                <Text style={styles.authTitle}>Dobrodošli nazad!</Text>
                <Text style={styles.authSubtitle}>
                  Prijavite se da vidite svoje karte
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loginLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Lozinka"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry
                    editable={!loginLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.authButton, loginLoading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.authButtonText}>Prijavi se</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setShowLogin(false)}
                  disabled={loginLoading}
                >
                  <Text style={styles.switchButtonText}>
                    Nemate nalog? <Text style={styles.switchButtonTextBold}>Registrujte se</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // Register Form
              <>
                <Text style={styles.authTitle}>Kreirajte nalog</Text>
                <Text style={styles.authSubtitle}>
                  Registrujte se za lakšu kupovinu karata
                </Text>

                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ime i prezime"
                    value={registerName}
                    onChangeText={setRegisterName}
                    editable={!registerLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={registerEmail}
                    onChangeText={setRegisterEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!registerLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Telefon"
                    value={registerPhone}
                    onChangeText={setRegisterPhone}
                    keyboardType="phone-pad"
                    editable={!registerLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Lozinka"
                    value={registerPassword}
                    onChangeText={setRegisterPassword}
                    secureTextEntry
                    editable={!registerLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Potvrdite lozinku"
                    value={registerConfirmPassword}
                    onChangeText={setRegisterConfirmPassword}
                    secureTextEntry
                    editable={!registerLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.authButton, registerLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={registerLoading}
                >
                  {registerLoading ? (
                    <ActivityIndicator color={colors.textWhite} />
                  ) : (
                    <Text style={styles.authButtonText}>Registruj se</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => setShowLogin(true)}
                  disabled={registerLoading}
                >
                  <Text style={styles.switchButtonText}>
                    Već imate nalog? <Text style={styles.switchButtonTextBold}>Prijavite se</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Profile Screen (Logged In)
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.textWhite} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color={colors.textWhite} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Korisnik'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{bookingHistory.length}</Text>
            <Text style={styles.statLabel}>Ukupno karata</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {bookingHistory.filter(b => b.status === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Aktivne karte</Text>
          </View>
        </View>

        {/* Booking History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Istorija kupovina</Text>
          
          {bookingHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>Nemate kupljenih karata</Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.emptyStateButtonText}>Pretražite linije</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookingHistory.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingCard}
                onPress={() => navigation.navigate('TicketDetails', { bookingId: booking.id })}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeText}>
                      {booking.from} → {booking.to}
                    </Text>
                    <Text style={styles.dateText}>{formatDate(booking.date)}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>Polazak: {booking.departure_time}</Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>
                      {booking.seats?.length || 1} putnik(a)
                    </Text>
                  </View>
                  <View style={styles.bookingDetailRow}>
                    <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.bookingDetailText}>{booking.total_price} RSD</Text>
                  </View>
                </View>

                <View style={styles.bookingFooter}>
                  <Text style={styles.orderNumber}>Narudžbina #{booking.order_id}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  logoutButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 60 : 15,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Auth Styles
  authContainer: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  authCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },
  authButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  authButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchButtonTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Profile Styles
  userCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: colors.surface,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textWhite,
  },
  bookingDetails: {
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bookingDetailText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderNumber: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default ProfileScreen;