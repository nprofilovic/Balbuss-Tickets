import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import Button from '../common/Button';
import Input from '../common/Input';

const SearchForm = ({ searchData, setSearchData, onSearch }) => {
  const handleSwapLocations = () => {
    setSearchData(prev => ({
      ...prev,
      from: prev.to,
      to: prev.from
    }));
  };

  const handlePassengerChange = (increment) => {
    setSearchData(prev => ({
      ...prev,
      passengers: Math.max(1, Math.min(9, prev.passengers + increment))
    }));
  };

  const toggleReturnTrip = () => {
    setSearchData(prev => ({
      ...prev,
      isReturn: !prev.isReturn,
      returnDate: !prev.isReturn ? prev.returnDate : ''
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-Latn-RS');
  };

  return (
    <View style={styles.container}>
      {/* Location Selection */}
      <View style={styles.locationContainer}>
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => Alert.alert('Info', 'Location picker će biti implementiran sledeće')}
        >
          <Ionicons name="radio-button-on" size={20} color={colors.primary} />
          <Text style={[styles.locationText, !searchData.from && styles.placeholderText]}>
            {searchData.from || 'Odakle'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.swapButton} onPress={handleSwapLocations}>
          <Ionicons name="swap-vertical" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => Alert.alert('Info', 'Location picker će biti implementiran sledeće')}
        >
          <Ionicons name="location" size={20} color={colors.error} />
          <Text style={[styles.locationText, !searchData.to && styles.placeholderText]}>
            {searchData.to || 'Kuda'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date Selection */}
      <View style={styles.dateContainer}>
        <TouchableOpacity
          style={[styles.dateInput, { flex: searchData.isReturn ? 1 : 2 }]}
          onPress={() => Alert.alert('Info', 'Date picker će biti implementiran sledeće')}
        >
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>Polazak</Text>
            <Text style={[styles.dateText, !searchData.departureDate && styles.placeholderText]}>
              {searchData.departureDate ? 
                formatDate(searchData.departureDate) : 
                'Izaberite datum'
              }
            </Text>
          </View>
        </TouchableOpacity>

        {searchData.isReturn && (
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => Alert.alert('Info', 'Return date picker će biti implementiran sledeće')}
          >
            <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateLabel}>Povratak</Text>
              <Text style={[styles.dateText, !searchData.returnDate && styles.placeholderText]}>
                {searchData.returnDate ? 
                  formatDate(searchData.returnDate) : 
                  'Izaberite datum'
                }
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Return Trip Toggle */}
      <TouchableOpacity style={styles.returnToggle} onPress={toggleReturnTrip}>
        <Ionicons 
          name={searchData.isReturn ? "checkbox" : "square-outline"} 
          size={20} 
          color={colors.primary} 
        />
        <Text style={styles.returnText}>Povratna karta</Text>
      </TouchableOpacity>

      {/* Passengers Selection */}
      <View style={styles.passengersContainer}>
        <View style={styles.passengersLeft}>
          <Ionicons name="person" size={20} color={colors.primary} />
          <Text style={styles.passengersLabel}>Putnici</Text>
        </View>
        
        <View style={styles.passengersRight}>
          <TouchableOpacity
            style={styles.passengerButton}
            onPress={() => handlePassengerChange(-1)}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={styles.passengersCount}>{searchData.passengers}</Text>
          
          <TouchableOpacity
            style={styles.passengerButton}
            onPress={() => handlePassengerChange(1)}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Button */}
      <Button
        title="Pretraži autobuske linije"
        onPress={onSearch}
        style={styles.searchButton}
        icon="search"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  locationText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: colors.textLight,
  },
  swapButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 15,
  },
  dateTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  returnToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  returnText: {
    marginLeft: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passengersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  passengersLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengersLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  passengersRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passengerButton: {
    backgroundColor: `${colors.primary}15`,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passengersCount: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    minWidth: 20,
    textAlign: 'center',
  },
  searchButton: {
    marginTop: 5,
  },
});

export default SearchForm;