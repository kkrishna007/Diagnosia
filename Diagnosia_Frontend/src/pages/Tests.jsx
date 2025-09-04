import React from 'react';
import TestCatalog from '../components/booking/TestCatalog';
import { useNavigate } from 'react-router-dom';

const Tests = () => {
  const navigate = useNavigate();

  const handleTestSelect = (test) => {
    navigate('/booking', { state: { selectedTest: test } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Tests</h1>
          <p className="text-gray-600">
            Choose from our comprehensive range of diagnostic tests and health packages
          </p>
        </div>
        
        <TestCatalog onTestSelect={handleTestSelect} />
      </div>
    </div>
  );
};

export default Tests;
