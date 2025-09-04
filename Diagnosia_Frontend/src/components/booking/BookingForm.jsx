import { apiService } from '../../services/api';
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/input';
import LoadingSpinner from '../ui/LoadingSpinner';
import TimeSlotPicker from './TimeSlotPicker';

const BookingForm = ({ selectedTest, onBookingComplete }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: user?.name || '',
    patientEmail: user?.email || '',
    patientPhone: user?.phone || '',
    address: '',
    selectedDate: '',
    selectedTimeSlot: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTimeSlotSelect = (date, timeSlot) => {
    setFormData(prev => ({
      ...prev,
      selectedDate: date,
      selectedTimeSlot: timeSlot
    }));
    if (errors.selectedDate || errors.selectedTimeSlot) {
      setErrors(prev => ({
        ...prev,
        selectedDate: '',
        selectedTimeSlot: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (!formData.patientEmail) {
      newErrors.patientEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.patientEmail)) {
      newErrors.patientEmail = 'Please enter a valid email';
    }

    if (!formData.patientPhone) {
      newErrors.patientPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.patientPhone.replace(/\D/g, ''))) {
      newErrors.patientPhone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required for home collection';
    }

    if (!formData.selectedDate) {
      newErrors.selectedDate = 'Please select a date';
    }

    if (!formData.selectedTimeSlot) {
      newErrors.selectedTimeSlot = 'Please select a time slot';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Call backend API to create booking
      const bookingPayload = {
        test_id: selectedTest.id,
        slot: `${formData.selectedDate} ${formData.selectedTimeSlot}`,
        patient_name: formData.patientName,
        address: formData.address,
        notes: formData.notes,
      };
      const response = await apiService.bookings.create(bookingPayload);
      const bookingData = {
        test: selectedTest,
        booking: response.data,
      };
      if (onBookingComplete) {
        onBookingComplete(bookingData);
      }
    } catch (error) {
      setErrors({
        general: error.response?.data?.message || 'Failed to book appointment. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Test Summary */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
        <div className="flex items-start space-x-4 p-4 bg-blue-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{selectedTest.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{selectedTest.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>🧪 {selectedTest.sampleType}</span>
                <span>⏱️ Results in {selectedTest.reportTime || '24 hours'}</span>
                {selectedTest.fastingRequired && <span>⚠️ Fasting required</span>}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(selectedTest.price)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Booking Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {errors.general}
          </div>
        )}

        {/* Patient Information */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Patient Information</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <Input
                id="patientName"
                name="patientName"
                type="text"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="Enter patient's full name"
                className={errors.patientName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.patientName && (
                <p className="mt-1 text-sm text-red-600">{errors.patientName}</p>
              )}
            </div>

            <div>
              <label htmlFor="patientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="patientPhone"
                  name="patientPhone"
                  type="tel"
                  value={formData.patientPhone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={`pl-10 ${errors.patientPhone ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.patientPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.patientPhone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="patientEmail"
                  name="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={`pl-10 ${errors.patientEmail ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.patientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.patientEmail}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Collection Address */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Collection Address</span>
          </h3>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Complete Address *
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your complete address for home sample collection"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
          </div>
        </Card>

        {/* Date and Time Selection */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Select Date & Time</span>
          </h3>
          
          <TimeSlotPicker
            onTimeSlotSelect={handleTimeSlotSelect}
            selectedDate={formData.selectedDate}
            selectedTimeSlot={formData.selectedTimeSlot}
          />
          
          {(errors.selectedDate || errors.selectedTimeSlot) && (
            <div className="mt-2 text-sm text-red-600">
              {errors.selectedDate || errors.selectedTimeSlot}
            </div>
          )}
        </Card>

        {/* Additional Notes */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h3>
          <textarea
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any special instructions or requirements..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? <LoadingSpinner size="sm" /> : `Book for ${formatPrice(selectedTest.price)}`}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
