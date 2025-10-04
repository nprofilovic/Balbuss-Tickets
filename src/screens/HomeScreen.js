import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  StatusBar, 
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../styles/colors';
import { 
  getPopularRoutes, 
  searchBuses, 
  getCities,
  getAvailableDestinations,
  getAvailableOrigins,
  getAvailableDates,
  isDateAvailable
} from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [popularRoutes, setPopularRoutes] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Search form state
  const [fromCity, setFromCity] = useState(null);
  const [toCity, setToCity] = useState(null);
  const [departureDate, setDepartureDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState(1);
  
  // Available dates data for selected route
  const [availableDatesData, setAvailableDatesData] = useState({
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    blockedDates: [],
    dateRanges: []
  });
  
  // Modal states
  const [fromModalVisible, setFromModalVisible] = useState(false);
  const [toModalVisible, setToModalVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  
  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  
  // Temp date for picker
  const [tempDate, setTempDate] = useState(new Date());

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load available dates when both cities are selected
  useEffect(() => {
    if (fromCity && toCity) {
      loadAvailableDates();
    }
  }, [fromCity, toCity]);

  const loadInitialData = async () => {
    await Promise.all([
      loadAllCities(),
      loadPopularRoutes()
    ]);
  };

  const loadAllCities = async () => {
    try {
      setLoadingCities(true);
      console.log('Loading all cities from API...');
      const response = await getCities();
      
      if (response.success && Array.isArray(response.data)) {
        setAllCities(response.data);
        setAvailableCities(response.data); // Initially all cities are available
        console.log('Cities loaded:', response.data.length, 'cities');
      } else {
        console.log('Failed to load cities, using fallback');
        const fallbackCities = [
          { id: 1, name: 'Beograd', code: 'BG' },
          { id: 2, name: 'Novi Sad', code: 'NS' },
          { id: 3, name: 'Niš', code: 'NI' },
          { id: 4, name: 'Istanbul', code: 'IST' },
          { id: 5, name: 'Novi Pazar', code: 'NP' }
        ];
        setAllCities(fallbackCities);
        setAvailableCities(fallbackCities);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadAvailableDates = async () => {
    if (!fromCity || !toCity) {
      console.log('Cannot load dates - missing cities:', { fromCity: fromCity?.name, toCity: toCity?.name });
      return;
    }
    
    try {
      console.log('Loading available dates for route:', fromCity.name, '→', toCity.name);
      const response = await getAvailableDates(fromCity.name, toCity.name);
      
      if (response.success) {
        setAvailableDatesData(response.data);
        console.log('Available dates loaded:', response.data);
        
        // Show info about allowed days
        if (response.data.allowedDays.length < 7) {
          const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
          const allowedDayNames = response.data.allowedDays.map(day => dayNames[day]).join(', ');
          console.log('Polasci samo:', allowedDayNames);
        }
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
    }
  };

  const loadPopularRoutes = async () => {
    try {
      console.log('Loading popular routes...');
      const response = await getPopularRoutes();
      
      if (response.success && Array.isArray(response.data)) {
        setPopularRoutes(response.data);
        console.log('Popular routes set:', response.data.length, 'routes');
      }
    } catch (error) {
      console.error('Error loading popular routes:', error);
    }
  };

  const handleSearch = async () => {
    if (!fromCity || !toCity) {
      Alert.alert('Greška', 'Molimo izaberite polazište i odredište');
      return;
    }

    // Check if selected date is available
    if (!isDateAvailable(departureDate, availableDatesData)) {
      const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
      const allowedDayNames = availableDatesData.allowedDays.map(day => dayNames[day]).join(', ');
      Alert.alert(
        'Datum nije dostupan', 
        `Ova linija saobraća samo: ${allowedDayNames}.\n\nMolimo izaberite drugi datum.`
      );
      return;
    }

    setLoading(true);
    
    try {
      const searchData = {
        from: fromCity.name,
        to: toCity.name,
        departureDate: departureDate,
        passengers: passengers
      };
      
      console.log('Searching with data:', searchData);
      
      const response = await searchBuses(searchData);
      
      console.log('Search response received:', response);
      
      if (response.success) {
        navigation.navigate('SearchResults', { 
          searchData,
          results: response.data 
        });
      } else {
        Alert.alert('Greška', response.error || 'Problem sa pretraživanjem');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Greška', 'Problem sa pretraživanjem. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoute = async (from, to) => {
    setLoading(true);
    
    try {
      const searchData = {
        from: from,
        to: to,
        departureDate: new Date().toISOString().split('T')[0],
        passengers: 1
      };
      
      const response = await searchBuses(searchData);
      
      if (response.success) {
        navigation.navigate('SearchResults', { 
          searchData,
          results: response.data 
        });
      } else {
        Alert.alert('Greška', response.error);
      }
    } catch (error) {
      Alert.alert('Greška', 'Problem sa pretraživanjem rute. Pokušajte ponovo.');
    } finally {
      setLoading(false);
    }
  };

  const selectFromCity = async (city) => {
    console.log('Selected FROM city:', city.name);
    setFromCity(city);
    setFromModalVisible(false);
    setSearchQuery('');
    
    // Load available destinations for this origin
    try {
      const response = await getAvailableDestinations(city.name);
      console.log('Available destinations response:', response);
      
      if (response.success && response.data.length > 0) {
        setAvailableCities(response.data);
        console.log('Available destinations from', city.name, ':', response.data.length);
      } else {
        console.log('No destinations found, keeping all cities');
        setAvailableCities(allCities);
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      setAvailableCities(allCities);
    }
    
    // If toCity is already selected, load available dates
    if (toCity) {
      await loadAvailableDates();
    }
  };

  const selectToCity = async (city) => {
    setToCity(city);
    setToModalVisible(false);
    setSearchQuery('');
    
    // If fromCity is selected, load available dates
    if (fromCity) {
      await loadAvailableDates();
    }
  };

  const swapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
    
    // Reload available cities and dates
    if (toCity) {
      getAvailableDestinations(toCity.name).then(response => {
        if (response.success) {
          setAvailableCities(response.data);
        }
      });
    }
  };

  const openFromModal = () => {
    // Reset search query
    setSearchQuery('');
    // Show all cities when selecting from
    setAvailableCities(allCities);
    setFromModalVisible(true);
  };

  const openToModal = async () => {
    console.log('Opening TO modal, fromCity:', fromCity?.name);
    
    // Filter cities based on selected fromCity
    if (fromCity) {
      try {
        setLoadingCities(true);
        const response = await getAvailableDestinations(fromCity.name);
        console.log('Destinations for', fromCity.name, ':', response);
        
        if (response.success && response.data.length > 0) {
          setAvailableCities(response.data);
          console.log('Setting available cities:', response.data.length);
          setToModalVisible(true);
        } else {
          console.log('No destinations available');
          Alert.alert('Info', `Nema dostupnih odredišta za ${fromCity.name}`);
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
        Alert.alert('Greška', 'Problem sa učitavanjem odredišta');
      } finally {
        setLoadingCities(false);
      }
    } else {
      // No fromCity selected, show all cities
      setAvailableCities(allCities);
      setToModalVisible(true);
    }
  };

  const openDatePicker = () => {
    if (!fromCity || !toCity) {
      Alert.alert('Info', 'Prvo izaberite polazište i odredište');
      return;
    }
    setTempDate(new Date(departureDate));
    setDateModalVisible(true);
  };

  const confirmDate = () => {
    // Check if date is available
    if (!isDateAvailable(tempDate.toISOString().split('T')[0], availableDatesData)) {
      const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
      const allowedDayNames = availableDatesData.allowedDays.map(day => dayNames[day]).join(', ');
      Alert.alert(
        'Datum nije dostupan', 
        `Ova linija saobraća samo: ${allowedDayNames}`
      );
      return;
    }
    
    setDepartureDate(tempDate.toISOString().split('T')[0]);
    setDateModalVisible(false);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setDateModalVisible(false);
      if (selectedDate) {
        const dateStr = selectedDate.toISOString().split('T')[0];
        if (isDateAvailable(dateStr, availableDatesData)) {
          setDepartureDate(dateStr);
        } else {
          const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
          const allowedDayNames = availableDatesData.allowedDays.map(day => dayNames[day]).join(', ');
          Alert.alert(
            'Datum nije dostupan', 
            `Ova linija saobraća samo: ${allowedDayNames}`
          );
        }
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('sr-Latn-RS', options);
  };

  const getFilteredCities = (excludeCity = null) => {
    console.log('getFilteredCities called:', {
      availableCitiesCount: availableCities.length,
      availableCities: availableCities.map(c => `${c.name} (ID: ${c.id})`),
      excludeCity: excludeCity ? `${excludeCity.name} (ID: ${excludeCity.id})` : 'none',
      searchQuery
    });
    
    let filtered = availableCities;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(city =>
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('After search filter:', filtered.map(c => c.name));
    }
    
    // Exclude selected city by NAME instead of ID
    if (excludeCity) {
      const beforeExclude = filtered.length;
      filtered = filtered.filter(city => 
        city.name.toLowerCase() !== excludeCity.name.toLowerCase()
      );
      console.log(`After exclude filter: ${beforeExclude} -> ${filtered.length}`, filtered.map(c => c.name));
    }
    
    console.log('Final filtered cities:', filtered.map(c => c.name));
    return filtered;
  };

  const renderCityModal = (visible, onClose, onSelect, excludeCity = null, isFrom = true) => {
    const filteredCities = getFilteredCities(excludeCity);
    
    console.log('Rendering city modal:', { 
      visible, 
      isFrom, 
      filteredCitiesCount: filteredCities.length,
      availableCitiesCount: availableCities.length,
      loadingCities 
    });
    
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isFrom ? 'Izaberite polazište' : 'Izaberite odredište'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {!isFrom && fromCity && (
              <View style={styles.routeInfo}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.routeInfoText}>
                  Dostupna odredišta od {fromCity.name}
                </Text>
              </View>
            )}
            
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pretražite grad..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={false}
                keyboardType="default"
              />
            </View>

            <ScrollView style={styles.cityList}>
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.cityItem}
                    onPress={() => onSelect(city)}
                  >
                    <Ionicons name="location" size={20} color={colors.primary} />
                    <Text style={styles.cityName}>{city.name}</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="alert-circle" size={48} color={colors.textLight} />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Grad nije pronađen' : 'Nema dostupnih gradova'}
                  </Text>
                  {!isFrom && fromCity && !searchQuery && (
                    <Text style={styles.emptySubtext}>
                      Nema linija od {fromCity.name} ka drugim gradovima
                    </Text>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDatePickerModal = () => {
    if (Platform.OS === 'android') {
      return null;
    }

    // Get day name helper
    const getDayName = (date) => {
      const dayNames = ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'];
      return dayNames[date.getDay()];
    };

    const isCurrentDateAvailable = isDateAvailable(
      tempDate.toISOString().split('T')[0], 
      availableDatesData
    );

    return (
      <Modal
        visible={dateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dateModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Text style={styles.cancelButton}>Otkaži</Text>
              </TouchableOpacity>
              <View style={styles.datePickerHeaderCenter}>
                <Text style={styles.modalTitle}>Izaberite datum</Text>
                <Text style={[
                  styles.dateAvailability,
                  isCurrentDateAvailable ? styles.dateAvailable : styles.dateUnavailable
                ]}>
                  {getDayName(tempDate)} - {isCurrentDateAvailable ? 'Dostupno' : 'Nije dostupno'}
                </Text>
              </View>
              <TouchableOpacity onPress={confirmDate} disabled={!isCurrentDateAvailable}>
                <Text style={[
                  styles.confirmButton,
                  !isCurrentDateAvailable && styles.confirmButtonDisabled
                ]}>
                  Potvrdi
                </Text>
              </TouchableOpacity>
            </View>
            
            {availableDatesData.allowedDays.length < 7 && (
              <View style={styles.dateInfoBanner}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.dateInfoText}>
                  Polasci: {availableDatesData.allowedDays.map(day => 
                    ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'][day]
                  ).join(', ')}
                </Text>
              </View>
            )}
            
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="inline"
              onChange={onDateChange}
              minimumDate={new Date()}
              style={styles.datePicker}
              locale="sr-Latn-RS"
              textColor={colors.textPrimary}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <View style={styles.iosNotchOverlay} />
      )}
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Menu', 'Menu funkcionalnost')}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BalBuss</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Gde želite da putujete?</Text>
          <Text style={styles.welcomeSubtitle}>Pronađite najbolje cene za vaš put</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchForm}>
            <View style={styles.searchInputs}>
              {/* From City */}
              <TouchableOpacity 
                style={styles.searchInputField}
                onPress={openFromModal}
              >
                <Ionicons name="radio-button-on" size={20} color={colors.primary} />
                <Text style={[styles.inputText, fromCity && styles.inputTextSelected]}>
                  {fromCity ? fromCity.name : 'Odakle'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {/* To City */}
              <TouchableOpacity 
                style={styles.searchInputField}
                onPress={openToModal}
              >
                <Ionicons name="location" size={20} color="#DC3545" />
                <Text style={[styles.inputText, toCity && styles.inputTextSelected]}>
                  {toCity ? toCity.name : 'Kuda'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              
              {/* Date Picker */}
              <TouchableOpacity 
                style={styles.searchInputField}
                onPress={openDatePicker}
              >
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <View style={styles.dateInputContent}>
                  <Text style={styles.inputTextSelected}>
                    {formatDisplayDate(departureDate)}
                  </Text>
                  {fromCity && toCity && availableDatesData.allowedDays.length < 7 && (
                    <Text style={styles.dateHint}>
                      Samo: {availableDatesData.allowedDays.map(day => 
                        ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'][day]
                      ).join(', ')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
              onPress={handleSearch}
              disabled={loading}
            >
              <View style={styles.searchButtonContent}>
                {loading ? (
                  <Text style={styles.searchButtonText}>Pretraživanje...</Text>
                ) : (
                  <>
                    <Ionicons name="search" size={20} color="#FFFFFF" />
                    <Text style={styles.searchButtonText}>Pretraži autobuske linije</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Popular Routes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popularne rute</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularRoutes && popularRoutes.length > 0 ? (
              popularRoutes.map((route, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.routeCard}
                  onPress={() => handleQuickRoute(route.from, route.to)}
                  disabled={loading}
                >
                  <View style={styles.routeHeader}>
                    <Text style={styles.routeText}>{route.from} → {route.to}</Text>
                    <Ionicons name="bus" size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.routePrice}>{route.price} RSD</Text>
                  <Text style={styles.routeDuration}>{route.duration}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyRoutesContainer}>
                <Text style={styles.emptyRoutesText}>Učitavanje ruta...</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zašto BalBuss?</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
              <Text style={styles.featureTitle}>Sigurno</Text>
              <Text style={styles.featureDescription}>100% sigurno plaćanje</Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="time" size={24} color={colors.primary} />
              <Text style={styles.featureTitle}>Brzo</Text>
              <Text style={styles.featureDescription}>Rezervacija za 2 minuta</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* City Selection Modals */}
      {renderCityModal(fromModalVisible, () => {
        setFromModalVisible(false);
        setSearchQuery('');
      }, selectFromCity, toCity, true)}
      
      {renderCityModal(toModalVisible, () => {
        setToModalVisible(false);
        setSearchQuery('');
      }, selectToCity, fromCity, false)}
      
      {/* Date Picker Modal (iOS) or Native (Android) */}
      {Platform.OS === 'ios' ? (
        renderDatePickerModal()
      ) : (
        dateModalVisible && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  iosNotchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? (StatusBar.currentHeight || 50) : 0,
    backgroundColor: colors.primary,
    zIndex: 1000,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textWhite,
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 50,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textWhite,
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  searchContainer: {
    marginHorizontal: 20,
    marginTop: -30,
    marginBottom: 40,
  },
  searchForm: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchInputs: {
    marginBottom: 20,
    position: 'relative',
  },
  searchInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  inputText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.textLight,
    flex: 1,
  },
  inputTextSelected: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dateInputContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateHint: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  swapButton: {
    position: 'absolute',
    right: 10,
    top: 55,
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  searchButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 15,
  },
  routeCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
    width: 180,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  routePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  routeDuration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyRoutesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRoutesText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
  },
  routeInfoText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundGray,
    margin: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cityList: {
    paddingHorizontal: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityName: {
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: 15,
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  // Date Picker Modal styles (iOS)
  dateModalContent: {
    backgroundColor: colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 0,
  },
  datePickerHeaderCenter: {
    alignItems: 'center',
  },
  dateAvailability: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  dateAvailable: {
    color: colors.success || '#28a745',
  },
  dateUnavailable: {
    color: colors.error,
  },
  dateInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}15`,
    padding: 12,
    marginHorizontal: 0,
    marginTop: 10,
    borderRadius: 8,
  },
  dateInfoText: {
    fontSize: 13,
    color: colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  datePicker: {
    height: 350,
    marginVertical: 20,
    marginHorizontal: 0,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '600',
  },
  confirmButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  confirmButtonDisabled: {
    opacity: 0.4,
  },
});

export default HomeScreen;