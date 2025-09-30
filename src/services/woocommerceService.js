import { API_CONFIG } from '../utils/constants';

/**
 * WooCommerce Service for handling orders and checkout
 */

/**
 * Create WooCommerce order for bus booking
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

    // Prepare passenger info for WooCommerce
    const passengerInfo = passengers.map((passenger, index) => ({
      passenger_number: index + 1,
      full_name: passenger.fullName,
      phone: passenger.phone,
      passport: passenger.passport || '',
      description: passenger.description || ''
    }));

    // Prepare ticket info
    const ticketInfo = [{
      ticket_name: `Sedište ${ticketCount}`,
      ticket_qty: ticketCount,
      ticket_price: bus.price,
      seat_name: '' // Dodati ako koristite seat selection
    }];

    // Prepare order data for WooCommerce
    const orderData = {
      bus_id: bus.id,
      bus_name: bus.name,
      from: searchData.from,
      to: searchData.to,
      departure_date: searchData.departureDate,
      departure_time: bus.departure,
      arrival_time: bus.arrival,
      boarding_point: searchData.from,
      boarding_time: searchData.departureDate,
      dropping_point: searchData.to,
      dropping_time: searchData.departureDate, // Adjust based on arrival
      ticket_count: ticketCount,
      passenger_info: passengerInfo,
      ticket_info: ticketInfo,
      return_date: returnDate ? returnDate.toISOString() : null,
      total_price: totalPrice,
      duration: bus.duration
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create order');
    }

    return {
      success: true,
      data: {
        order_id: result.order_id,
        checkout_url: result.checkout_url, // URL to WooCommerce checkout page
        order_key: result.order_key
      }
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      message: error.message || 'Greška pri kreiranju porudžbine'
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

    // Prepare cart item data
    const cartItemData = {
      product_id: bus.woocommerce_product_id, // ID proizvoda u WooCommerce
      quantity: 1, // Uvek 1 jer je sve u jednoj stavci
      wbtm_bus_id: bus.id,
      wbtm_bp_place: searchData.from,
      wbtm_bp_time: searchData.departureDate,
      wbtm_dp_place: searchData.to,
      wbtm_dp_time: searchData.departureDate,
      wbtm_start_point: searchData.from,
      wbtm_start_time: bus.departure,
      wbtm_passenger_info: passengers.map((passenger, index) => ({
        passenger_number: index + 1,
        full_name: passenger.fullName,
        phone: passenger.phone,
        passport: passenger.passport || '',
        description: passenger.description || ''
      })),
      wbtm_seats_qty: ticketCount,
      wbtm_seats: [], // Popuniti ako koristite seat selection
      wbtm_ticket_info: [{
        ticket_name: `Karta`,
        ticket_qty: ticketCount,
        ticket_price: bus.price
      }],
      wbtm_tp: totalPrice,
      wbtm_return_date: returnDate ? returnDate.toISOString() : null
    };

    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/add-to-cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cartItemData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to add to cart');
    }

    return {
      success: true,
      data: {
        cart_key: result.cart_key,
        checkout_url: result.checkout_url // URL to WooCommerce checkout page
      }
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      message: error.message || 'Greška pri dodavanju u korpu'
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
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.BOOKINGS}/order/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to get order status');
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error getting order status:', error);
    return {
      success: false,
      message: error.message || 'Greška pri proveri statusa porudžbine'
    };
  }
};