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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/constants';
import { getAuthToken, isLoggedIn } from '../services/authService';

const BookingScreen = ({ route, navigation }) => {
  const { orderId, orderKey, bookingData } = route.params || {};
  
  // Billing fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  
  useEffect(() => {
    checkLoginAndLoadData();
  }, []);

  const checkLoginAndLoadData = async () => {
    const loggedIn = await isLoggedIn();
    setIsUserLoggedIn(loggedIn);
    
    if (loggedIn) {
      await loadUserData();
    } else {
      setUserRoles(['customer']);
      setIsLoadingRole(false);
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoadingRole(true);
      
      // Učitaj token
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        console.log('No auth token found');
        setUserRoles(['customer']);
        setIsLoadingRole(false);
        return;
      }

      // Pozovi API da dobiješ user profile i role
      const response = await fetch(`${API_CONFIG.BASE_URL}/balbuss/v1/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('User profile response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('User data:', userData);
        
        // Popuni polja sa user podacima
        if (userData.name) {
          const nameParts = userData.name.split(' ');
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
        }
        setEmail(userData.email || '');
        setPhone(userData.phone || '');
        setCity(userData.city || '');
        
        // Postavi user roles
        setUserRoles(userData.roles || ['customer']);
        console.log('User roles:', userData.roles);
      } else {
        console.log('Failed to fetch user profile');
        setUserRoles(['customer']);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserRoles(['customer']);
    } finally {
      setIsLoadingRole(false);
    }
  };

  // Proveri da li korisnik ima privilegije za CoD
  const hasCoDerivileges = () => {
    const privilegedRoles = ['administrator', 'shop_manager', 'agent', 'wbtm_agent'];
    console.log('=== COD PRIVILEGE CHECK ===');
    console.log('Is User Logged In:', isUserLoggedIn);
    console.log('User Roles:', userRoles);
    
    // Ako korisnik NIJE ulogovan, NEMA CoD privilegije
    if (!isUserLoggedIn) {
      console.log('User not logged in - CoD disabled');
      return false;
    }
    
    const hasPrivilege = userRoles.some(role => 
      privilegedRoles.includes(role.toLowerCase())
    );
    
    console.log('Has CoD privilege:', hasPrivilege);
    return hasPrivilege;
  };

  const availablePaymentMethods = [
    { 
      id: 'card', 
      name: 'Platna kartica', 
      icon: 'card-outline',
      description: 'Platite karticom odmah',
      enabled: true
    },
    { 
      id: 'cod', 
      name: 'Plaćanje pouzećem', 
      icon: 'cash-outline',
      description: 'Platite kada preuzmete kartu',
      enabled: hasCoDerivileges()
    }
  ];

  const validateForm = () => {
    if (!firstName.trim()) {
      Alert.alert('Greška', 'Unesite ime');
      return false;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Greška', 'Unesite prezime');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Greška', 'Unesite email adresu');
      return false;
    }

    if (!validateEmail(email)) {
      Alert.alert('Greška', 'Unesite validnu email adresu');
      return false;
    }

    if (!phone.trim()) {
      Alert.alert('Greška', 'Unesite broj telefona');
      return false;
    }

    if (!city.trim()) {
      Alert.alert('Greška', 'Unesite grad');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // PRVO: Kreiraj order sa svim podacima
      const orderData = {
        bus_id: bookingData.bus.id,
        journey_date: bookingData.searchData.departureDate,
        boarding_point: bookingData.searchData.from,
        boarding_time: `${bookingData.searchData.departureDate} ${bookingData.bus.departure || '00:00'}`,
        dropping_point: bookingData.searchData.to,
        dropping_time: `${bookingData.searchData.departureDate} ${bookingData.bus.arrival || '23:59'}`,
        passenger_info: bookingData.passengers.map((p, index) => ({
          passenger_number: index + 1,
          full_name: p.fullName,
          phone: p.phone,
          email: p.email || email,
          passport: p.passport || '',
          description: p.description || ''
        })),
        ticket_count: bookingData.ticketCount,
        total_price: bookingData.totalPrice,
        return_date: bookingData.returnDate ? bookingData.returnDate.toISOString().split('T')[0] : null,
        // Billing information
        billing_first_name: firstName,
        billing_last_name: lastName,
        billing_email: email,
        billing_phone: phone,
        billing_city: city,
        payment_method: paymentMethod
      };

      console.log('Creating order with data:', orderData);

      const response = await fetch(`${API_CONFIG.BASE_URL}/balbuss/v1/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();
      console.log('Order created:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Greška pri kreiranju narudžbine');
      }

      // SADA imamo order ID
      const createdOrderId = result.order_id;
      const createdOrderKey = result.order_key;

      if (paymentMethod === 'cod') {
        await processCoD(createdOrderId);
      } else {
        await processCardPayment(createdOrderId, createdOrderKey);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Greška', error.message || 'Došlo je do greške pri plaćanju');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateOrderBilling = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const billingData = {
        order_id: orderId,
        billing: {
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          city: city,
          country: 'RS'
        },
        payment_method: paymentMethod
      };

      console.log('Updating order billing:', billingData);

      const response = await fetch(`${API_CONFIG.BASE_URL}/balbuss/v1/bookings/update-billing`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billingData)
      });

      const result = await response.json();
      console.log('Billing update result:', result);

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update billing');
      }
    } catch (error) {
      console.error('Update billing error:', error);
      // Nastavi dalje čak i ako ažuriranje ne uspe
    }
  };

  const processCoD = async () => {
    Alert.alert(
      'Uspešno!',
      'Vaša rezervacija je potvrđena. Platićete pouzećem.',
      [
        {
          text: 'U redu',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' }],
            });
          }
        }
      ]
    );
  };

  const processCardPayment = async () => {
    const paymentUrl = `https://balbuss.rs/checkout/order-pay/${orderId}/?pay_for_order=true&key=${orderKey}`;
    
    navigation.navigate('Payment', {
      checkoutUrl: paymentUrl,
      orderId: orderId,
      email: email
    });
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  if (isLoadingRole) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Učitavanje...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Pregled rezervacije</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Polazak:</Text>
              <Text style={styles.summaryValue}>{bookingData?.bus?.from}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Destinacija:</Text>
              <Text style={styles.summaryValue}>{bookingData?.bus?.to}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Broj karata:</Text>
              <Text style={styles.summaryValue}>{bookingData?.ticketCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Putnici:</Text>
              <Text style={styles.summaryValue}>
                {bookingData?.passengers?.map(p => p.fullName).join(', ')}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Ukupno:</Text>
              <Text style={styles.totalValue}>{bookingData?.totalPrice} RSD</Text>
            </View>
          </View>
        </View>

        {/* Billing Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Podaci za naplatu</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Ime *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vaše ime"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Prezime *</Text>
              <TextInput
                style={styles.input}
                placeholder="Vaše prezime"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.formFieldFull}>
            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="vasa.email@primer.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formRow}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Mobilni telefon *</Text>
              <TextInput
                style={styles.input}
                placeholder="+381 60 123 4567"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Grad *</Text>
              <TextInput
                style={styles.input}
                placeholder="Beograd"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Text style={styles.helperText}>
            Potvrdu rezervacije ćete dobiti na email adresu
          </Text>
        </View>

        {/* Payment Method Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Način plaćanja</Text>
          </View>

          {availablePaymentMethods.map((method) => (
            method.enabled && (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === method.id && styles.paymentOptionSelected
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.paymentOptionLeft}>
                  <View style={[
                    styles.radio,
                    paymentMethod === method.id && styles.radioSelected
                  ]}>
                    {paymentMethod === method.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  
                  <Ionicons 
                    name={method.icon} 
                    size={24} 
                    color={paymentMethod === method.id ? colors.primary : colors.textSecondary}
                    style={styles.paymentIcon}
                  />
                  
                  <View>
                    <Text style={[
                      styles.paymentName,
                      paymentMethod === method.id && styles.paymentNameSelected
                    ]}>
                      {method.name}
                    </Text>
                    <Text style={styles.paymentDescription}>
                      {method.description}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          ))}

          {!hasCoDerivileges() && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Plaćanje karticom - sigurno i brzo
              </Text>
            </View>
          )}
          
          {hasCoDerivileges() && (
            <View style={[styles.infoBox, { backgroundColor: `${colors.success}10` }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
              <Text style={[styles.infoText, { color: colors.success }]}>
                Dostupne vam su obe opcije plaćanja
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Ukupno</Text>
          <Text style={styles.bottomPriceValue}>{bookingData?.totalPrice} RSD</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color={colors.textWhite} />
              <Text style={styles.payButtonText}>Obrada...</Text>
            </>
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {paymentMethod === 'cod' ? 'Potvrdi rezervaciju' : 'Nastavi na plaćanje'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  section: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  paymentOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  paymentNameSelected: {
    color: colors.primary,
  },
  paymentDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  payButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default BookingScreen;