import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { searchBuses } from '../services/api';

const SearchResultsScreen = ({ route, navigation }) => {
  const { searchData } = route.params || {};
  
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBuses();
  }, []);

  const loadBuses = async () => {
    if (!searchData) {
      setError('Nema podataka o pretrazi');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      console.log('Loading buses for search:', searchData);
      
      const response = await searchBuses(searchData);
      console.log('Search response:', response);
      
      if (response.success) {
        setBuses(response.data || []);
      } else {
        setError(response.error || 'Greška pri pretraživanju');
      }
    } catch (err) {
      console.error('Error loading buses:', err);
      setError('Greška pri učitavanju linija');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBuses();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('sr-RS', options);
  };

  const handleBusSelect = (bus) => {
    console.log('Selected bus:', bus);
    navigation.navigate('TicketDetails', { bus, searchData });
  };

  const renderBusCard = (bus) => (
    <TouchableOpacity 
      key={bus.id} 
      style={styles.busCard}
      onPress={() => handleBusSelect(bus)}
    >
      {/* Company Header */}
      <View style={styles.busHeader}>
        <View style={styles.companyInfo}>
          <Ionicons name="bus" size={20} color={colors.primary} />
          <Text style={styles.companyName} numberOfLines={2}>
            {bus.name || bus.company || 'BalBuss'}
          </Text>
        </View>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFA500" />
          <Text style={styles.rating}>{bus.rating || '4.7'}</Text>
        </View>
      </View>

      {/* Route details if name doesn't contain route info */}
      {bus.name && !bus.name.includes('→') && (
        <Text style={styles.routeName} numberOfLines={1}>{bus.from} → {bus.to}</Text>
      )}

      {/* Time and Duration */}
      <View style={styles.timeContainer}>
        <View style={styles.timeItem}>
          <Text style={styles.time}>{bus.departure}</Text>
          <Text style={styles.timeLabel}>{bus.from}</Text>
        </View>
        
        <View style={styles.durationContainer}>
          <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
          <Text style={styles.duration}>{bus.duration}</Text>
        </View>
        
        <View style={styles.timeItem}>
          <Text style={styles.time}>{bus.arrival}</Text>
          <Text style={styles.timeLabel}>{bus.to}</Text>
        </View>
      </View>

      {/* Amenities */}
      {bus.amenities && bus.amenities.length > 0 && (
        <View style={styles.amenitiesContainer}>
          {bus.amenities.slice(0, 4).map((amenity, index) => (
            <View key={index} style={styles.amenityBadge}>
              <Ionicons name={getAmenityIcon(amenity)} size={12} color={colors.textSecondary} />
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
          {bus.amenities.length > 4 && (
            <Text style={styles.moreAmenities}>+{bus.amenities.length - 4}</Text>
          )}
        </View>
      )}

      {/* Footer with Price and Seats */}
      <View style={styles.busFooter}>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{bus.price} RSD</Text>
          <View style={styles.seatsInfo}>
            <Ionicons name="people" size={14} color={colors.textSecondary} />
            <Text style={styles.seatsAvailable}>
              {bus.availableSeats}/{bus.totalSeats} slobodno
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => handleBusSelect(bus)}
        >
          <Text style={styles.selectButtonText}>Izaberi sedište</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textWhite} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const getAmenityIcon = (amenity) => {
    const icons = {
      'WiFi': 'wifi',
      'AC': 'snow',
      'USB': 'flash',
      'Toilet': 'home',
      'Snacks': 'cafe',
      'Entertainment': 'tv'
    };
    return icons[amenity] || 'checkmark-circle';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Učitavanje linija...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadBuses}>
          <Text style={styles.retryButtonText}>Pokušaj ponovo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Summary */}
      <View style={styles.searchSummary}>
        <View style={styles.routeInfo}>
          <Text style={styles.searchSummaryText}>
            {searchData?.from || 'N/A'} → {searchData?.to || 'N/A'}
          </Text>
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
        </View>
        <View style={styles.searchMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={styles.searchDate}>
              {searchData?.departureDate ? formatDate(searchData.departureDate) : 'N/A'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <Text style={styles.searchDate}>
              {searchData?.passengers || 1} {searchData?.passengers === 1 ? 'putnik' : 'putnika'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {buses.length} {buses.length === 1 ? 'linija pronađena' : 'linija pronađeno'}
          </Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={16} color={colors.primary} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Bus Cards */}
        {buses.length > 0 ? (
          buses.map(renderBusCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus" size={64} color={colors.textLight} />
            <Text style={styles.emptyTitle}>Nema dostupnih linija</Text>
            <Text style={styles.emptyText}>
              Pokušajte sa drugim datumom ili rutom
            </Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Nazad na pretragu</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Banner */}
        {buses.length > 0 && (
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={styles.infoText}>
              Cene su prikazane po putniku. Kliknite na liniju za izbor sedišta.
            </Text>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchSummary: {
    backgroundColor: colors.backgroundCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  searchSummaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  searchMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  busCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.primary}10`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  routeName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  timeItem: {
    alignItems: 'center',
    flex: 1,
  },
  time: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  durationContainer: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  amenityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  moreAmenities: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  busFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  seatsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seatsAvailable: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selectButtonText: {
    color: colors.textWhite,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${colors.primary}10`,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default SearchResultsScreen;