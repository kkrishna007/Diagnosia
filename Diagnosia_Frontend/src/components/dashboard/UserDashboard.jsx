import { apiService } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, TestTube, FileText, Clock, User, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import AppointmentList from './AppointmentList';
import TestResults from './TestResults';
import Modal from '../ui/Modal';
import Input from '../ui/input';
import { formatDate, formatName, formatPhoneNumber } from '../../utils/helpers';

const UserDashboard = () => {
  const { user, updateUser } = useAuth();
  const firstName = user?.first_name || user?.firstName || 'User';
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentResults: [],
    pendingReports: [],
    stats: {
      totalTests: 0,
      pendingAppointments: 0,
      completedTests: 0,
      pendingReports: 0,
    }
  });
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    email: '',
  });
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['overview','appointments','results'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    // Sync form with user context when modal opens
    if (isEditOpen && user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        // Ensure date input as YYYY-MM-DD
        date_of_birth: user.date_of_birth ? new Date(user.date_of_birth).toISOString().slice(0, 10) : '',
        phone: user.phone || '',
        email: user.email || '',
      });
      setSaveError('');
    }
  }, [isEditOpen, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch from backend
      const [appointmentsRes, resultsRes, profileRes] = await Promise.all([
        apiService.users.getAppointments(),
        apiService.users.getTestResults(),
        apiService.users.getProfile().catch(() => null),
      ]);
      const upcomingAppointments = appointmentsRes.data || [];
      const recentResults = resultsRes.data || [];
      if (profileRes?.data) {
        // Keep global auth user in sync with latest profile
        updateUser(profileRes.data);
      }
      setDashboardData({
        upcomingAppointments,
        recentResults,
        pendingReports: [], // You can add logic to filter pending reports from results if needed
        stats: {
          totalTests: recentResults.length,
          pendingAppointments: upcomingAppointments.length,
          completedTests: recentResults.length,
          pendingReports: 0,
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    setSaveError('');
    try {
      const payload = {
        first_name: form.first_name?.trim(),
        last_name: form.last_name?.trim(),
        phone: form.phone?.trim(),
        date_of_birth: form.date_of_birth || null,
      };
      const res = await apiService.users.updateProfile(payload);
      // Update global auth user and close modal
      updateUser(res.data);
      setIsEditOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'results', label: 'Test Results', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your health monitoring journey.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <TestTube className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalTests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingAppointments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedTests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reports</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingReports}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">Full Name:</span>
                  <span className="text-gray-600">{formatName(user?.first_name, user?.last_name)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">Date of Birth:</span>
                  <span className="text-gray-600">{user?.date_of_birth ? formatDate(user.date_of_birth, 'PPP') : '-'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">Phone:</span>
                  <span className="text-gray-600">{formatPhoneNumber(user?.phone)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700 font-medium">Email:</span>
                  <span className="text-gray-600">{user?.email}</span>
                </div>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => setIsEditOpen(true)}>
                Edit Profile
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{appointment.testName}</p>
                      <p className="text-sm text-gray-600">{appointment.date} • {appointment.timeSlot}</p>
                    </div>
                  </div>
                ))}
                {dashboardData.recentResults.slice(0, 2).map((result) => (
                  <div key={result.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.testName}</p>
                      <p className="text-sm text-gray-600">Report available</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'appointments' && (
        <AppointmentList 
          appointments={dashboardData.upcomingAppointments}
          pendingReports={dashboardData.pendingReports}
          onRefresh={fetchDashboardData}
        />
      )}

      {activeTab === 'results' && (
        <TestResults 
          results={dashboardData.recentResults}
          onRefresh={fetchDashboardData}
        />
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Profile" size="md">
        <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
          {saveError && (
            <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200 text-sm">{saveError}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <Input id="first_name" name="first_name" type="text" value={form.first_name} onChange={handleFormChange} required disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <Input id="last_name" name="last_name" type="text" value={form.last_name} onChange={handleFormChange} disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <Input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleFormChange} disabled={isSaving} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleFormChange} disabled={isSaving} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (read-only)</label>
              <Input id="email" name="email" type="email" value={form.email} disabled />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserDashboard;
