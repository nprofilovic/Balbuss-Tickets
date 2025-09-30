import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  Linking,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/colors';
import { addToCart } from '../services/woocommerceService';

const TicketDetailsScreen = ({ route, navigation }) => {
  const { bus, searchData } = route.params || {};
  
  const [ticketCount, setTicketCount] = useState(1);
  const [returnDate, setReturnDate] = useState(null);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [tempReturnDate, setTempReturnDate] = useState(new Date());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [passengers, setPassengers] = useState([
    {
      fullName: '',
      phone: '',
      passport: '',
      description: '',
    }
  ]);

  const isInternationalRoute = bus.to.toLowerCase().includes('istanbul') || 
                               bus.from.toLowerCase().includes('istanbul');

  const handleTicketCountChange = (increment) => {
    const newCount = Math.max(1, Math.min(bus.availableSeats, ticketCount + increment));
    setTicketCount(newCount);
    
    const newPassengers = Array(newCount).fill(null).map((_, index) => 
      passengers[index] || {
        fullName: '',
        phone: '',
        passport: '',
        description: '',
      }
    );
    setPassengers(newPassengers);
  };

  const updatePassengerField = (index, field, value) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-Latn-RS', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatReturnDate = (date) => {
    if (!date) return 'Izaberite datum';
    return date.toLocaleDateString('sr-Latn-RS', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const stripHtmlTags = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const getFirstParagraph = (text) => {
    if (!text) return '';
    const cleaned = stripHtmlTags(text);
    const paragraphs = cleaned.split(/\n\n|\r\n\r\n/).filter(p => p.trim());
    return paragraphs[0] || cleaned;
  };

  const getDescriptionText = () => {
    if (!bus.description) return '';
    
    if (isDescriptionExpanded) {
      return stripHtmlTags(bus.description);
    } else {
      return getFirstParagraph(bus.description);
    }
  };

  const handleReturnDateConfirm = () => {
    setReturnDate(tempReturnDate);
    setShowReturnDatePicker(false);
  };

  const onReturnDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowReturnDatePicker(false);
      if (selectedDate) {
        setReturnDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempReturnDate(selectedDate);
      }
    }
  };

  const validateForm = () => {
    if (isInternationalRoute && !returnDate) {
      Alert.alert('Greška', 'Molimo izaberite datum povratka');
      return false;
    }

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      
      if (!passenger.fullName.trim()) {
        Alert.alert('Greška', `Unesite ime i prezime za putnika ${i + 1}`);
        return false;
      }
      
      if (!passenger.phone.trim()) {
        Alert.alert('Greška', `Unesite telefon za putnika ${i + 1}`);
        return false;
      }
      
      // Pasoš više nije obavezan
    }

    return true;
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    const bookingData = {
      bus,
      searchData,
      ticketCount,
      passengers,
      returnDate: isInternationalRoute ? returnDate : null,
      totalPrice: bus.price * ticketCount
    };

    try {
      console.log('Sending booking data:', bookingData);
      
      // Add booking to WooCommerce cart
      const response = await addToCart(bookingData);

      if (response.success && response.data.checkout_url) {
        // Check if we can open the URL
        const canOpen = await Linking.canOpenURL(response.data.checkout_url);
        
        if (canOpen) {
          // Open WooCommerce checkout page in browser
          await Linking.openURL(response.data.checkout_url);
          
          // Show success message
          Alert.alert(
            'Uspeh', 
            'Rezervacija je dodata u korpu. Nastavljamo ka plaćanju...',
            [
              {
                text: 'U redu',
                onPress: () => {
                  // Optionally navigate back or to a confirmation screen
                  // navigation.goBack();
                }
              }
            ]
          );
        } else {
          throw new Error('Ne mogu da otvorim checkout stranicu');
        }
      } else {
        throw new Error(response.message || 'Greška pri kreiranju rezervacije');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Greška',
        error.message || 'Došlo je do greške. Molimo pokušajte ponovo.',
        [{ text: 'U redu' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPrice = bus.price * ticketCount;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Route Summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routeHeader}>
            <Ionicons name="bus" size={24} color={colors.primary} />
            <Text style={styles.routeTitle}>{bus.name}</Text>
          </View>
          
          {bus.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {getDescriptionText()}
              </Text>
              {stripHtmlTags(bus.description).length > getFirstParagraph(bus.description).length && (
                <TouchableOpacity 
                  style={styles.readMoreButton}
                  onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                >
                  <Text style={styles.readMoreText}>
                    {isDescriptionExpanded ? 'Prikaži manje' : 'Pročitaj više'}
                  </Text>
                  <Ionicons 
                    name={isDescriptionExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <View style={styles.routeDetails}>
            <View style={styles.routePoint}>
              <Text style={styles.routeTime}>{bus.departure}</Text>
              <Text style={styles.routeCity}>{bus.from}</Text>
            </View>
            
            <View style={styles.routeArrow}>
              <Ionicons name="arrow-forward" size={20} color={colors.textSecondary} />
              <Text style={styles.routeDuration}>{bus.duration}</Text>
            </View>
            
            <View style={styles.routePoint}>
              <Text style={styles.routeTime}>{bus.arrival}</Text>
              <Text style={styles.routeCity}>{bus.to}</Text>
            </View>
          </View>
          
          <View style={styles.routeDate}>
            <Ionicons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.routeDateText}>
              {formatDate(searchData.departureDate)}
            </Text>
          </View>
        </View>

        {/* Ticket Count Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Broj karata</Text>
          <View style={styles.ticketSelector}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketLabel}>Dostupna sedišta</Text>
              <Text style={styles.ticketAvailable}>{bus.availableSeats}/{bus.totalSeats}</Text>
            </View>
            
            <View style={styles.ticketCounter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handleTicketCountChange(-1)}
                disabled={ticketCount <= 1}
              >
                <Ionicons name="remove" size={20} color={ticketCount <= 1 ? colors.textLight : colors.primary} />
              </TouchableOpacity>
              
              <Text style={styles.counterValue}>{ticketCount}</Text>
              
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => handleTicketCountChange(1)}
                disabled={ticketCount >= bus.availableSeats}
              >
                <Ionicons name="add" size={20} color={ticketCount >= bus.availableSeats ? colors.textLight : colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Cena po sedištu:</Text>
            <Text style={styles.priceValue}>{bus.price} RSD</Text>
          </View>
        </View>

        {/* Return Date Picker (for Istanbul) */}
        {isInternationalRoute && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datum povratka</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                setTempReturnDate(returnDate || new Date(searchData.departureDate));
                setShowReturnDatePicker(true);
              }}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.datePickerText, returnDate && styles.datePickerTextSelected]}>
                {formatReturnDate(returnDate)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <Text style={styles.helperText}>
              * Potrebno je izabrati datum povratka za međunarodne linije
            </Text>
          </View>
        )}

        {/* Passenger Information Forms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informacije putnika</Text>
          
          {passengers.map((passenger, index) => (
            <View key={index} style={styles.passengerForm}>
              <View style={styles.passengerHeader}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <Text style={styles.passengerTitle}>Putnik {index + 1}</Text>
              </View>
              
              <View style={styles.formFieldFull}>
                <Text style={styles.fieldLabel}>Ime i prezime *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Unesite ime i prezime"
                  value={passenger.fullName}
                  onChangeText={(text) => updatePassengerField(index, 'fullName', text)}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Mobilni Telefon *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+381 60 123 4567"
                    value={passenger.phone}
                    onChangeText={(text) => updatePassengerField(index, 'phone', text)}
                    keyboardType="phone-pad"
                  />
                </View>
                
                {isInternationalRoute && (
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Broj Pasoša</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Broj pasoša (opciono)"
                      value={passenger.passport}
                      onChangeText={(text) => updatePassengerField(index, 'passport', text)}
                      autoCapitalize="characters"
                    />
                  </View>
                )}
              </View>
              
              <View style={styles.formFieldFull}>
                <Text style={styles.fieldLabel}>Napomena</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Dodatne napomene (opciono)"
                  value={passenger.description}
                  onChangeText={(text) => updatePassengerField(index, 'description', text)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <View style={styles.priceRow}>
            <Text style={styles.priceRowLabel}>Karte ({ticketCount}x)</Text>
            <Text style={styles.priceRowValue}>{bus.price * ticketCount} RSD</Text>
          </View>
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Ukupno:</Text>
            <Text style={styles.totalValue}>{totalPrice} RSD</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPrice}>
          <Text style={styles.bottomPriceLabel}>Ukupno</Text>
          <Text style={styles.bottomPriceValue}>{totalPrice} RSD</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.proceedButton, isProcessing && styles.proceedButtonDisabled]}
          onPress={handleProceedToPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator size="small" color={colors.textWhite} />
              <Text style={styles.proceedButtonText}>Obrada...</Text>
            </>
          ) : (
            <>
              <Text style={styles.proceedButtonText}>Nastavi</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal for iOS */}
      {Platform.OS === 'ios' && showReturnDatePicker && (
        <Modal
          transparent={true}
          animationType="slide"
          visible={showReturnDatePicker}
          onRequestClose={() => setShowReturnDatePicker(false)}
        >
          <View style={styles.datePickerModal}>
            <TouchableOpacity 
              style={{ flex: 1 }} 
              onPress={() => setShowReturnDatePicker(false)}
            />
            <View style={styles.datePickerModalContent}>
              <View style={styles.datePickerModalHeader}>
                <TouchableOpacity onPress={() => setShowReturnDatePicker(false)}>
                  <Text style={styles.datePickerCancel}>Otkaži</Text>
                </TouchableOpacity>
                <Text style={styles.datePickerModalTitle}>Izaberite datum</Text>
                <TouchableOpacity onPress={handleReturnDateConfirm}>
                  <Text style={styles.datePickerConfirm}>Potvrdi</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempReturnDate}
                mode="date"
                display="spinner"
                onChange={onReturnDateChange}
                minimumDate={new Date(searchData.departureDate)}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {Platform.OS === 'android' && showReturnDatePicker && (
        <DateTimePicker
          value={tempReturnDate}
          mode="date"
          display="default"
          onChange={onReturnDateChange}
          minimumDate={new Date(searchData.departureDate)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  routeSummary: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  descriptionContainer: {
    backgroundColor: colors.backgroundGray,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}20`,
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  routeCity: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  routeArrow: {
    alignItems: 'center',
    flex: 1,
  },
  routeDuration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  routeDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  routeDateText: {
    fontSize: 14,
    color: colors.textSecondary,
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
  ticketSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketInfo: {
    flex: 1,
  },
  ticketLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ticketAvailable: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ticketCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 8,
    padding: 4,
  },
  counterButton: {
    padding: 12,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  datePickerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textLight,
  },
  datePickerTextSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  passengerForm: {
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  passengerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  priceSummary: {
    backgroundColor: colors.backgroundCard,
    padding: 20,
    marginTop: 12,
    marginBottom: 100,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceRowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceRowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
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
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  proceedButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  datePickerModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  datePickerCancel: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  datePickerConfirm: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
    marginVertical: 20,
  },
});

export default TicketDetailsScreen;