import React, { useState } from 'react';
import { FileText, Download, Eye, Calendar, Share2, Search } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/input';
import Modal from '../ui/Modal';
import { useAuth } from '../../hooks/useAuth';

const TestResults = ({ results, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Be defensive: results may be undefined or contain unexpected shapes coming from the API.
  const filteredResults = Array.isArray(results)
    ? results.filter((result) => {
        const name = (result?.testName || result?.test_name || '').toString().toLowerCase();
        const booking = (result?.bookingId || result?.booking_id || '').toString().toLowerCase();
        const term = (searchTerm || '').toString().toLowerCase();
        return name.includes(term) || booking.includes(term);
      })
    : [];

  const formatDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const d = new Date(dateString);
      if (isNaN(d)) return '-';
      return format(d, 'MMM d, yyyy');
    } catch (e) {
      return '-';
    }
  };

  const handleViewReport = (result) => {
    if (!result) return;
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

  const { user } = useAuth();

  // Derive a display model from the selectedResult (DB row). Uses fallbacks when fields are missing.
  const buildReportData = (res) => {
    if (!res) return null;
    const patientInfo = {
      name: `${user?.first_name || user?.firstName || ''} ${user?.last_name || ''}`.trim() || 'Patient',
      age: user?.date_of_birth ? Math.max(0, new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()) : undefined,
      gender: user?.gender || user?.sex || '-',
      sampleId: res.sample_code || res.sample_id || '-',
      collectionDate: res.collected_at || res.collection_date || '-',
      reportDate: res.processed_at || res.processedAt || res.processed_at || null,
    };

    const values = res.result_values || {};
    const refParams = (res.reference_ranges && res.reference_ranges.parameters) || [];
    // If reference param defs available, use them to preserve ordering and units/labels
    let testParameters = [];
    if (Array.isArray(refParams) && refParams.length > 0) {
      testParameters = refParams.map((p) => {
        const key = p.key || p.label || p.name;
        const raw = values[key];
        const flagObj = (res.abnormal_flags && res.abnormal_flags[key]) || {};
        return {
          key,
          parameter: p.label || p.name || key,
          result: raw === undefined || raw === null ? '-' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw)),
          unit: p.unit || '',
          referenceRange: (() => {
            try {
              if (p.range) {
                if (p.range.low != null || p.range.high != null) return `${p.range.low ?? ''}-${p.range.high ?? ''}`;
                const male = p.range.male ? `${p.range.male.low ?? ''}-${p.range.male.high ?? ''}` : null;
                const female = p.range.female ? `${p.range.female.low ?? ''}-${p.range.female.high ?? ''}` : null;
                if (male || female) return `M:${male || '-'} F:${female || '-'}`;
              }
            } catch (e) {}
            return p.referenceRange || '';
          })(),
          flag: flagObj.flag || 'normal',
          status: flagObj.flag === 'normal' ? 'Normal' : (flagObj.flag === 'high' ? 'High' : (flagObj.flag === 'low' ? 'Low' : (flagObj.flag || ''))),
        };
      });
    } else {
      // Fallback: iterate keys from result_values
      testParameters = Object.keys(values || {}).map((k) => {
        const raw = values[k];
        const flagObj = (res.abnormal_flags && res.abnormal_flags[k]) || {};
        return {
          key: k,
          parameter: k,
          result: raw === undefined || raw === null ? '-' : (typeof raw === 'object' ? JSON.stringify(raw) : String(raw)),
          unit: '',
          referenceRange: '',
          flag: flagObj.flag || 'normal',
          status: flagObj.flag === 'normal' ? 'Normal' : (flagObj.flag === 'high' ? 'High' : (flagObj.flag === 'low' ? 'Low' : (flagObj.flag || ''))),
        };
      });
    }

    return {
      patientInfo,
      testParameters,
      doctorComments: res.interpretation || res.recommendations || '',
      labInfo: {
        name: 'Diagnosia Lab',
        address: 'N/A',
        phone: '',
      }
    };
  };

  // Compute once for rendering to avoid repeated calls and to provide a stable object in JSX
  const currentReportData = selectedResult ? buildReportData(selectedResult) : null;

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
            <Card key={result?.id || `${result?.bookingId || 'r'}-${Math.random()}`} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.testName || result.test_name || result.name || 'Test'}</h3>
                      <p className="text-sm text-gray-600">Report ID: {result.bookingId || result.booking_id || result.id || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Test Date:</span>
                      <div className="font-medium text-gray-900">{
                        formatDate(
                          result.appointment_date || result.appointmentDate || result.test_date || result.date || result.collection_date || result.created_at
                        )
                      }</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="font-medium text-green-600">Completed</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Report Date:</span>
                      <div className="font-medium text-gray-900">{
                        formatDate(
                          result.processed_at || result.reportDate || result.reported_at || result.completed_at || result.created_at
                        )
                      }</div>
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
      <div className="space-y-6 p-6">
            {/* Report Header */}
            <div className="text-center border-b pb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedResult.testName || selectedResult.test_name || selectedResult.testCode || selectedResult.test_code}</h2>
              <p className="text-gray-600 mt-1">Laboratory Report</p>
            </div>

            {/* Patient & Lab Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Patient Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.name || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Age:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.age ? `${currentReportData.patientInfo.age} years` : '-'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.gender || '-'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Sample Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Sample ID:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.sampleId || '-'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Collection:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.collectionDate ? formatDate(currentReportData.patientInfo.collectionDate) : '-'}</span>
                    </div>
                    <div className="grid grid-cols-2">
                      <span className="text-gray-600">Report Date:</span>
                      <span className="font-medium">{currentReportData?.patientInfo?.reportDate ? formatDate(currentReportData.patientInfo.reportDate) : formatDate(selectedResult.processed_at || selectedResult.processedAt || selectedResult.reported_at || selectedResult.created_at)}</span>
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
                    {(() => {
                      const params = currentReportData?.testParameters || [];
                      return params.map((param, index) => (
                        <tr key={param.key || index}>
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
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Doctor Comments */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Doctor's Comments</h4>
              <p className="text-blue-800 text-sm">{selectedResult?.interpretation || selectedResult?.recommendations || '-'}</p>
            </div>

            {/* Lab Information */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p className="font-medium">{currentReportData?.labInfo?.name || 'Diagnosia Lab'}</p>
              <p>{currentReportData?.labInfo?.address || ''}</p>
              <p>Phone: {currentReportData?.labInfo?.phone || ''}</p>
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
