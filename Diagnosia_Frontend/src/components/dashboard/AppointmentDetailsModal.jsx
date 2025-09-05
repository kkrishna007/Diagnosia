import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Calendar, Clock, Home, MapPin, Download } from 'lucide-react';
import Modal from '../ui/Modal';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { apiService } from '../../services/api';
import { format, isValid } from 'date-fns';
import { generateBookingReceipt } from '../../utils/pdf';
import { AuthContext } from '../../context/AuthContext';

const timeSlotLabel = (ts) => {
  if (!ts) return '-';
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
  try {
    const d = new Date(`1970-01-01T${String(ts).slice(0,8)}`);
    if (isValid(d)) return format(d, 'h:mm a');
  } catch {}
  return ts;
};

const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(price || 0));

const formatDateLong = (dateLike) => {
  try {
    const d = new Date(dateLike);
    if (!isValid(d)) return String(dateLike);
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch { return String(dateLike || '-'); }
};

const AppointmentDetailsModal = ({ isOpen, onClose, appointment }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingRow, setBookingRow] = useState(null);
  const [test, setTest] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !appointment?.appointmentId && !appointment?.id) return;
      setLoading(true);
      setError('');
      try {
        const id = appointment.appointmentId || appointment.id;
        const { data } = await apiService.bookings.getById(id);
        setBookingRow(data);
        const code = data?.test_code;
        if (code) {
          try {
            const { data: t } = await apiService.tests.getById(code);
            setTest(t);
          } catch { setTest(null); }
        } else {
          setTest(null);
        }
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, appointment]);

  // Extract collection address from special_instructions and return remaining notes
  const { address: collectionAddress, remainingNotes } = useMemo(() => {
    const result = { address: '', remainingNotes: '' };
    const raw = bookingRow?.special_instructions || '';
    if (!raw) return result;
    const parts = String(raw)
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    let address = '';
    const others = [];
    for (const p of parts) {
      const m = p.match(/^Collection Address\s*:\s*(.*)$/i);
      if (m && m[1]) {
        address = m[1].trim();
      } else {
        others.push(p);
      }
    }
    return { address, remainingNotes: others.join(' | ') };
  }, [bookingRow]);

  const formatGender = (g) => {
    const val = String(g || '').toLowerCase();
    if (val === 'male') return 'Male ♂';
    if (val === 'female') return 'Female ♀';
    if (val) return 'Other ⚧';
    return '-';
  };

  const bookingForReceipt = useMemo(() => {
    if (!bookingRow) return null;
  const contactPhone = bookingRow?.patient_phone || bookingRow?.phone || user?.phone || undefined;
  const contactEmail = bookingRow?.patient_email || bookingRow?.email || user?.email || undefined;
    return {
      bookingId: bookingRow.appointment_id,
      selectedDate: bookingRow.appointment_date,
      selectedTimeSlot: bookingRow.appointment_time, // HH:mm:ss is fine; label logic will fallback
      appointmentType: bookingRow.appointment_type,
      address: collectionAddress || '',
      notes: remainingNotes || '',
      totalAmount: bookingRow.total_amount,
      patientName: bookingRow.patient_name,
      patientPhone: contactPhone,
      patientEmail: contactEmail,
    };
  }, [bookingRow, collectionAddress, remainingNotes, user]);

  const handleDownload = async () => {
    if (!bookingForReceipt) return;
    try {
      await generateBookingReceipt({ booking: bookingForReceipt, test: test || { name: bookingRow?.test_name, base_price: bookingRow?.test_price } });
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Failed to generate receipt. Please try again.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Appointment Details" size="lg">
      <Modal.Body>
        {loading ? (
          <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : bookingRow ? (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Booking Details</h3>
                <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  Confirmed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Booking ID</div>
                  <div className="font-mono font-medium">{bookingRow.appointment_id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Amount</div>
                  <div className="font-medium">{formatPrice(bookingRow.total_amount)}</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="font-semibold text-gray-900">{bookingRow.test_name || 'Lab Test'}</div>
                {test?.test_description && (
                  <div className="text-sm text-gray-600 mt-1">{test.test_description}</div>
                )}
              </div>
            </Card>
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Collection Schedule</span>
                </h4>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    bookingRow.appointment_type === 'home_collection'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {bookingRow.appointment_type === 'home_collection' && (
                    <Home className="h-3 w-3 mr-1" />
                  )}
                  {bookingRow.appointment_type === 'home_collection' ? 'Home Collection' : 'Lab Visit'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Date</div>
                    <div className="font-medium">{formatDateLong(bookingRow.appointment_date)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Reporting Time</div>
                    <div className="font-medium">{timeSlotLabel(bookingRow.appointment_time)}</div>
                  </div>
                </div>
              </div>
              {bookingRow.appointment_type === 'home_collection' && (
                <div className="mt-4 flex items-start space-x-3 text-sm text-gray-700">
                  <MapPin className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <div className="text-gray-600">Collection Address</div>
                    <div className="font-medium">{collectionAddress || 'Provided during booking'}</div>
                    {!collectionAddress && (
                      <div className="text-xs text-gray-500">(Address is currently captured in special instructions)</div>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Patient</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Name</div>
                  <div className="font-medium">{bookingRow.patient_name || '-'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Gender</div>
                  <div className="font-medium">{formatGender(bookingRow.patient_gender)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Age</div>
                  <div className="font-medium">{bookingRow.patient_age ?? '-'}</div>
                </div>
              </div>
        {remainingNotes && (
                <div className="mt-3">
                  <div className="text-sm text-gray-600">Notes</div>
          <div className="text-sm">{remainingNotes}</div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="text-gray-600">No details available.</div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={handleDownload} disabled={!bookingForReceipt} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Download Receipt
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AppointmentDetailsModal;
