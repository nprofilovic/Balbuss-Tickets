import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const BusDetailsScreen = ({ route, navigation }) => {
  const { bus, searchData } = route.params;
  const [selectedBoardingPoint, setSelectedBoardingPoint] = useState(bus.boardingPoints?.[0] || null);
  const [selectedDroppingPoint, setSelectedDroppingPoint] = useState(bus.droppingPoints?.[0] || null);
  const [passengers, setPassengers] = useState(searchData?.passengers || 1);

  // Find price based on selected boarding and dropping points
  const getPrice = () => {
    if (!selectedBoardingPoint || !selectedDroppingPoint || !bus.allPrices) {
      return bus.price;
    }

    const priceOption = bus.allPrices.find(
      p => p.boardingPoint === selectedBoardingPoint.name && 
           p.droppingPoint === selectedDroppingPoint.name
    );

    return priceOption?.adultPrice || bus.price;
  };

  const currentPrice = getPrice();
  const totalPrice = currentPrice * passengers;

  const handleContinue = () => {
    Alert.alert(
      'Nastavi sa rezervacijom',
      'Prelazak na unos podataka putnika će biti implementiran uskoro',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalji linije</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Bus Info Card */}
        <View style={styles.busCard}>
          <View style={styles.busHeader}>
            <View style={styles.companyInfo}>
              <Ionicons name="bus" size={24} color={colors.primary} />
              <View>
                <Text style={styles.companyName}>{bus.company}</Text>
                <Text style={styles.routeName}>{bus.route}</Text>
              </View>
            </View>
            {bus.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFA500" />
                <Text style={styles.rating}>{bus.rating}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalji rute</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.cityContainer}>
                <Text style={styles.cityName}>{bus.from}</Text>
                <Text style={styles.time}>{bus.departure}</Text>
              </View>
              <View style={styles.routeMiddle}>
                <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                <Text style={styles.duration}>{bus.duration}</Text>
              </View>
              <View style={styles.cityContainer}>
                <Text style={styles.cityName}>{bus.to}</Text>
                <Text style={styles.time}>{bus.arrival}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Boarding Points */}
        {bus.boardingPoints && bus.boardingPoints.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mesto polaska</Text>
            {bus.boardingPoints.map((point, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pointCard,
                  selectedBoardingPoint?.name === point.name && styles.pointCardSelected
                ]}
                onPress={() => setSelectedBoardingPoint(point)}
              >
                <View style={styles.pointInfo}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  <Text style={styles.pointTime}>{point.time}</Text>
                </View>
                {selectedBoardingPoint?.name === point.name && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Passenger Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Broj putnika</Text>
          <View style={styles.passengerControl}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => passengers > 1 && setPassengers(passengers - 1)}
              disabled={passengers <= 1}
            >
              <Ionicons name="remove" size={24} color={passengers <= 1 ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
            <Text style={styles.passengerCount}>{passengers}</Text>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={() => passengers < bus.availableSeats && setPassengers(passengers + 1)}
              disabled={passengers >= bus.availableSeats}
            >
              <Ionicons name="add" size={24} color={passengers >= bus.availableSeats ? colors.textSecondary : colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Cena po kartici:</Text>
            <Text style={styles.priceValue}>{currentPrice} RSD</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Broj putnika:</Text>
            <Text style={styles.priceValue}>× {passengers}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Ukupno:</Text>
            <Text style={styles.totalValue}>{totalPrice} RSD</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceContainer}>
          <Text style={styles.bottomPriceLabel}>Ukupno</Text>
          <Text style={styles.bottomPrice}>{totalPrice} RSD</Text>
        </View>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Nastavi</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.textWhite} />
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
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  busCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  routeName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityContainer: {
    alignItems: 'center',
    flex: 1,
  },
  cityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  time: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  routeMiddle: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pointCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pointCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  pointTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  passengerControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  passengerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengerCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginHorizontal: 32,
    minWidth: 40,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: colors.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomPriceContainer: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bottomPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  continueButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BusDetailsScreen;