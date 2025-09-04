import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from 'date-fns';
import Button from '../ui/Button';

const TimeSlotPicker = ({ onTimeSlotSelect, selectedDate, selectedTimeSlot }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(selectedDate ? new Date(selectedDate) : null);
  
  // Available time slots
  const timeSlots = [
    { id: '6-8', label: '6:00 AM - 8:00 AM', available: true },
    { id: '8-10', label: '8:00 AM - 10:00 AM', available: true },
    { id: '10-12', label: '10:00 AM - 12:00 PM', available: true },
    { id: '12-14', label: '12:00 PM - 2:00 PM', available: true },
    { id: '14-16', label: '2:00 PM - 4:00 PM', available: true },
    { id: '16-18', label: '4:00 PM - 6:00 PM', available: true },
    { id: '18-20', label: '6:00 PM - 8:00 PM', available: false }, // Example of unavailable slot
  ];

  // Generate week days starting from today
  const getWeekDays = (startDate) => {
    const start = startOfWeek(startDate, { weekStartsOn: 1 }); // Start from Monday
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      // Only show dates from today onwards
      if (!isBefore(day, new Date().setHours(0, 0, 0, 0))) {
        days.push(day);
      }
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeek);

  const handleDaySelect = (day) => {
    setSelectedDay(day);
    // Clear selected time slot when changing date
    if (onTimeSlotSelect) {
      onTimeSlotSelect(format(day, 'yyyy-MM-dd'), '');
    }
  };

  const handleTimeSlotSelect = (timeSlot) => {
    if (!selectedDay || !timeSlot.available) return;
    
    if (onTimeSlotSelect) {
      onTimeSlotSelect(format(selectedDay, 'yyyy-MM-dd'), timeSlot.id);
    }
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };

  const isPastWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return isBefore(addDays(weekStart, 6), today);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Select Date</span>
        </h4>
        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPreviousWeek}
            disabled={isPastWeek()}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {format(weekDays[0], 'MMM yyyy')}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToNextWeek}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        {Array.from({ length: 7 }, (_, i) => {
          const dayIndex = weekDays.findIndex(day => 
            day.getDay() === (i + 1) % 7
          );
          const day = dayIndex !== -1 ? weekDays[dayIndex] : null;
          
          if (!day) {
            return <div key={i} className="p-2"></div>;
          }

          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isCurrentDay = isToday(day);
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDaySelect(day)}
              className={`
                p-3 text-sm rounded-lg transition-colors
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : isCurrentDay
                  ? 'bg-blue-100 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDay && (
        <div className="space-y-3">
          <h4 className="text-lg font-medium text-gray-900">
            Available Time Slots for {format(selectedDay, 'EEEE, MMM d')}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => handleTimeSlotSelect(slot)}
                disabled={!slot.available}
                className={`
                  p-3 text-sm rounded-lg border transition-colors text-center
                  ${selectedTimeSlot === slot.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : slot.available
                    ? 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  }
                `}
              >
                <div className="font-medium">{slot.label}</div>
                {!slot.available && (
                  <div className="text-xs mt-1">Not Available</div>
                )}
              </button>
            ))}
          </div>
          
          {selectedTimeSlot && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                <strong>Selected:</strong> {format(selectedDay, 'EEEE, MMM d, yyyy')} at{' '}
                {timeSlots.find(slot => slot.id === selectedTimeSlot)?.label}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <h5 className="font-medium text-amber-800 mb-2">Collection Instructions:</h5>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Our phlebotomist will arrive at your selected time slot</li>
          <li>• Please be available 15 minutes before the scheduled time</li>
          <li>• Ensure the collection address is easily accessible</li>
          <li>• For fasting tests, maintain the required fasting period</li>
        </ul>
      </div>
    </div>
  );
};

export default TimeSlotPicker;
