// services/woocommerceService.js - AŽURIRANO SA DEBUG FUNKCIJAMA

import { API_CONFIG, WORDPRESS_URL } from '../utils/constants';

/**
 * Test API connection
 * @returns {Promise<Object>} Connection test result
 */
export const testApiConnection = async () => {
  try {
    console.log('Testing API connection to:', WORDPRESS_URL);
    
    const response = await fetch(`${WORDPRESS_URL}/wp-json`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    const data = await response.json();
    console.log('API Response:', data);

    return {
      success: true,
      message: 'API connection successful',
      data: data
    };
  } catch (error) {
    console.error('API Connection Error:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

/**
 * Add item to WooCommerce cart
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Cart data with checkout URL
 */
export const addToCart = async (bookingData) => {
  try {
    const {
      bus,
      searchData,
      ticketCount,
      passengers,
      returnDate,
      totalPrice
    } = bookingData;

    // Pripremi podatke za API - WBTM format
    const cartItemData = {
      bus_id: bus.id,
      journey_date: searchData.departureDate,
      boarding_point: searchData.from,
      boarding_time: `${searchData.departureDate} ${bus.departure || '00:00'}`,
      dropping_point: searchData.to,
      dropping_time: `${searchData.departureDate} ${bus.arrival || '23:59'}`,
      
      // WBTM passenger info format
      passenger_info: passengers.map((passenger, index) => ({
        passenger_number: index + 1,
        full_name: passenger.fullName,
        phone: passenger.phone,
        passport: passenger.passport || '',
        description: passenger.description || '',
        email: passenger.email || '' // Dodato
      })),
      
      // WBTM ticket info format - KRITIČNO!
      ticket_info: [{
        ticket_name: `Standardna karta`,
        ticket_qty: ticketCount,
        ticket_price: bus.price,
        seat_name: '' // Prazno ako nema seat selection
      }],
      
      ticket_count: ticketCount,
      total_price: totalPrice,
      return_date: returnDate ? returnDate.toISOString().split('T')[0] : null,
      
      // Dodatni WBTM podaci
      wbtm_start_point: searchData.from,
      wbtm_start_time: `${searchData.departureDate} ${bus.departure || '00:00'}`,
      wbtm_bp_place: searchData.from,
      wbtm_bp_time: `${searchData.departureDate} ${bus.departure || '00:00'}`,
      wbtm_dp_place: searchData.to,
      wbtm_dp_time: `${searchData.departureDate} ${bus.arrival || '23:59'}`,
      wbtm_seats_qty: ticketCount,
      wbtm_base_price: bus.price * ticketCount
    };

    // Konstruiši puni URL
    const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/add-to-cart`;
    
    console.log('=== ADD TO CART DEBUG ===');
    console.log('API URL:', apiUrl);
    console.log('Request Data:', JSON.stringify(cartItemData, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(cartItemData),
    });

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);

    // Pokušaj da pročitaš odgovor
    let result;
    try {
      const textResponse = await response.text();
      console.log('Raw Response:', textResponse);
      result = JSON.parse(textResponse);
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Server vratio neispravan odgovor');
    }

    console.log('Parsed Result:', result);

    if (!response.ok) {
      throw new Error(result.message || `HTTP Error: ${response.status}`);
    }

    // Proveri da li imamo checkout_url
    if (!result.checkout_url && !result.data?.checkout_url) {
      console.warn('No checkout_url in response:', result);
      throw new Error('Checkout URL nije dostupan u odgovoru servera');
    }

    return {
      success: true,
      data: {
        cart_key: result.cart_key || result.data?.cart_key,
        checkout_url: result.checkout_url || result.data?.checkout_url,
        order_id: result.order_id || result.data?.order_id
      }
    };

  } catch (error) {
    console.error('=== ADD TO CART ERROR ===');
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    // Detaljnije error poruke
    let userMessage = 'Greška pri dodavanju u korpu';
    
    if (error.message === 'Network request failed') {
      userMessage = 'Greška u mreži. Proverite internet konekciju i URL WordPress sajta.';
    } else if (error.message.includes('timeout')) {
      userMessage = 'Zahtev je istekao. Server ne odgovara.';
    } else if (error.message.includes('JSON')) {
      userMessage = 'Server je vratio neispravan odgovor.';
    }

    return {
      success: false,
      message: userMessage,
      error: error.message,
      details: {
        errorType: error.name,
        originalMessage: error.message
      }
    };
  }
};

/**
 * Create WooCommerce order directly (alternative method)
 * @param {Object} bookingData - Booking information
 * @returns {Promise<Object>} Order data with checkout URL
 */
export const createOrder = async (bookingData) => {
  try {
    const {
      bus,
      searchData,
      ticketCount,
      passengers,
      returnDate,
      totalPrice
    } = bookingData;

    const orderData = {
      bus_id: bus.id,
      bus_name: bus.name || bus.title,
      from: searchData.from,
      to: searchData.to,
      departure_date: searchData.departureDate,
      departure_time: bus.departure || searchData.departureTime,
      arrival_time: bus.arrival || searchData.arrivalTime,
      boarding_point: searchData.from,
      dropping_point: searchData.to,
      ticket_count: ticketCount,
      passenger_info: passengers.map((passenger, index) => ({
        passenger_number: index + 1,
        full_name: passenger.fullName,
        phone: passenger.phone,
        passport: passenger.passport || '',
        description: passenger.description || ''
      })),
      total_price: totalPrice,
      return_date: returnDate ? returnDate.toISOString().split('T')[0] : null
    };

    const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/create-order`;
    
    console.log('=== CREATE ORDER DEBUG ===');
    console.log('API URL:', apiUrl);
    console.log('Order Data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('Response Status:', response.status);

    const textResponse = await response.text();
    console.log('Raw Response:', textResponse);
    
    const result = JSON.parse(textResponse);
    console.log('Parsed Result:', result);

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create order');
    }

    return {
      success: true,
      data: {
        order_id: result.order_id || result.data?.order_id,
        checkout_url: result.checkout_url || result.data?.checkout_url,
        order_key: result.order_key || result.data?.order_key,
        order_number: result.order_number || result.data?.order_number
      }
    };

  } catch (error) {
    console.error('=== CREATE ORDER ERROR ===');
    console.error('Error:', error);
    
    return {
      success: false,
      message: error.message || 'Greška pri kreiranju porudžbine',
      error: error.message
    };
  }
};

/**
 * Get order status
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order status data
 */
export const getOrderStatus = async (orderId) => {
  try {
    const apiUrl = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/order/${orderId}`;
    
    console.log('Getting order status:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get order status');
    }

    return {
      success: true,
      data: result.data || result
    };

  } catch (error) {
    console.error('Error getting order status:', error);
    return {
      success: false,
      message: error.message || 'Greška pri proveri statusa porudžbine'
    };
  }
};

/**
 * Helper: Proveri da li je WordPress URL dostupan
 */
export const checkWordPressUrl = async () => {
  try {
    console.log('Checking WordPress URL:', WORDPRESS_URL);
    
    const response = await fetch(WORDPRESS_URL, {
      method: 'HEAD',
      timeout: 5000
    });
    
    return {
      accessible: response.ok,
      status: response.status,
      url: WORDPRESS_URL
    };
  } catch (error) {
    console.error('WordPress URL not accessible:', error);
    return {
      accessible: false,
      error: error.message,
      url: WORDPRESS_URL
    };
  }
};