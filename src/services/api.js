import axios from 'axios';
import { API_CONFIG } from '../utils/constants';

const apiClient = axios.create({
  baseURL: 'https://balbuss.rs/wp-json/balbuss/v1',
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Get all lines
export const getAllLines = async () => {
  try {
    console.log('Fetching all lines from BalBuss API...');
    const response = await apiClient.get('/lines');
    
    console.log('Lines API response:', response.data);
    
    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      throw new Error('Failed to fetch lines');
    }
    
  } catch (error) {
    console.error('BalBuss API lines error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get available destination cities based on selected origin
export const getAvailableDestinations = async (fromCity) => {
  try {
    console.log('=== getAvailableDestinations called ===');
    console.log('FromCity:', fromCity);
    
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      console.error('Failed to fetch lines');
      throw new Error('Failed to fetch lines');
    }
    
    console.log('Total lines fetched:', linesResponse.data.length);
    
    const destinationsSet = new Set();
    let matchingLinesCount = 0;
    
    // Filter lines that have the selected city as boarding point
    linesResponse.data.forEach(line => {
      console.log('Checking line:', line.name);
      console.log('Boarding points:', line.boardingPoints.map(p => p.name));
      
      const hasBoardingPoint = line.boardingPoints.some(point => {
        const match = point.name.toLowerCase() === fromCity.toLowerCase();
        console.log(`  Comparing "${point.name}" with "${fromCity}": ${match}`);
        return match;
      });
      
      if (hasBoardingPoint) {
        matchingLinesCount++;
        console.log('✓ Line matches! Adding dropping points:', line.droppingPoints.map(p => p.name));
        // Add all dropping points from this line
        line.droppingPoints.forEach(point => {
          destinationsSet.add(point.name);
        });
      }
    });
    
    console.log('Matching lines count:', matchingLinesCount);
    console.log('Unique destinations found:', Array.from(destinationsSet));
    
    const destinations = Array.from(destinationsSet).map((city, index) => ({
      id: index + 1,
      name: city,
      code: city.substring(0, 3).toUpperCase()
    }));
    
    console.log('Final destinations array:', destinations);
    
    return {
      success: true,
      data: destinations
    };
    
  } catch (error) {
    console.error('Destinations error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get available origin cities based on selected destination
export const getAvailableOrigins = async (toCity) => {
  try {
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      throw new Error('Failed to fetch lines');
    }
    
    const originsSet = new Set();
    
    // Filter lines that have the selected city as dropping point
    linesResponse.data.forEach(line => {
      const hasDroppingPoint = line.droppingPoints.some(point => 
        point.name.toLowerCase() === toCity.toLowerCase()
      );
      
      if (hasDroppingPoint) {
        // Add all boarding points from this line
        line.boardingPoints.forEach(point => {
          originsSet.add(point.name);
        });
      }
    });
    
    const origins = Array.from(originsSet).map((city, index) => ({
      id: index + 1,
      name: city,
      code: city.substring(0, 3).toUpperCase()
    }));
    
    return {
      success: true,
      data: origins
    };
    
  } catch (error) {
    console.error('Origins error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get available dates for specific route
export const getAvailableDates = async (fromCity, toCity) => {
  try {
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      throw new Error('Failed to fetch lines');
    }
    
    // Find lines matching the route
    const matchingLines = linesResponse.data.filter(line => {
      const hasBoardingPoint = line.boardingPoints.some(point => 
        point.name.toLowerCase() === fromCity.toLowerCase()
      );
      const hasDroppingPoint = line.droppingPoints.some(point => 
        point.name.toLowerCase() === toCity.toLowerCase()
      );
      return hasBoardingPoint && hasDroppingPoint;
    });
    
    if (matchingLines.length === 0) {
      return {
        success: false,
        error: 'No lines found for this route',
        data: {
          allowedDays: [],
          blockedDates: [],
          dateRanges: []
        }
      };
    }
    
    console.log('Matching lines for date filtering:', matchingLines.length);
    
    // TEMPORARY: Hardcoded schedule until API provides off_days data
    // Check if any line has schedule/off_days data, otherwise use defaults
    const allowedDaysSet = new Set();
    const blockedDates = [];
    const dateRanges = [];
    
    matchingLines.forEach(line => {
      console.log('Checking line for dates:', line.name, line);
      
      // Check if API returns off_days or schedule
      if (line.offDays || line.off_days) {
        // Parse off days from API (e.g., "saturday,sunday")
        const offDaysString = line.offDays || line.off_days;
        const offDays = offDaysString.split(',').map(d => d.trim().toLowerCase());
        
        // Add all days except off days
        const allDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        allDays.forEach((day, index) => {
          if (!offDays.includes(day)) {
            allowedDaysSet.add(index);
          }
        });
      } 
      // Check for operationalDays in API
      else if (line.operationalDays && Array.isArray(line.operationalDays)) {
        line.operationalDays.forEach(day => {
          const dayLower = day.toLowerCase();
          const dayMapping = {
            'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
            'thursday': 4, 'friday': 5, 'saturday': 6,
            'nedelja': 0, 'ponedeljak': 1, 'utorak': 2, 'sreda': 3,
            'četvrtak': 4, 'petak': 5, 'subota': 6
          };
          if (dayMapping[dayLower] !== undefined) {
            allowedDaysSet.add(dayMapping[dayLower]);
          }
        });
      }
      // Check for schedule array
      else if (line.schedule && Array.isArray(line.schedule)) {
        line.schedule.forEach(scheduleItem => {
          if (scheduleItem.day) {
            const dayLower = scheduleItem.day.toLowerCase();
            const dayMapping = {
              'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
              'thursday': 4, 'friday': 5, 'saturday': 6,
              'nedelja': 0, 'ponedeljak': 1, 'utorak': 2, 'sreda': 3,
              'četvrtak': 4, 'petak': 5, 'subota': 6
            };
            if (dayMapping[dayLower] !== undefined) {
              allowedDaysSet.add(dayMapping[dayLower]);
            }
          }
        });
      }
      
      // Get blocked dates if available
      if (line.blockedDates && Array.isArray(line.blockedDates)) {
        blockedDates.push(...line.blockedDates);
      }
      if (line.offDates && Array.isArray(line.offDates)) {
        blockedDates.push(...line.offDates);
      }
      
      // Get date ranges if available
      if (line.startDate && line.endDate) {
        dateRanges.push({
          start: line.startDate,
          end: line.endDate
        });
      }
    });
    
    // HARDCODED RULES (until API provides proper data)
    // Outbound routes (to Istanbul):
    // - Novi Sad → Istanbul: Wednesday (3) and Sunday (0)
    // - Novi Pazar → Istanbul: Wednesday (3) and Sunday (0)
    // Return routes (from Istanbul):
    // - Istanbul → Novi Sad: Tuesday (2) and Friday (5)
    // - Istanbul → Novi Pazar: Tuesday (2) and Friday (5)
    
    const routeKey = `${fromCity.toLowerCase()}-${toCity.toLowerCase()}`;
    let finalAllowedDays = [];
    
    // If no data from API, use hardcoded schedules
    if (allowedDaysSet.size === 0) {
      console.log('No schedule data from API, using hardcoded rules');
      
      // Routes TO Istanbul (Sreda i Nedelja)
      if (routeKey === 'novi sad-istanbul' || routeKey === 'novi pazar-istanbul') {
        finalAllowedDays = [0, 3]; // Sunday and Wednesday
        console.log(`Hardcoded schedule for ${routeKey}: Nedelja (Sunday) and Sreda (Wednesday)`);
      } 
      // Routes FROM Istanbul (Utorak i Petak)
      else if (routeKey === 'istanbul-novi sad' || routeKey === 'istanbul-novi pazar') {
        finalAllowedDays = [2, 5]; // Tuesday and Friday
        console.log(`Hardcoded schedule for ${routeKey}: Utorak (Tuesday) and Petak (Friday)`);
      }
      // Default: allow all days
      else {
        finalAllowedDays = [0, 1, 2, 3, 4, 5, 6];
        console.log(`No specific schedule for ${routeKey}, allowing all days`);
      }
    } else {
      finalAllowedDays = Array.from(allowedDaysSet);
      console.log('Using schedule from API:', finalAllowedDays);
    }
    
    return {
      success: true,
      data: {
        allowedDays: finalAllowedDays,
        blockedDates: Array.from(new Set(blockedDates)),
        dateRanges: dateRanges
      }
    };
    
  } catch (error) {
    console.error('Available dates error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        allowedDays: [0, 1, 2, 3, 4, 5, 6],
        blockedDates: [],
        dateRanges: []
      }
    };
  }
};

// Check if a specific date is available for the route
export const isDateAvailable = (date, availableDatesData) => {
  const { allowedDays, blockedDates, dateRanges } = availableDatesData;
  
  const checkDate = new Date(date);
  const dayOfWeek = checkDate.getDay();
  
  // Check if day of week is allowed
  if (allowedDays.length > 0 && !allowedDays.includes(dayOfWeek)) {
    return false;
  }
  
  // Check if date is blocked
  const dateString = checkDate.toISOString().split('T')[0];
  if (blockedDates.includes(dateString)) {
    return false;
  }
  
  // Check if date is within valid ranges (if ranges specified)
  if (dateRanges.length > 0) {
    const isInRange = dateRanges.some(range => {
      const start = new Date(range.start);
      const end = new Date(range.end);
      return checkDate >= start && checkDate <= end;
    });
    
    if (!isInRange) {
      return false;
    }
  }
  
  return true;
};

// Get unique cities from all lines
export const getCities = async () => {
  try {
    console.log('=== getCities called ===');
    const linesResponse = await getAllLines();
    
    console.log('Lines response in getCities:', linesResponse);
    
    if (!linesResponse.success) {
      console.error('getCities: Lines response not successful');
      throw new Error('Failed to fetch lines');
    }
    
    console.log('Total lines for cities extraction:', linesResponse.data.length);
    
    const citiesSet = new Set();
    
    linesResponse.data.forEach(line => {
      console.log(`Processing line: ${line.name}`);
      console.log('Boarding points:', line.boardingPoints.map(p => p.name));
      console.log('Dropping points:', line.droppingPoints.map(p => p.name));
      
      line.boardingPoints.forEach(point => citiesSet.add(point.name));
      line.droppingPoints.forEach(point => citiesSet.add(point.name));
    });
    
    console.log('Unique cities found:', Array.from(citiesSet));
    
    const cities = Array.from(citiesSet).map((city, index) => ({
      id: index + 1,
      name: city,
      code: city.substring(0, 3).toUpperCase()
    }));
    
    console.log('Final cities array:', cities);
    console.log('Total cities count:', cities.length);
    
    return {
      success: true,
      data: cities
    };
    
  } catch (error) {
    console.error('Cities error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Search buses based on from/to locations and date
export const searchBuses = async (searchParams) => {
  try {
    const { from, to, departureDate, passengers = 1 } = searchParams;
    
    console.log('========================================');
    console.log('=== SEARCH BUSES v2.0 WITH DAY FILTER ===');
    console.log('========================================');
    console.log('Search params:', searchParams);
    
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      throw new Error('Failed to fetch lines');
    }
    
    let filteredLines = linesResponse.data;
    console.log('Total lines from API:', filteredLines.length);
    
    // Filter by from location (use city name, not ID)
    if (from) {
      filteredLines = filteredLines.filter(line => 
        line.boardingPoints.some(point => 
          point.name.toLowerCase() === from.toLowerCase() ||
          point.name.toLowerCase().includes(from.toLowerCase())
        )
      );
      console.log(`After FROM filter (${from}):`, filteredLines.length);
    }
    
    // Filter by to location (use city name, not ID)
    if (to) {
      filteredLines = filteredLines.filter(line =>
        line.droppingPoints.some(point =>
          point.name.toLowerCase() === to.toLowerCase() ||
          point.name.toLowerCase().includes(to.toLowerCase())
        )
      );
      console.log(`After TO filter (${to}):`, filteredLines.length);
    }
    
    console.log(`Final filtered lines count: ${filteredLines.length}`);
    
    // ADDITIONAL FILTER: Filter by day name in line title
    if (departureDate) {
      const selectedDate = new Date(departureDate);
      const dayOfWeek = selectedDate.getDay();
      const dayNamesInTitle = {
        0: ['nedelja', 'sunday'],
        1: ['ponedeljak', 'monday'],
        2: ['utorak', 'tuesday'],
        3: ['sreda', 'wednesday'],
        4: ['četvrtak', 'thursday'],
        5: ['petak', 'friday'],
        6: ['subota', 'saturday']
      };
      
      const selectedDayNames = dayNamesInTitle[dayOfWeek];
      console.log(`Selected day names to match: ${selectedDayNames.join(', ')}`);
      
      // Check if ANY line has a day name in its title
      const hasLinesWithDayNames = filteredLines.some(line => {
        const lineName = line.name.toLowerCase();
        return Object.values(dayNamesInTitle).flat().some(day => lineName.includes(day));
      });
      
      if (hasLinesWithDayNames) {
        console.log('Lines have day names in titles, filtering by selected day...');
        
        filteredLines = filteredLines.filter(line => {
          const lineName = line.name.toLowerCase();
          
          // Check if line name contains the selected day
          const matchesSelectedDay = selectedDayNames.some(dayName => 
            lineName.includes(dayName)
          );
          
          if (matchesSelectedDay) {
            console.log(`✅ Keeping line: ${line.name} (matches selected day)`);
            return true;
          } else {
            // Check if line has ANY day name
            const hasAnyDayName = Object.values(dayNamesInTitle).flat().some(day => 
              lineName.includes(day)
            );
            
            if (hasAnyDayName) {
              console.log(`❌ Filtering out: ${line.name} (different day)`);
              return false;
            } else {
              // Line doesn't have day name, keep it
              console.log(`✅ Keeping line: ${line.name} (no day specified)`);
              return true;
            }
          }
        });
        
        console.log(`After day name filter: ${filteredLines.length} lines`);
      }
    }
    
    console.log(`Final result: ${filteredLines.length} lines to return`);
    
    // Transform to app format
    const results = filteredLines.map(line => {
      const firstBoarding = line.boardingPoints[0];
      const lastDropping = line.droppingPoints[line.droppingPoints.length - 1];
      
      let price = 0;
      if (line.prices && line.prices.length > 0) {
        const matchingPrice = line.prices.find(p => 
          (!from || p.boardingPoint.toLowerCase().includes(from.toLowerCase())) &&
          (!to || p.droppingPoint.toLowerCase().includes(to.toLowerCase()))
        );
        price = matchingPrice ? matchingPrice.adultPrice : line.prices[0].adultPrice;
      }
      
      return {
        id: line.id,
        company: 'BalBuss',
        name: line.name,
        route: `${firstBoarding.name} → ${lastDropping.name}`,
        description: line.description || '',
        image: line.image || null,
        from: firstBoarding.name,
        to: lastDropping.name,
        departure: firstBoarding.time,
        arrival: lastDropping.time,
        duration: calculateDuration(firstBoarding.time, lastDropping.time),
        price: price,
        availableSeats: line.totalSeats || 50,
        totalSeats: line.totalSeats || 50,
        rating: 4.7,
        amenities: line.amenities || [],
        boardingPoints: line.boardingPoints,
        droppingPoints: line.droppingPoints,
        allPrices: line.prices
      };
    });
    
    console.log(`=== Returning ${results.length} lines ===`);
    
    return {
      success: true,
      data: results,
      total: results.length
    };
    
  } catch (error) {
    console.error('Search error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

// Get popular routes
export const getPopularRoutes = async () => {
  try {
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      throw new Error('Failed to fetch lines');
    }
    
    const routeMap = new Map();
    
    linesResponse.data.forEach(line => {
      const firstBoarding = line.boardingPoints[0];
      const lastDropping = line.droppingPoints[line.droppingPoints.length - 1];
      const routeKey = `${firstBoarding.name}-${lastDropping.name}`;
      
      if (!routeMap.has(routeKey) && !line.name.toLowerCase().includes('povratna')) {
        const price = line.prices && line.prices.length > 0 ? 
          line.prices[0].adultPrice : 0;
        const duration = calculateDuration(firstBoarding.time, lastDropping.time);
        
        routeMap.set(routeKey, {
          id: line.id,
          from: firstBoarding.name,
          to: lastDropping.name,
          from_id: firstBoarding.id || line.id,
          to_id: lastDropping.id || line.id + 1000,
          price: price,
          duration: duration,
          popularity: 90
        });
      }
    });
    
    const popularRoutes = Array.from(routeMap.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 4);
    
    return {
      success: true,
      data: popularRoutes
    };
    
  } catch (error) {
    console.error('Popular routes error:', error);
    return {
      success: true,
      data: [
        { id: 1, from: 'Novi Sad', to: 'Istanbul', from_id: 1, to_id: 2, price: 6000, duration: '14h', popularity: 95 },
        { id: 2, from: 'Beograd', to: 'Istanbul', from_id: 3, to_id: 2, price: 6000, duration: '14h', popularity: 90 }
      ],
      fallback: true
    };
  }
};

// Helper function to calculate duration
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 'N/A';
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let hours = endHour - startHour;
  let minutes = endMin - startMin;
  
  if (minutes < 0) {
    hours -= 1;
    minutes += 60;
  }
  
  if (hours < 0) {
    hours += 24;
  }
  
  return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`.trim();
};

// Get bus/line details by ID
export const getBusDetails = async (busId) => {
  try {
    const linesResponse = await getAllLines();
    
    if (!linesResponse.success) {
      throw new Error('Failed to fetch lines');
    }
    
    const line = linesResponse.data.find(l => l.id === parseInt(busId));
    
    if (!line) {
      throw new Error('Line not found');
    }
    
    return {
      success: true,
      data: line
    };
    
  } catch (error) {
    console.error('Bus details error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Get App Content (Banners, Featured Routes, Announcements)
 * @returns {Promise<Object>}
 */
export const getAppContent = async () => {
  try {
    console.log('Fetching app content...');
    const response = await apiClient.get('/app-content');

    console.log('App content response:', response.data);

    if (response.data && response.data.success) {
      return {
        banners: response.data.data.banners || [],
        featured_routes: response.data.data.featured_routes || [],
        announcements: response.data.data.announcements || []
      };
    }
    
    // Ako API ne vrati success, vrati prazne nizove
    console.log('App content API returned no success, returning empty arrays');
    return {
      banners: [],
      featured_routes: [],
      announcements: []
    };
    
  } catch (error) {
    console.error('Error fetching app content:', error);
    // Ne crashuj app, samo vrati prazne nizove
    return {
      banners: [],
      featured_routes: [],
      announcements: []
    };
  }
};

export default {
  getAllLines,
  searchBuses,
  getPopularRoutes,
  getBusDetails,
  getCities,
  getAvailableDestinations,
  getAvailableOrigins,
  getAvailableDates,
  isDateAvailable,
  getAppContent
};