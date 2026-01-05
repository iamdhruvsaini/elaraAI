"use client";

import React, { useState } from "react";
import { useGetDashboardQuery, useUpdateProfileMutation } from "@/redux/services/profile/profileService";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  StatsCards,
  SkinAnalysisCard,
  PersonalInfoCard,
  AllergiesCard,
} from "@/components/profile-page";

const ProfilePage = () => {
  const { data: dashboard, isLoading, error, refetch } = useGetDashboardQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    preferred_style: "",
  });

  React.useEffect(() => {
    if (dashboard?.user) {
      setFormData({
        full_name: dashboard.user.full_name || "",
        date_of_birth: "",
        gender: "",
        preferred_style: "",
      });
    }
  }, [dashboard]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      await updateProfile(formData).unwrap();
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      alert(error?.data?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (dashboard?.user) {
      setFormData({
        full_name: dashboard.user.full_name || "",
        date_of_birth: "",
        gender: "",
        preferred_style: "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Failed to load profile data</p>
            <Button onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Profile</h1>
          <p className="text-gray-600">Manage your beauty preferences and information</p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalSessions={dashboard?.stats?.total_sessions || 0}
          productsInVanity={dashboard?.stats?.products_in_vanity || 0}
          upcomingEvents={dashboard?.stats?.upcoming_events || 0}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <PersonalInfoCard
            email={dashboard?.user?.email || ""}
            formData={formData}
            isEditing={isEditing}
            isUpdating={isUpdating}
            onEdit={() => setIsEditing(true)}
            onCancel={handleCancel}
            onSave={handleUpdate}
            onChange={handleChange}
          />

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Skin Analysis Card */}
            <SkinAnalysisCard
              skinTone={dashboard?.user?.profile?.skin_tone}
              undertone={dashboard?.user?.profile?.undertone}
              skinType={dashboard?.user?.profile?.skin_type}
            />

            {/* Allergies Card with Inline Edit */}
            <AllergiesCard
              allergies={dashboard?.user?.profile?.allergies || []}
              sensitivityLevel={dashboard?.user?.profile?.sensitivity_level || "normal"}
              onUpdate={() => refetch()}
            />
          </div>
        </div>

        {/* Progress Complete Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
        </div>
        <p className="text-center text-sm text-gray-600">Profile Setup Complete! 🎉</p>
      </div>
    </div>
  );
};

export default ProfilePage;
