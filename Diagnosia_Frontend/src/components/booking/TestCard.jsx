import React from 'react';
import { Clock, TestTube, Star, ArrowRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const TestCard = ({ test, onSelect }) => {

  // Defensive helpers for missing/null fields
  const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCategoryColor = (category) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    const colors = {
      blood: 'bg-red-100 text-red-800',
      urine: 'bg-yellow-100 text-yellow-800',
      imaging: 'bg-blue-100 text-blue-800',
      package: 'bg-green-100 text-green-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Defensive: fallback values for missing fields
  const category = test.category || test.category_name || '';
  const testName = test.name || test.test_name || 'Untitled Test';
  const testDescription = test.description || test.test_description || '';
  const sampleType = test.sampleType || test.sample_type || '';
  // Always show base_price from backend as the main price
  const price = test.base_price ? Number(test.base_price) : (test.price || 0);
  const fastingRequired = test.fastingRequired || test.fasting_required || false;
  const parameters = test.parameters || '';
  const reportTime = test.report_time_hours != null
    ? `${test.report_time_hours} hours`
    : '24 hours';

  return (
    <Card className="h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TestTube className="h-5 w-5 text-blue-600" />
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Other'}
            </span>
          </div>
          {test.isPopular && (
            <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 rounded-full">
              <Star className="h-3 w-3 text-orange-600 fill-current" />
              <span className="text-xs font-medium text-orange-600">Popular</span>
            </div>
          )}
        </div>

        {/* Test Name and Description */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {testName}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {testDescription}
        </p>

        {/* Test Details */}
        <div className="space-y-2 mb-4">
          {parameters && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Parameters:</span> {parameters} tests
            </div>
          )}
          {fastingRequired && (
            <div className="text-sm text-amber-600 font-medium">
              ⚠️ Fasting required
            </div>
          )}
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Results in {reportTime}</span>
          </div>
        </div>

        {/* Sample Requirements */}
        {sampleType && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Sample:</span>
              <span className="text-gray-600 ml-1">{sampleType}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(price)}
            </span>
            {test.originalPrice && test.originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(test.originalPrice)}
              </span>
            )}
          </div>
          {test.originalPrice && test.originalPrice > price && (
            <span className="text-sm font-medium text-green-600">
              {Math.round((1 - price / test.originalPrice) * 100)}% OFF
            </span>
          )}
        </div>

        <Button
          onClick={onSelect}
          className="w-full flex items-center justify-center space-x-2"
        >
          <span>Book Now</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default TestCard;
