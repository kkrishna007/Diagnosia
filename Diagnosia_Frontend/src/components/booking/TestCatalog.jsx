import React, { useState, useEffect } from 'react';
import { Search, Filter, TestTube } from 'lucide-react';
import { apiService } from '../../services/api';
import TestCard from './TestCard';
import Input from '../ui/input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

const TestCatalog = ({ onTestSelect }) => {
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([
    { value: 'all', label: 'All Tests' },
  ]);

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-500', label: 'Under ₹500' },
    { value: '500-1000', label: '₹500 - ₹1000' },
    { value: '1000-2000', label: '₹1000 - ₹2000' },
    { value: '2000+', label: 'Above ₹2000' },
  ];

  useEffect(() => {
    fetchTests();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterTests();
  }, [tests, searchTerm, selectedCategory, priceRange]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await apiService.tests.getAll();
      setTests(response.data);
    } catch (err) {
      setError('Failed to load tests. Please try again.');
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.tests.getCategories();
      setCategories([{ value: 'all', label: 'All Tests' }, ...response.data.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) + ' Tests' }))]);
    } catch (err) {
      // fallback to default
    }
  };

  const filterTests = () => {
    let filtered = [...tests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(test => test.category === selectedCategory);
    }

    // Price filter
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(p => parseInt(p) || Infinity);
      filtered = filtered.filter(test => {
        if (priceRange === '2000+') {
          return test.price >= 2000;
        }
        return test.price >= min && test.price < max;
      });
    }

    setFilteredTests(filtered);
  };

  const handleTestSelect = (test) => {
    if (onTestSelect) {
      onTestSelect(test);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchTests}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* Price Filter */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priceRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setPriceRange('all');
            }}
            className="flex items-center justify-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Available Tests ({filteredTests.length})
        </h3>
        {searchTerm && (
          <p className="text-sm text-gray-600">
            Showing results for "{searchTerm}"
          </p>
        )}
      </div>

      {/* Test Grid */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12">
          <TestTube className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
          <p className="text-gray-600">
            Try adjusting your search criteria or browse all available tests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map(test => (
            <TestCard
              key={test.test_code || test.id || test.name || Math.random()}
              test={test}
              onSelect={() => handleTestSelect(test)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TestCatalog;
