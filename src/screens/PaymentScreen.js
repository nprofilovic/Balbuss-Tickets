import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { getOrderStatus } from '../services/woocommerceService';

const PaymentScreen = ({ route, navigation }) => {
  const { checkoutUrl, orderId, bookingData } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(checkoutUrl);
  const [orderStatus, setOrderStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    // Proveri da li imamo potrebne podatke
    if (!checkoutUrl) {
      Alert.alert('Greška', 'Checkout URL nije dostupan', [
        { text: 'Nazad', onPress: () => navigation.goBack() }
      ]);
    }
  }, []);

  // Funkcija za proveru statusa porudžbine
  const checkOrderStatus = async () => {
    if (!orderId) return;

    setCheckingStatus(true);
    try {
      const response = await getOrderStatus(orderId);
      
      if (response.success) {
        setOrderStatus(response.data.status);
        
        // Ako je plaćanje uspešno
        if (response.data.status === 'completed' || response.data.status === 'processing') {
          Alert.alert(
            'Uspešno!',
            'Plaćanje je uspešno izvršeno. Vaša karta je rezervisana.',
            [
              {
                text: 'Završi',
                onPress: () => navigation.navigate('Home')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error checking order status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Praćenje URL promena u WebView
  const handleNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
    setLoading(navState.loading);

    // Proveri da li je korisnik završio checkout
    if (navState.url.includes('order-received') || navState.url.includes('thank-you')) {
      checkOrderStatus();
    }

    // Ako korisnik otkaže plaćanje
    if (navState.url.includes('checkout/') && navState.url.includes('cancel')) {
      Alert.alert(
        'Plaćanje otkazano',
        'Da li želite da se vratite nazad?',
        [
          { text: 'Ostani ovde', style: 'cancel' },
          { text: 'Nazad', onPress: () => navigation.goBack() }
        ]
      );
    }
  };

  // Obrada greške u WebView
  const handleWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    
    Alert.alert(
      'Greška pri učitavanju',
      'Došlo je do greške pri učitavanju stranice. Proverite internet konekciju.',
      [
        { text: 'Pokušaj ponovo', onPress: () => setCurrentUrl(checkoutUrl) },
        { text: 'Otkaži', onPress: () => navigation.goBack(), style: 'cancel' }
      ]
    );
  };

  const renderBookingSummary = () => {
    if (!bookingData) return null;

    const { bus, ticketCount, totalPrice } = bookingData;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Ionicons name="bus" size={20} color={colors.primary} />
          <Text style={styles.summaryText}>
            {bus.from} → {bus.to}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="ticket" size={20} color={colors.primary} />
          <Text style={styles.summaryText}>
            {ticketCount} {ticketCount === 1 ? 'karta' : 'karte'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="cash" size={20} color={colors.primary} />
          <Text style={styles.summaryPrice}>
            {totalPrice.toFixed(2)} RSD
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Napusti plaćanje?',
              'Da li ste sigurni da želite da napustite proces plaćanja?',
              [
                { text: 'Ostani', style: 'cancel' },
                { text: 'Napusti', onPress: () => navigation.goBack(), style: 'destructive' }
              ]
            );
          }}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plaćanje</Text>
        <TouchableOpacity 
          onPress={checkOrderStatus}
          disabled={checkingStatus || !orderId}
          style={styles.refreshButton}
        >
          {checkingStatus ? (
            <ActivityIndicator size="small" color={colors.textWhite} />
          ) : (
            <Ionicons name="refresh" size={24} color={colors.textWhite} />
          )}
        </TouchableOpacity>
      </View>

      {/* Booking Summary (opciono) */}
      {renderBookingSummary()}

      {/* WebView za WooCommerce Checkout */}
      {checkoutUrl ? (
        <WebView
          source={{ uri: currentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onError={handleWebViewError}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Učitavanje...</Text>
            </View>
          )}
          // Omogući JavaScript
          javaScriptEnabled={true}
          // Omogući DOM storage
          domStorageEnabled={true}
          // Omogući third-party cookies za plaćanja
          thirdPartyCookiesEnabled={true}
          // Dozvoli pop-up prozore za 3D Secure
          setSupportMultipleWindows={false}
          // User agent za bolje kompatibilnost
          userAgent={Platform.OS === 'ios' 
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
            : 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
          }
          // Security settings
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // Bounce effect (samo iOS)
          bounces={false}
        />
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Greška</Text>
          <Text style={styles.errorText}>
            Checkout URL nije dostupan. Molimo pokušajte ponovo.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Nazad</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status indikator */}
      {orderStatus && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusText}>
            Status: {orderStatus}
          </Text>
        </View>
      )}
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
    paddingVertical: 15,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 4,
    width: 36,
    alignItems: 'center',
  },
  summaryContainer: {
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginLeft: 12,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  statusBanner: {
    backgroundColor: colors.success || '#28a745',
    padding: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textWhite,
    textTransform: 'capitalize',
  },
});

export default PaymentScreen;