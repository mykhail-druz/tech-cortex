'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import { Setting } from '@/lib/supabase/types';

// Settings Management Page
export default function SettingsManagement() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newSetting, setNewSetting] = useState({
    key: '',
    value: '',
    description: '',
  });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch settings from the database
        const { data, error } = await import('@/lib/supabase/adminDb').then(
          module => module.getSettings()
        );

        if (error) {
          throw error;
        }

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSettings();
    }
  }, [user]);

  // Function to start editing a setting
  const handleEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setEditValue(setting.value);
  };

  // Function to save an edited setting
  const handleSave = async (id: string) => {
    try {
      // Update setting in the database
      const { data, error } = await import('@/lib/supabase/adminDb').then(
        module => module.updateSetting(id, editValue)
      );

      if (error) {
        throw error;
      }

      // Update it in the state
      setSettings(settings.map(setting => 
        setting.id === id 
          ? { ...setting, value: editValue, updated_at: new Date().toISOString() } 
          : setting
      ));

      setEditingId(null);
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  // Function to cancel editing
  const handleCancel = () => {
    setEditingId(null);
  };

  // Function to add a new setting
  const handleAddSetting = async () => {
    try {
      if (!newSetting.key || !newSetting.value) {
        toast.warning('Key and value are required');
        return;
      }

      // Check if key already exists
      if (settings.some(setting => setting.key === newSetting.key)) {
        toast.warning('A setting with this key already exists');
        return;
      }

      // Add setting to the database
      const { data, error } = await import('@/lib/supabase/adminDb').then(
        module => module.createSetting(newSetting)
      );

      if (error) {
        throw error;
      }

      if (data) {
        // Add the new setting to the state
        setSettings([...settings, data]);
        setNewSetting({ key: '', value: '', description: '' });
        setShowNewForm(false);
        toast.success('Setting added successfully');
      }
    } catch (error) {
      console.error('Error adding setting:', error);
      toast.error('Failed to add setting');
    }
  };

  // Function to delete a setting
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this setting?')) {
      try {
        // Delete setting from the database
        const { error } = await import('@/lib/supabase/adminDb').then(
          module => module.deleteSetting(id)
        );

        if (error) {
          throw error;
        }

        // Remove it from the state
        setSettings(settings.filter(setting => setting.id !== id));
        toast.success('Setting deleted successfully');
      } catch (error) {
        console.error('Error deleting setting:', error);
        toast.error('Failed to delete setting');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Site Settings</h1>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {showNewForm ? 'Cancel' : 'Add New Setting'}
        </button>
      </div>

      {/* New Setting Form */}
      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Add New Setting</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="key" className="block text-sm font-medium text-gray-700 mb-1">
                Key *
              </label>
              <input
                type="text"
                id="key"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                placeholder="e.g., site_logo_url"
              />
            </div>
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                Value *
              </label>
              <input
                type="text"
                id="value"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                placeholder="e.g., https://example.com/logo.png"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                id="description"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                placeholder="e.g., URL for the site logo"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddSetting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Save Setting
            </button>
          </div>
        </div>
      )}

      {/* Settings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.length > 0 ? (
                settings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {setting.key}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === setting.id ? (
                        <input
                          type="text"
                          className="w-full p-1 border border-gray-300 rounded-md"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                        />
                      ) : (
                        setting.value
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {setting.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(setting.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === setting.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSave(setting.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(setting)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(setting.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No settings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
