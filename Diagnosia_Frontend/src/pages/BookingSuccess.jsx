import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingConfirmation from '../components/booking/BookingConfirmation';

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  // If user navigates directly here without booking data, redirect to dashboard
  if (!bookingData) {
    navigate('/dashboard');
    return null;
  }

  return <BookingConfirmation bookingData={bookingData} />;
};

export default BookingSuccess;
