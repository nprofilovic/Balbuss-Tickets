import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/constants';
import { getAuthToken, isLoggedIn } from '../services/authService';
import { useFocusEffect } from '@react-navigation/native';

// Ticket Status konstante
const TICKET_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

const HistoryScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  // Proveri login status svaki put kada se fokusira na ovaj screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('HistoryScreen focused - checking login status');
      checkLoginAndLoadBookings();
    }, [])
  );

  useEffect(() => {
    checkLoginAndLoadBookings();
  }, []);

  const checkLoginAndLoadBookings = async () => {
    try {
      console.log('Checking login status...');
      setLoading(true);
      
      const loggedIn = await isLoggedIn();
      console.log('Is logged in:', loggedIn);
      setIsUserLoggedIn(loggedIn);

      if (loggedIn) {
        const token = await getAuthToken();
        console.log('Token exists:', !!token);
        
        if (token) {
          // Prvo preuzmi user profile da dobiješ user_id
          await fetchUserProfile(token);
        } else {
          setLoading(false);
        }
      } else {
        console.log('User not logged in - showing login prompt');
        setLoading(false);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error checking login:', error);
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      console.log('Fetching user profile...');
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/balbuss/v1/users/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Profile response status:', response.status);

      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        const user_id = userData.id || userData.user_id;
        
        if (user_id) {
          setUserId(user_id);
          // Sada preuzmi rezervacije
          await fetchBookings(user_id, token);
        } else {
          console.error('No user_id in response');
          setLoading(false);
          setIsUserLoggedIn(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch user profile:', response.status, errorData);
        setLoading(false);
        setIsUserLoggedIn(false);
        // Obriši nevažeći token
        await AsyncStorage.removeItem('authToken');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
      setIsUserLoggedIn(false);
      // Obriši nevažeći token
      await AsyncStorage.removeItem('authToken');
    }
  };

  const fetchBookings = async (user_id, token) => {
    try {
      setLoading(true);
      console.log('Fetching bookings for user:', user_id);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/balbuss/v1/bookings/user/${user_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Bookings response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('Bookings data received:', result);

        // Transformiši podatke sa API-ja u format koji komponenta očekuje
        const transformedBookings = transformApiData(result.data || result.bookings || result || []);
        console.log('Transformed bookings:', transformedBookings.length);
        setBookings(transformedBookings);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch bookings:', response.status, errorData);
        
        // Ako je 404 ili prazan rezultat, nije greška - samo nema rezervacija
        if (response.status === 404 || response.status === 204) {
          setBookings([]);
        } else {
          Alert.alert('Greška', 'Nije moguće učitati istoriju putovanja');
        }
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Greška', 'Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  // Transformiši API podatke u format koji komponenta koristi
  const transformApiData = (apiBookings) => {
    if (!Array.isArray(apiBookings)) return [];

    return apiBookings.map(booking => {
      // Mapiranje statusa - PROCESSING i COMPLETED su potvrđene karte
      let status = TICKET_STATUS.PENDING;
      const apiStatus = (booking.order_status || booking.status || '').toLowerCase();
      
      console.log('Booking status:', apiStatus);
      
      if (apiStatus === 'completed' || apiStatus === 'wc-completed') {
        status = TICKET_STATUS.COMPLETED;
      } else if (apiStatus === 'cancelled' || apiStatus === 'wc-cancelled') {
        status = TICKET_STATUS.CANCELLED;
      } else if (apiStatus === 'processing' || apiStatus === 'wc-processing' || apiStatus === 'confirmed') {
        status = TICKET_STATUS.CONFIRMED; // PROCESSING = POTVRĐENO
      } else if (apiStatus === 'pending' || apiStatus === 'wc-pending' || apiStatus === 'on-hold' || apiStatus === 'wc-on-hold') {
        status = TICKET_STATUS.PENDING;
      }

      return {
        id: booking.order_id || booking.id,
        status: status,
        from: booking.boarding_point || booking.bus_start || booking.from || 'N/A',
        to: booking.dropping_point || booking.bus_end || booking.to || 'N/A',
        departureDate: booking.journey_date || booking.departure_date || booking.date,
        departureTime: booking.boarding_time || booking.journey_time || booking.departure_time || 'N/A',
        arrivalTime: booking.dropping_time || booking.arrival_time || 'N/A',
        duration: booking.duration || 'N/A',
        busCompany: 'BalBuss',
        passengers: booking.passengers?.length || booking.ticket_count || 1,
        totalPrice: parseFloat(booking.total_price || booking.price || 0),
        seatNumbers: booking.seats || [],
        bookingDate: booking.order_date || booking.created_at,
        ticketType: booking.return_date ? 'return' : 'oneWay',
        returnDate: booking.return_date || null,
        paymentMethod: booking.payment_method || 'card',
        cancelledDate: booking.cancelled_date || null,
      };
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    
    if (isUserLoggedIn && userId) {
      const token = await getAuthToken();
      if (token) {
        await fetchBookings(userId, token);
      }
    }
    
    setRefreshing(false);
  }, [isUserLoggedIn, userId]);

  const getFilteredBookings = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return bookings.filter(
          booking => booking.status === TICKET_STATUS.CONFIRMED &&
          new Date(booking.departureDate) >= now
        );
      case 'completed':
        return bookings.filter(
          booking => booking.status === TICKET_STATUS.COMPLETED ||
          (booking.status === TICKET_STATUS.CONFIRMED && new Date(booking.departureDate) < now)
        );
      case 'cancelled':
        return bookings.filter(booking => booking.status === TICKET_STATUS.CANCELLED);
      default:
        return [];
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case TICKET_STATUS.CONFIRMED:
        return {
          label: 'Potvrđeno',
          color: colors.success,
          icon: 'checkmark-circle',
          bgColor: `${colors.success}15`,
        };
      case TICKET_STATUS.COMPLETED:
        return {
          label: 'Završeno',
          color: colors.textSecondary,
          icon: 'checkmark-done-circle',
          bgColor: colors.backgroundGray,
        };
      case TICKET_STATUS.CANCELLED:
        return {
          label: 'Otkazano',
          color: colors.error,
          icon: 'close-circle',
          bgColor: `${colors.error}15`,
        };
      case TICKET_STATUS.PENDING:
        return {
          label: 'Na čekanju',
          color: colors.warning,
          icon: 'time',
          bgColor: `${colors.warning}15`,
        };
      default:
        return {
          label: 'Nepoznato',
          color: colors.textLight,
          icon: 'help-circle',
          bgColor: colors.backgroundGray,
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleCancelBooking = async (bookingId) => {
    Alert.alert(
      'Otkaži rezervaciju',
      'Da li ste sigurni da želite da otkažete ovu rezervaciju?',
      [
        {
          text: 'Ne',
          style: 'cancel'
        },
        {
          text: 'Da',
          style: 'destructive',
          onPress: async () => {
            // Implementiraj logiku za otkazivanje
            Alert.alert('Info', 'Funkcionalnost otkazivanja će biti dostupna uskoro');
          }
        }
      ]
    );
  };

  const handleViewDetails = (booking) => {
    // Navigiraj na stranicu sa detaljima
    Alert.alert('Detalji rezervacije', `Rezervacija ID: ${booking.id}`);
  };

  const renderBookingCard = (booking) => {
    const statusConfig = getStatusConfig(booking.status);

    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        activeOpacity={0.7}
        onPress={() => handleViewDetails(booking)}
      >
        {/* Header sa statusom */}
        <View style={styles.cardHeader}>
          <View style={styles.bookingIdSection}>
            <Text style={styles.bookingId}>#{booking.id}</Text>
            <Text style={styles.bookingDate}>
              Rezervisano: {formatDate(booking.bookingDate)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Ruta putovanja */}
        <View style={styles.routeSection}>
          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <View style={styles.routeInfo}>
              <Text style={styles.cityName}>{booking.from}</Text>
              <Text style={styles.timeText}>{booking.departureTime}</Text>
            </View>
          </View>

          <View style={styles.routeLine}>
            <View style={styles.dashedLine} />
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{booking.duration}</Text>
            </View>
          </View>

          <View style={styles.routePoint}>
            <View style={styles.routeDot} />
            <View style={styles.routeInfo}>
              <Text style={styles.cityName}>{booking.to}</Text>
              <Text style={styles.timeText}>{booking.arrivalTime}</Text>
            </View>
          </View>
        </View>

        {/* Datum putovanja */}
        <View style={styles.travelDateSection}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.travelDateText}>
            Polazak: {formatDate(booking.departureDate)}
          </Text>
          {booking.ticketType === 'return' && booking.returnDate && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.travelDateText}>
                Povratak: {formatDate(booking.returnDate)}
              </Text>
            </>
          )}
        </View>

        {/* Informacije */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="bus" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>{booking.busCompany}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {booking.passengers} {booking.passengers === 1 ? 'putnik' : 'putnika'}
            </Text>
          </View>
          {booking.seatNumbers && booking.seatNumbers.length > 0 && (
            <View style={styles.infoItem}>
              <Ionicons name="ticket" size={18} color={colors.textSecondary} />
              <Text style={styles.infoText}>
                Sedišta: {booking.seatNumbers.join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Cena */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Ukupno plaćeno</Text>
          <Text style={styles.priceValue}>{formatPrice(booking.totalPrice)} RSD</Text>
        </View>

        {/* Akcije */}
        {activeTab === 'upcoming' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleViewDetails(booking)}
            >
              <Ionicons name="document-text" size={18} color={colors.primary} />
              <Text style={styles.actionButtonText}>Detalji</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(booking.id)}
            >
              <Ionicons name="close-circle" size={18} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                Otkaži
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'completed' && (
          <TouchableOpacity style={styles.reviewButton}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <Text style={styles.reviewButtonText}>Oceni putovanje</Text>
          </TouchableOpacity>
        )}

        {booking.status === TICKET_STATUS.CANCELLED && booking.cancelledDate && (
          <View style={styles.cancelInfo}>
            <Ionicons name="information-circle" size={16} color={colors.error} />
            <Text style={styles.cancelInfoText}>
              Otkazano: {formatDate(booking.cancelledDate)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (!isUserLoggedIn) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyStateText}>
            Morate biti prijavljeni da biste videli istoriju putovanja
          </Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.emptyStateButtonText}>Prijavi se</Text>
          </TouchableOpacity>
        </View>
      );
    }

    let message = '';
    let icon = '';

    switch (activeTab) {
      case 'upcoming':
        message = 'Nemate nadolazeća putovanja';
        icon = 'calendar-outline';
        break;
      case 'completed':
        message = 'Nemate završena putovanja';
        icon = 'checkmark-done-circle-outline';
        break;
      case 'cancelled':
        message = 'Nemate otkazana putovanja';
        icon = 'close-circle-outline';
        break;
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name={icon} size={64} color={colors.textLight} />
        <Text style={styles.emptyStateText}>{message}</Text>
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyStateButtonText}>Pretraži linije</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Istorija putovanja</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Učitavanje...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Istorija putovanja</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Nadolazeća
          </Text>
          {bookings.filter(b => b.status === TICKET_STATUS.CONFIRMED && 
            new Date(b.departureDate) >= new Date()).length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {bookings.filter(b => b.status === TICKET_STATUS.CONFIRMED && 
                  new Date(b.departureDate) >= new Date()).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Završena
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Otkazana
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {filteredBookings.length > 0 ? (
          filteredBookings.map(renderBookingCard)
        ) : (
          renderEmptyState()
        )}
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundCard,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.backgroundGray,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textWhite,
  },
  badge: {
    backgroundColor: colors.textWhite,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bookingIdSection: {
    flex: 1,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeSection: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  routeInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    paddingVertical: 8,
  },
  dashedLine: {
    width: 2,
    height: 32,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    borderStyle: 'dashed',
    marginRight: 12,
  },
  durationBadge: {
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  travelDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  travelDateText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  separator: {
    fontSize: 13,
    color: colors.textSecondary,
    marginHorizontal: 4,
  },
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  cancelButton: {
    borderColor: colors.error,
  },
  cancelButtonText: {
    color: colors.error,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: `${colors.warning}15`,
    marginTop: 8,
    gap: 6,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning,
  },
  cancelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.error}10`,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  cancelInfoText: {
    fontSize: 13,
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textWhite,
  },
});

export default HistoryScreen;