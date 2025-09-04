import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import BookingForm from '../components/booking/BookingForm';
import BookingConfirmation from '../components/booking/BookingConfirmation';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Booking = () => {
  const location = useLocation();
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [selectedTest, setSelectedTest] = useState(location.state?.selectedTest || null);
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If no test is selected and we have a testId in params, fetch the test
    if (!selectedTest && testId) {
      fetchTestById(testId);
    }
    
    // If no test is available, redirect to tests page
    if (!selectedTest && !testId) {
      navigate('/tests');
    }
  }, [testId, selectedTest, navigate]);

  const fetchTestById = async (id) => {
    try {
      setLoading(true);
      const response = await apiService.tests.getById(id);
      setSelectedTest(response.data);
    } catch (err) {
      setError('Test not found. Redirecting to tests page...');
      setTimeout(() => navigate('/tests'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingComplete = (data) => {
    setBookingData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  if (!selectedTest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 mb-4">No test selected</div>
          <button 
            onClick={() => navigate('/tests')}
            className="text-blue-600 hover:text-blue-500"
          >
            Browse Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!bookingData ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Test</h1>
              <p className="text-gray-600">
                Complete your booking details for home sample collection
              </p>
            </div>
            
            <BookingForm 
              selectedTest={selectedTest}
              onBookingComplete={handleBookingComplete}
            />
          </>
        ) : (
          <BookingConfirmation bookingData={bookingData} />
        )}
      </div>
    </div>
  );
};

export default Booking;
