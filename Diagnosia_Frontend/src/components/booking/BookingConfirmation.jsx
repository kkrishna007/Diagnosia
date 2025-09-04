import React from 'react';
import { CheckCircle, Calendar, MapPin, Clock, Download, Share2, Home } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';

const BookingConfirmation = ({ bookingData }) => {
  const { test, booking } = bookingData;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
  };

  const getTimeSlotLabel = (timeSlotId) => {
    const timeSlots = {
      '6-8': '6:00 AM - 8:00 AM',
      '8-10': '8:00 AM - 10:00 AM',
      '10-12': '10:00 AM - 12:00 PM',
      '12-14': '12:00 PM - 2:00 PM',
      '14-16': '2:00 PM - 4:00 PM',
      '16-18': '4:00 PM - 6:00 PM',
      '18-20': '6:00 PM - 8:00 PM',
    };
    return timeSlots[timeSlotId] || timeSlotId;
  };

  const handleDownloadReceipt = () => {
    // Simulate download functionality
    console.log('Downloading receipt for booking:', booking.bookingId);
  };

  const handleShareBooking = () => {
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Diagnosia Lab Booking',
        text: `Lab test booked successfully! Booking ID: ${booking.bookingId}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(
        `Lab test booked successfully! Booking ID: ${booking.bookingId}\nTest: ${test.name}\nDate: ${formatDate(booking.selectedDate)}`
      );
      alert('Booking details copied to clipboard!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600">
          Your test has been successfully booked. We'll send you a confirmation email shortly.
        </p>
      </div>

      {/* Booking Details */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Booking Details</h2>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Confirmed
          </span>
        </div>

        <div className="space-y-4">
          {/* Booking ID */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 font-medium">Booking ID</div>
            <div className="text-lg font-mono text-blue-900">{booking.bookingId}</div>
          </div>

          {/* Test Information */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-2">{test.name}</h3>
            <p className="text-gray-600 text-sm">{test.description}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>🧪 {test.sampleType}</span>
                <span>⏱️ Results in {test.reportTime || '24 hours'}</span>
                {test.fastingRequired && <span>⚠️ Fasting required</span>}
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatPrice(booking.totalAmount)}
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Patient Name</div>
              <div className="font-medium">{booking.patientName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Phone Number</div>
              <div className="font-medium">{booking.patientPhone}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Email</div>
              <div className="font-medium">{booking.patientEmail}</div>
            </div>
          </div>

          {/* Collection Details */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Collection Schedule</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-medium">{formatDate(booking.selectedDate)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm text-gray-600">Time</div>
                  <div className="font-medium">{getTimeSlotLabel(booking.selectedTimeSlot)}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Collection Address</div>
                <div className="font-medium">{booking.address}</div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {booking.notes && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600">Additional Notes</div>
              <div className="mt-1 text-gray-900">{booking.notes}</div>
            </div>
          )}
        </div>
      </Card>

      {/* Important Information */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-4">Important Information</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>Our phlebotomist will arrive at your scheduled time. Please be available 15 minutes before.</div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>A confirmation SMS and email will be sent to you with detailed instructions.</div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>You can track your sample collection and report status in your dashboard.</div>
          </div>
          {test.fastingRequired && (
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
              <div className="text-amber-700 font-medium">
                Please maintain fasting as required for this test. Avoid food and beverages (except water) for the specified duration.
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleDownloadReceipt}
          variant="outline"
          className="flex items-center justify-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download Receipt</span>
        </Button>
        
        <Button
          onClick={handleShareBooking}
          variant="outline"
          className="flex items-center justify-center space-x-2"
        >
          <Share2 className="h-4 w-4" />
          <span>Share Details</span>
        </Button>
        
        <Link to="/dashboard" className="flex-1">
          <Button className="w-full flex items-center justify-center space-x-2">
            <Home className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Button>
        </Link>
      </div>

      {/* Contact Support */}
      <Card className="bg-gray-50">
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
          <p className="text-gray-600 text-sm mb-4">
            If you have any questions or need to reschedule, please contact our support team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+919876543210" className="text-blue-600 hover:text-blue-500 font-medium">
              📞 +91 98765 43210
            </a>
            <a href="mailto:support@diagnosia.com" className="text-blue-600 hover:text-blue-500 font-medium">
              ✉️ support@diagnosia.com
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingConfirmation;
