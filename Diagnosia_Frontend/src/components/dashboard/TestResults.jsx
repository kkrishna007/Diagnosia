import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, Share2, Search } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/input';
import Modal from '../ui/Modal';

const TestResults = ({ results, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const filteredResults = results.filter(result =>
    result.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.bookingId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleViewReport = (result) => {
    setSelectedResult(result);
    setShowReportModal(true);
  };

  const handleDownloadReport = (result) => {
    // Simulate download
    console.log(`Downloading report for ${result.testName}`);
    // In a real app, this would trigger a file download
  };

  const handleShareReport = (result) => {
    if (navigator.share) {
      navigator.share({
        title: `${result.testName} Report`,
        text: `Lab test report for ${result.testName}`,
        url: result.reportUrl,
      });
    } else {
      navigator.clipboard.writeText(result.reportUrl);
      alert('Report link copied to clipboard!');
    }
  };

  // Mock report data for demonstration
  const mockReportData = {
    patientInfo: {
      name: 'John Doe',
      age: 32,
      gender: 'Male',
      sampleId: 'SAM123456',
      collectionDate: '2025-08-10',
      reportDate: '2025-08-11',
    },
    testParameters: [
      {
        parameter: 'Glucose (Fasting)',
        result: '95',
        unit: 'mg/dL',
        referenceRange: '70-100',
        status: 'Normal',
        flag: 'normal'
      },
      {
        parameter: 'HbA1c',
        result: '5.2',
        unit: '%',
        referenceRange: '<5.7',
        status: 'Normal',
        flag: 'normal'
      },
    ],
    doctorComments: 'All parameters are within normal limits. Continue with current lifestyle.',
    labInfo: {
      name: 'Diagnosia Lab',
      address: '123 Medical Plaza, Health District, New Delhi',
      phone: '+91 98765 43210',
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl font-semibold text-gray-900">Test Results</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search results..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Results List */}
      {filteredResults.length === 0 ? (
        <Card className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No matching results found' : 'No test results available'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search criteria'
              : 'Your completed test reports will appear here'
            }
          </p>
          {!searchTerm && (
            <Button onClick={() => window.location.href = '/tests'}>
              Book a Test
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredResults.map((result) => (
            <Card key={result.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.testName}</h3>
                      <p className="text-sm text-gray-600">Report ID: {result.bookingId}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Test Date:</span>
                      <div className="font-medium text-gray-900">{formatDate(result.date)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="font-medium text-green-600">Completed</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Report Generated:</span>
                      <div className="font-medium text-gray-900">{formatDate(result.date)}</div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-800 font-medium">
                        Report ready for download
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-6">
                  <Button
                    size="sm"
                    onClick={() => handleViewReport(result)}
                    className="flex items-center space-x-2 whitespace-nowrap"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Report</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(result)}
                    className="flex items-center space-x-2 whitespace-nowrap"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShareReport(result)}
                    className="flex items-center space-x-2 whitespace-nowrap"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Report Viewer Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Test Report"
        size="xl"
      >
        {selectedResult && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedResult.testName}</h2>
              <p className="text-gray-600 mt-1">Laboratory Report</p>
            </div>

            {/* Patient & Lab Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{mockReportData.patientInfo.name}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Age:</span>
                    <span className="font-medium">{mockReportData.patientInfo.age} years</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Gender:</span>
                    <span className="font-medium">{mockReportData.patientInfo.gender}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Sample Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Sample ID:</span>
                    <span className="font-medium">{mockReportData.patientInfo.sampleId}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Collection:</span>
                    <span className="font-medium">{formatDate(mockReportData.patientInfo.collectionDate)}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="text-gray-600">Report Date:</span>
                    <span className="font-medium">{formatDate(mockReportData.patientInfo.reportDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Results */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Parameter</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Result</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Unit</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Reference Range</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockReportData.testParameters.map((param, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 font-medium text-gray-900">{param.parameter}</td>
                        <td className="px-4 py-3 font-medium">{param.result}</td>
                        <td className="px-4 py-3 text-gray-600">{param.unit}</td>
                        <td className="px-4 py-3 text-gray-600">{param.referenceRange}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            param.flag === 'normal' 
                              ? 'bg-green-100 text-green-800'
                              : param.flag === 'high'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {param.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor Comments */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Doctor's Comments</h4>
              <p className="text-blue-800 text-sm">{mockReportData.doctorComments}</p>
            </div>

            {/* Lab Information */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p className="font-medium">{mockReportData.labInfo.name}</p>
              <p>{mockReportData.labInfo.address}</p>
              <p>Phone: {mockReportData.labInfo.phone}</p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleDownloadReport(selectedResult)}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </Button>
              <Button onClick={() => setShowReportModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestResults;
