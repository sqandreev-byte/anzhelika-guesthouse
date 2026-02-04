import { Booking } from './types';

const API_BASE = '/api';

export const api = {
  // Get all bookings
  async getBookings(): Promise<Booking[]> {
    const response = await fetch(`${API_BASE}/bookings`);
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return response.json();
  },

  // Create new booking
  async createBooking(booking: Booking): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },

  // Update booking
  async updateBooking(id: string, booking: Booking): Promise<Booking> {
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (!response.ok) throw new Error('Failed to update booking');
    return response.json();
  },

  // Delete booking
  async deleteBooking(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete booking');
  },

  // Health check
  async healthCheck(): Promise<{ status: string; database: string }> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },
};
