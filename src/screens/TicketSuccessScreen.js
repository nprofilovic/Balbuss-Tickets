import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../styles/colors';

const { width } = Dimensions.get('window');

const TicketSuccessScreen = ({ route, navigation }) => {
  const { orderId, orderKey, bookingData } = route.params;
  const [loading, setLoading] = useState(false);
  const ticketRef = React.useRef();

  // QR Code data - može biti link ka verifikaciji ili JSON sa podacima
  const qrData = JSON.stringify({
    orderId: orderId,
    orderKey: orderKey,
    verificationUrl: `https://balbuss.rs/verify-ticket/${orderId}/${orderKey}`
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-Latn-RS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.substring(0, 5); // HH:MM
  };

  const handleDownloadTicket = async () => {
    try {
      setLoading(true);
      
      // Capture the ticket as image
      const uri = await captureRef(ticketRef, {
        format: 'png',
        quality: 1,
      });

      // Share or save
      if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri);
      } else {
        const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permission.granted) {
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await FileSystem.StorageAccessFramework.createFileAsync(
            permission.directoryUri,
            `karta-${orderId}.png`,
            'image/png'
          )
            .then(async (uri) => {
              await FileSystem.writeAsStringAsync(uri, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              Alert.alert('Uspeh', 'Karta je sačuvana!');
            });
        }
      }
    } catch (error) {
      console.error('Error downloading ticket:', error);
      Alert.alert('Greška', 'Nije moguće sačuvati kartu');
    } finally {
      setLoading(false);
    }
  };

  const handleShareTicket = async () => {
    try {
      await Share.share({
        message: `Moja bus karta - Narudžbina #${orderId}\n\n` +
          `${bookingData.bus.from} → ${bookingData.bus.to}\n` +
          `Datum: ${formatDate(bookingData.searchData.departureDate)}\n` +
          `Polazak: ${formatTime(bookingData.bus.departure)}\n\n` +
          `Verifikuj kartu: https://balbuss.rs/verify-ticket/${orderId}/${orderKey}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#D32F2F']}
        style={styles.header}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color={colors.textWhite} />
        </View>
        <Text style={styles.successTitle}>Uspešno!</Text>
        <Text style={styles.successSubtitle}>Vaša karta je rezervisana</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Ticket Card */}
        <View 
          ref={ticketRef}
          style={styles.ticketWrapper}
          collapsable={false}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F5F5F5']}
            style={styles.ticket}
          >
            {/* Top Section - Route Info */}
            <View style={styles.ticketHeader}>
              <View style={styles.logoSection}>
                <Ionicons name="bus" size={32} color={colors.primary} />
                <Text style={styles.companyName}>BALBUSS</Text>
              </View>
              <View style={styles.orderIdBadge}>
                <Text style={styles.orderIdText}>#{orderId}</Text>
              </View>
            </View>

            {/* Route Section with Dots */}
            <View style={styles.routeSection}>
              <View style={styles.routeContainer}>
                <View style={styles.cityBlock}>
                  <Text style={styles.cityLabel}>Polazak</Text>
                  <Text style={styles.cityName}>{bookingData.bus.from}</Text>
                  <Text style={styles.timeText}>{formatTime(bookingData.bus.departure)}</Text>
                </View>

                <View style={styles.routeLine}>
                  <View style={styles.dot} />
                  <View style={styles.dottedLine} />
                  <Ionicons name="bus" size={24} color={colors.primary} />
                  <View style={styles.dottedLine} />
                  <View style={styles.dot} />
                </View>

                <View style={styles.cityBlock}>
                  <Text style={styles.cityLabel}>Dolazak</Text>
                  <Text style={styles.cityName}>{bookingData.bus.to}</Text>
                  <Text style={styles.timeText}>{formatTime(bookingData.bus.arrival)}</Text>
                </View>
              </View>

              <View style={styles.dateSection}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.dateText}>
                  {formatDate(bookingData.searchData.departureDate)}
                </Text>
              </View>
            </View>

            {/* Perforated Line */}
            <View style={styles.perforatedLine}>
              <View style={styles.leftCircle} />
              <View style={styles.dashes}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View key={i} style={styles.dash} />
                ))}
              </View>
              <View style={styles.rightCircle} />
            </View>

            {/* Bottom Section - Passenger & QR */}
            <View style={styles.ticketBottom}>
              <View style={styles.passengerSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Putnici:</Text>
                  <Text style={styles.infoValue}>
                    {bookingData.passengers.map(p => p.fullName).join(', ')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Broj karata:</Text>
                  <Text style={styles.infoValue}>{bookingData.ticketCount}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ukupno:</Text>
                  <Text style={styles.priceValue}>{bookingData.totalPrice} RSD</Text>
                </View>

                {bookingData.passengers[0]?.phone && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefon:</Text>
                    <Text style={styles.infoValue}>{bookingData.passengers[0].phone}</Text>
                  </View>
                )}
              </View>

              {/* QR Code Section */}
              <View style={styles.qrSection}>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={qrData}
                    size={120}
                    backgroundColor="white"
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.qrLabel}>Skeniraj kod</Text>
              </View>
            </View>

            {/* Watermark */}
            <Text style={styles.watermark}>BALBUSS.RS</Text>
          </LinearGradient>
        </View>

        {/* Important Info */}
        <View style={styles.importantInfo}>
          <View style={styles.importantHeader}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={styles.importantTitle}>Važne informacije</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoItemText}>
              Budite na stanici 15 minuta pre polaska
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoItemText}>
              Potreban je QR kod ili broj narudžbine prilikom ukrcavanja
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoItemText}>
              Potvrdu ste dobili na email
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleDownloadTicket}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={24} color={colors.primary} />
                <Text style={styles.actionButtonText}>Sačuvaj kartu</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShareTicket}
          >
            <Ionicons name="share-social-outline" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Podeli</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })}
        >
          <Ionicons name="home" size={20} color={colors.textWhite} />
          <Text style={styles.homeButtonText}>Nazad na početnu</Text>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textWhite,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textWhite,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  ticketWrapper: {
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  ticket: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  orderIdBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  routeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cityBlock: {
    flex: 1,
    alignItems: 'center',
  },
  cityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cityName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  dottedLine: {
    width: 20,
    height: 2,
    borderStyle: 'dotted',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}10`,
    padding: 12,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  perforatedLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  leftCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginLeft: -12,
  },
  rightCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    marginRight: -12,
  },
  dashes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  dash: {
    width: 6,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
  },
  ticketBottom: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
  },
  passengerSection: {
    flex: 1,
    paddingRight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContainer: {
    padding: 12,
    backgroundColor: colors.textWhite,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  qrLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  watermark: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.textLight,
    paddingBottom: 12,
    letterSpacing: 2,
  },
  importantInfo: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  importantTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoItemText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  bottomBar: {
    backgroundColor: colors.backgroundCard,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
});

export default TicketSuccessScreen;