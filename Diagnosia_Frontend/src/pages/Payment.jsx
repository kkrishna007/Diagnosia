import React, { useState, useMemo } from 'react';
import { useEffect } from 'react';
import InputMask from 'react-input-mask';
import { format } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import paymentQr from '../assets/payment_qr.jpg';

const currency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
};

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state?.bookingData;

  // derive a storage key scoped to this booking (fallback to generic)
  const bookingKey = bookingData?.booking?.id ? `diagnosia_payment_done_${bookingData.booking.id}` : 'diagnosia_payment_done_latest';

  useEffect(() => {
    // If this booking is already marked done, redirect to booking-success (replace so Back doesn't return)
    try {
      const done = localStorage.getItem(bookingKey);
      if (done === '1') {
        navigate('/booking-success', { replace: true, state: { bookingData } });
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [bookingKey]);

  // Fallback amount and labels if bookingData is not present
  const testName = bookingData?.test?.name || bookingData?.test?.test_name || bookingData?.booking?.test_name || 'Lab Test';
  const amount = bookingData?.booking?.totalAmount || bookingData?.booking?.totalAmount || bookingData?.booking?.total_amount || 499;
  const apptDateRaw = bookingData?.booking?.selectedDate || bookingData?.booking?.appointment_date || '';
  const apptTimeRaw = bookingData?.booking?.selectedTimeSlot || bookingData?.booking?.appointment_time || '';

  const formatDate = (d) => {
    try {
      if (!d) return '';
      const dt = new Date(d);
      if (!isNaN(dt)) return format(dt, 'EEEE, MMM d, yyyy');
    } catch (e) {}
    return d;
  };

  const getTimeLabel = (timeSlotOrTime) => {
    const map = {
      '6-8': '6:00 AM - 8:00 AM',
      '8-10': '8:00 AM - 10:00 AM',
      '10-12': '10:00 AM - 12:00 PM',
      '12-14': '12:00 PM - 2:00 PM',
      '14-16': '2:00 PM - 4:00 PM',
      '16-18': '4:00 PM - 6:00 PM',
      '18-20': '6:00 PM - 8:00 PM',
    };
    if (map[timeSlotOrTime]) return map[timeSlotOrTime];
    // If time string like '18:30:00' or ISO time
    try {
      if (!timeSlotOrTime) return '';
      const t = new Date(timeSlotOrTime);
      if (!isNaN(t)) return format(t, 'h:mm a');
    } catch (e) {}
    return timeSlotOrTime;
  };

  const [method, setMethod] = useState('card');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  // expiry in MM/YYYY format
  const [expiry, setExpiry] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI
  const [upiId, setUpiId] = useState('');

  // Netbanking
  const [bank, setBank] = useState('HDFC');

  // Wallets
  const [wallet, setWallet] = useState('Paytm');

  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null); // null | 'success' | 'failed'

  const showAmount = useMemo(() => currency(amount), [amount]);

  const simulateProcessing = () => {
    setProcessing(true);
    // Simulate 2-3 seconds then always succeed (demo)
    const delay = 2000 + Math.floor(Math.random() * 1000);
    setTimeout(() => {
      setProcessing(false);
      // Always proceed to success in demo mode
      try {
        // mark this booking as paid so /payment is not revisitable
        localStorage.setItem(bookingKey, '1');
      } catch (e) {}
      // replace so Back button won't return to payment
      navigate('/booking-success', { replace: true, state: { bookingData } });
    }, delay);
  };

  const handlePay = (e) => {
    e.preventDefault();
    // Basic validation per method
    if (method === 'card') {
      // basic presence
      if (!cardNumber || expiry.length !== 7 || !cvv || !cardName) {
        if (expiry.length !== 7) setExpiryError('Expiry must be in MM/YYYY');
        return;
      }
      // validate expiry
      const [mmStr, yyyyStr] = expiry.split('/');
      const mm = Number(mmStr);
      const yyyy = Number(yyyyStr);
      const curYear = new Date().getFullYear();
      if (!mm || mm < 1 || mm > 12) {
        setExpiryError('Enter a valid month (01-12)');
        return;
      }
      if (!yyyyStr || yyyyStr.length !== 4 || yyyy < curYear) {
        setExpiryError('Card has expired');
        return;
      }
      // clear expiry error if we pass validation
      setExpiryError('');
    } else if (method === 'upi') {
      if (!upiId) return;
    }
    simulateProcessing();
  };

  const handleRetry = () => {
    setStatus(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center space-x-3">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="text-sm text-gray-600">Secure Payment Gateway</div>
                <div className="font-semibold">Diagnosia Pay</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">Demo Mode</div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Order Summary</div>
                <div className="mt-3">
                  <div className="font-medium text-gray-900">{testName}</div>
                  <div className="text-sm text-gray-600 mt-1">{formatDate(apptDateRaw)} {getTimeLabel(apptTimeRaw)}</div>
                </div>
                <div className="mt-4 border-t pt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">Total</div>
                  <div className="text-lg font-semibold text-gray-900">{showAmount}</div>
                </div>
              </div>
            </div>

            {/* Payment area */}
            <div className="md:col-span-2">
              <div className="bg-white">
                {/* Tabs */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => setMethod('card')} className={`px-4 py-2 rounded-md ${method === 'card' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Card</button>
                  <button onClick={() => setMethod('upi')} className={`px-4 py-2 rounded-md ${method === 'upi' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>UPI</button>
                  <button onClick={() => setMethod('netbanking')} className={`px-4 py-2 rounded-md ${method === 'netbanking' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Netbanking</button>
                  <button onClick={() => setMethod('wallets')} className={`px-4 py-2 rounded-md ${method === 'wallets' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Wallets</button>
                </div>

                {/* Payment Forms */}
                <div className="p-4 border rounded-lg">
                  <form onSubmit={handlePay} className="space-y-4">
                      {method === 'card' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">Card Payment</div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded">Visa</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">Mastercard</span>
                              <span className="px-2 py-1 bg-gray-100 rounded">RuPay</span>
                            </div>
                          </div>

                          <div className="mb-3">
                              <label className="block text-sm text-gray-600">Card Number</label>
                            <input
                              value={cardNumber}
                              onChange={(e) => {
                                // keep only digits
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                                // group into 4s
                                const formatted = digits.replace(/(.{4})/g, '$1 ').trim();
                                setCardNumber(formatted);
                              }}
                              placeholder="XXXX XXXX XXXX XXXX"
                              inputMode="numeric"
                              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex flex-col md:flex-row md:items-center gap-3">
                            <div className="flex-shrink-0 w-full md:w-36">
                              <label className="block text-sm text-gray-600">Expiry</label>
                              <InputMask
                                mask="99/9999"
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value)}
                                placeholder="MM/YYYY"
                                inputMode="numeric"
                              >
                                {(inputProps) => (
                                  <input {...inputProps} className="mt-1 w-full px-3 py-2 border rounded-md" />
                                )}
                              </InputMask>
                              {expiryError && <p className="text-xs text-red-600 mt-1">{expiryError}</p>}
                            </div>

                            <div className="flex-shrink-0 w-full md:w-24">
                              <label className="block text-sm text-gray-600">CVV</label>
                              <input
                                value={cvv}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                                  setCvv(digits);
                                }}
                                placeholder="***"
                                inputMode="numeric"
                                maxLength={3}
                                type="password"
                                autoComplete="cc-csc"
                                className="mt-1 w-full px-3 py-2 border rounded-md"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <label className="block text-sm text-gray-600">Name on Card</label>
                              <input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="CARDHOLDER NAME" className="mt-1 w-full px-3 py-2 border rounded-md min-w-0" />
                            </div>
                          </div>
                        </div>
                      )}

                      {method === 'upi' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">Pay with UPI</div>
                            <div className="text-sm text-gray-500">Scan QR or enter UPI ID</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-600">UPI ID</label>
                              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="example@upi" className="mt-1 w-full px-3 py-2 border rounded-md" />
                            </div>
                            <div className="flex items-center justify-center">
                              <img src={paymentQr || '/payment-qr.png'} alt="Payment QR" className="w-28 h-28 object-cover rounded" />
                            </div>
                          </div>
                        </div>
                      )}

                      {method === 'netbanking' && (
                        <div>
                          <label className="block text-sm text-gray-600">Choose Bank</label>
                          <select value={bank} onChange={(e) => setBank(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md">
                            <option>HDFC Bank</option>
                            <option>ICICI Bank</option>
                            <option>SBI</option>
                            <option>Axis Bank</option>
                          </select>
                        </div>
                      )}

                      {method === 'wallets' && (
                        <div>
                          <div className="flex gap-3 items-center">
                            <button type="button" onClick={() => setWallet('Paytm')} className={`px-3 py-2 rounded ${wallet === 'Paytm' ? 'ring-2 ring-indigo-300' : 'bg-gray-100'}`}>Paytm</button>
                            <button type="button" onClick={() => setWallet('PhonePe')} className={`px-3 py-2 rounded ${wallet === 'PhonePe' ? 'ring-2 ring-indigo-300' : 'bg-gray-100'}`}>PhonePe</button>
                            <button type="button" onClick={() => setWallet('Amazon Pay')} className={`px-3 py-2 rounded ${wallet === 'Amazon Pay' ? 'ring-2 ring-indigo-300' : 'bg-gray-100'}`}>Amazon Pay</button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 rounded-md bg-white border">Cancel / Go Back</button>
                        <button type="submit" disabled={processing} className="px-6 py-2 rounded-md bg-indigo-600 text-white">
                          {processing ? 'Processing Payment…' : `Pay ${showAmount}`}
                        </button>
                      </div>
                    </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
