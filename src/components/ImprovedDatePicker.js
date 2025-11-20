import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

const { width } = Dimensions.get('window');

const ImprovedDatePicker = ({ 
  visible, 
  onClose, 
  onSelect, 
  selectedDate,
  minDate = new Date(),
  availableDatesData = {
    allowedDays: [0, 1, 2, 3, 4, 5, 6],
    blockedDates: [],
    dateRanges: []
  }
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const dayNames = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];

  // Provera da li je datum dostupan
  const isDateAvailable = (date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    // Proveri da li je pre minimalnog datuma
    const minDateOnly = new Date(minDate);
    minDateOnly.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < minDateOnly) return false;

    // Proveri dozvoljene dane u nedelji
    if (!availableDatesData.allowedDays.includes(dayOfWeek)) {
      return false;
    }

    // Proveri blokirane datume
    if (availableDatesData.blockedDates?.includes(dateString)) {
      return false;
    }

    // Proveri opsege datuma
    if (availableDatesData.dateRanges?.length > 0) {
      const inRange = availableDatesData.dateRanges.some(range => {
        return dateString >= range.start && dateString <= range.end;
      });
      if (!inRange) return false;
    }

    return true;
  };

  // Generisanje dana u mesecu
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Dodaj prazna polja za dane pre početka meseca
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dodaj sve dane u mesecu
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      date.setHours(12, 0, 0, 0); // Postavi na podne da izbegneš timezone probleme
      days.push(date);
    }
    
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (date) => {
    if (date && isDateAvailable(date)) {
      // Koristi lokalni datum string bez timezone konverzije
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      console.log('Selected date:', dateString);
      onSelect(dateString);
      onClose();
    }
  };

  const calendarDays = generateCalendarDays();
  
  const isSelectedDate = (date) => {
    if (!date || !selectedDate) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return dateString === selectedDate;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={(e) => e.stopPropagation()}
          style={styles.modalContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.cancelText}>Otkaži</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Izaberite datum</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            
            <Text style={styles.monthYear}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
              <Ionicons name="chevron-forward" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day Names */}
          <View style={styles.dayNamesContainer}>
            {dayNames.map((day, index) => (
              <View key={index} style={styles.dayNameCell}>
                <Text style={styles.dayNameText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <ScrollView style={styles.calendarScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const available = isDateAvailable(date);
                const selected = isSelectedDate(date);
                const today = isToday(date);

                return (
                  <TouchableOpacity
                    key={`day-${date.getDate()}-${index}`}
                    style={[
                      styles.dayCell,
                      !available && styles.dayCellDisabled,
                      selected && styles.dayCellSelected,
                      today && !selected && styles.dayCellToday
                    ]}
                    onPress={() => handleDateSelect(date)}
                    disabled={!available}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !available && styles.dayTextDisabled,
                        selected && styles.dayTextSelected,
                        today && !selected && styles.dayTextToday
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendAvailable]} />
              <Text style={styles.legendText}>Dostupno</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendDisabled]} />
              <Text style={styles.legendText}>Nedostupno</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.legendSelected]} />
              <Text style={styles.legendText}>Izabrano</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 5,
    minWidth: 60,
  },
  cancelText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 60,
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#F9FAFB',
    paddingVertical: 8,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarScroll: {
    maxHeight: 350,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dayTextDisabled: {
    color: '#9CA3AF',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 15,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendAvailable: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  legendDisabled: {
    backgroundColor: '#F3F4F6',
    opacity: 0.3,
  },
  legendSelected: {
    backgroundColor: colors.primary,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default ImprovedDatePicker;