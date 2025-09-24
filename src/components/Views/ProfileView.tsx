import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase'; // your firebase config file
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const ProfileView: React.FC = () => {
  const { user } = useAuth(); // user comes from Firebase Auth (uid, email, etc.)
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  // Fetch profile from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setProfile(snap.data());
          setFormData({ name: snap.data().name || '' });
        } else {
          // if no profile, create a default one
          setProfile({ name: '', createdAt: user.metadata.creationTime });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, [user]);

  // Save profile updates
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const ref = doc(db, 'users', user.uid);
      await updateDoc(ref, { name: formData.name });
      setProfile((prev: any) => ({ ...prev, name: formData.name }));
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: profile?.name || '' });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Avatar */}
          <div className="flex justify-center lg:justify-start mb-6 lg:mb-0">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl font-bold text-white">
                {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
                <p className="text-gray-600">Update your account details here</p>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 sm:mt-0 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile?.name || 'Not set'}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{user?.email}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed through this interface
                </p>
              </div>

              {/* Member Since */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {user?.metadata?.creationTime
                      ? formatDate(user.metadata.creationTime)
                      : 'Loading...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-xl font-bold text-green-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-teal-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-xl font-bold text-gray-900">Today</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
