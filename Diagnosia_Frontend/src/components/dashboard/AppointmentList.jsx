import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Phone, MoreVertical, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { apiService } from '../../services/api';
import TimeSlotPicker from '../booking/TimeSlotPicker';

const AppointmentList = ({ appointments, pendingReports, onRefresh }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      case 'sample_collected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Sample Collected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const safeParseDate = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return isValid(d) ? d : null;
  };

  const formatDate = (dateLike) => {
    const d = safeParseDate(dateLike);
    return d ? format(d, 'MMM d, yyyy') : '-';
  };

  const timeSlotLabel = (ts) => {
    if (!ts) return '-';
    // Recognize stored ranges
    const map = {
      '6-8': '6:00 AM - 8:00 AM',
      '8-10': '8:00 AM - 10:00 AM',
      '10-12': '10:00 AM - 12:00 PM',
      '12-14': '12:00 PM - 2:00 PM',
      '14-16': '2:00 PM - 4:00 PM',
      '16-18': '4:00 PM - 6:00 PM',
      '18-20': '6:00 PM - 8:00 PM',
    };
    if (map[ts]) return map[ts];
    // If it's a full time like HH:mm:ss, format to h:mm a
    try {
      // Construct a date to format the time
      const d = new Date(`1970-01-01T${String(ts).slice(0,8)}`);
      if (isValid(d)) return format(d, 'h:mm a');
    } catch {}
    return ts;
  };

  const normalizeAppointment = (item) => {
    const dateRaw = item?.date || item?.appointment_date || item?.collection_date || item?.scheduled_for || item?.created_at;
    const timeRaw = item?.timeSlot || item?.appointment_time || item?.time || item?.slot || item?.time_slot;
    return {
      ...item,
      id: item?.id ?? item?.appointment_id ?? item?.appointmentId ?? item?.bookingId,
      appointmentId: item?.appointment_id ?? item?.id ?? item?.appointmentId,
      bookingId: item?.bookingId ?? item?.id ?? item?.appointment_id ?? item?.appointmentId ?? item?.reference_code,
      testName: item?.testName ?? item?.test_name ?? item?.name ?? item?.test?.name ?? 'Lab Test',
      appointmentType: item?.appointment_type || item?.type || 'lab_visit',
      status: (item?.status_label ?? item?.status ?? item?.appointment_status ?? 'confirmed')?.toLowerCase?.() || 'confirmed',
      date: dateRaw || null,
      dateObj: safeParseDate(dateRaw),
      timeSlot: timeSlotLabel(timeRaw),
      estimatedCompletion: item?.estimated_completion || item?.estimatedCompletion || null,
    };
  };

  const handleCancelAppointment = async () => {
    try {
      if (!selectedAppointment?.appointmentId && !selectedAppointment?.id) throw new Error('Missing appointment id');
      const id = selectedAppointment?.appointmentId || selectedAppointment?.id;
      await apiService.bookings.cancel(id);
      setShowCancelModal(false);
      setSelectedAppointment(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  // State for reschedule flow
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const handleTimeSlotSelect = (date, slot) => {
    setRescheduleDate(date);
    setRescheduleSlot(slot);
    setRescheduleError('');
  };

  const slotToStartTime = (slotId) => {
    const map = {
      '6-8': '06:00:00',
      '8-10': '08:00:00',
      '10-12': '10:00:00',
      '12-14': '12:00:00',
      '14-16': '14:00:00',
      '16-18': '16:00:00',
      '18-20': '18:00:00',
    };
    return map[slotId] || '10:00:00';
  };

  const handleRescheduleAppointment = async () => {
    try {
      if (!selectedAppointment?.appointmentId && !selectedAppointment?.id) throw new Error('Missing appointment id');
      if (!rescheduleDate || !rescheduleSlot) {
        setRescheduleError('Please select a date and time slot');
        return;
      }
      setRescheduleLoading(true);
      const id = selectedAppointment?.appointmentId || selectedAppointment?.id;
      await apiService.bookings.reschedule(id, {
        appointment_date: rescheduleDate,
        appointment_time: slotToStartTime(rescheduleSlot),
      });
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleDate('');
      setRescheduleSlot('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setRescheduleError(error?.response?.data?.message || 'Failed to reschedule. Try another slot.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const normalizedAppointments = (appointments || []).map(apt => ({ ...normalizeAppointment(apt), type: 'appointment' }));
  const normalizedPending = (pendingReports || []).map(report => ({ ...normalizeAppointment(report), type: 'pending_report' }));
  const allAppointments = [...normalizedAppointments, ...normalizedPending]
    .sort((a, b) => {
      const ad = a.dateObj ? a.dateObj.getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dateObj ? b.dateObj.getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Appointments</h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Appointments List */}
      {allAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments scheduled</h3>
          <p className="text-gray-600 mb-4">
            You don't have any upcoming appointments or pending reports.
          </p>
          <Button onClick={() => window.location.href = '/tests'}>
            Book a Test
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {allAppointments.map((item, idx) => (
            <Card key={`${item.type}-${item.bookingId || item.id || idx}`} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.testName}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(item.date)}</span>
                    </div>
                    
                    {item.timeSlot && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{item.timeSlot}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">ID:</span>
                      <span className="font-mono">{item.bookingId}</span>
                    </div>
                  </div>

                  {item.type === 'pending_report' && item.estimatedCompletion && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Estimated completion:</strong> {formatDate(item.estimatedCompletion)}
                      </p>
                    </div>
                  )}
                  
                  {item.status === 'confirmed' && item.type === 'appointment' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="text-sm text-green-800">
                          <p className="font-medium">Your appointment is confirmed!</p>
                          {item.appointmentType === 'home_collection' ? (
                            <p>Our phlebotomist will arrive at your scheduled time.</p>
                          ) : (
                            <p>Please reach the lab a few minutes before your scheduled time.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {item.status === 'sample_collected' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Sample collected</p>
                        {item.estimatedCompletion && (
                          <p>
                            <strong>Estimated completion:</strong>{' '}
                            {(() => {
                              const d = safeParseDate(item.estimatedCompletion);
                              return d ? `${format(d, 'MMM d, yyyy')} • ${format(d, 'h:mm a')}` : '-';
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {item.type === 'appointment' && ['confirmed','booked','rescheduled'].includes(item.status) && (
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(item);
                        setShowRescheduleModal(true);
                      }}
                    >
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(item);
                        setShowCancelModal(true);
                      }}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {item.type === 'pending_report' && (
                  <div className="ml-4">
                    <Button variant="outline" size="sm" disabled>
                      Processing...
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your appointment for{' '}
            <strong>{selectedAppointment?.testName}</strong>?
          </p>
          <p className="text-sm text-gray-500">
            This action cannot be undone. You'll need to book a new appointment if you want to take this test.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Keep Appointment
            </Button>
            <Button
              onClick={handleCancelAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Choose a new date and time slot for <strong>{selectedAppointment?.testName}</strong>.
          </p>
          {/* Reuse booking TimeSlotPicker */}
          <div className="border rounded-lg p-3">
            <TimeSlotPicker
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedDate={rescheduleDate}
              selectedTimeSlot={rescheduleSlot}
            />
          </div>
          {rescheduleError && (
            <div className="text-sm text-red-600">{rescheduleError}</div>
          )}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleModal(false);
                setRescheduleDate('');
                setRescheduleSlot('');
                setRescheduleError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRescheduleAppointment} disabled={rescheduleLoading || !rescheduleDate || !rescheduleSlot}>
              {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AppointmentList;
