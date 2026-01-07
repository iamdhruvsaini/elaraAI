"use client";

import React, { useState } from "react";
import { useGetDashboardQuery, useUpdateProfileMutation } from "@/redux/services/profile/profileService";
import { Loader2, AlertCircle, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  StatsCards,
  SkinAnalysisCard,
  PersonalInfoCard,
  AllergiesCard,
} from "@/components/profile-page";

const ProfilePage = () => {
  const { data: dashboard, isLoading, error, refetch } = useGetDashboardQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const router = useRouter();

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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Oops!</h2>
          <p className="text-slate-500 mb-6">Failed to load profile data</p>
          <Button 
            onClick={() => refetch()} 
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="w-full max-w-[440px] mx-auto px-4 pb-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={() => router.push("/home")}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Your Profile</h1>
              <p className="text-sm text-slate-500">Manage your preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-200 mb-3">
            <span className="text-2xl font-bold text-white">
              {dashboard?.user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-800">{dashboard?.user?.full_name || "User"}</h2>
          <p className="text-sm text-slate-500">{dashboard?.user?.email}</p>
        </div>

        {/* Stats Cards */}
        <StatsCards
          totalSessions={dashboard?.stats?.total_sessions || 0}
          productsInVanity={dashboard?.stats?.products_in_vanity || 0}
          upcomingEvents={dashboard?.stats?.upcoming_events || 0}
        />

        {/* Personal Info */}
        <div className="space-y-4 mt-6">
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

          {/* Skin Analysis */}
          <SkinAnalysisCard
            skinTone={dashboard?.user?.profile?.skin_tone}
            undertone={dashboard?.user?.profile?.undertone}
            skinType={dashboard?.user?.profile?.skin_type}
          />

          {/* Allergies */}
          <AllergiesCard
            allergies={dashboard?.user?.profile?.allergies || []}
            sensitivityLevel={dashboard?.user?.profile?.sensitivity_level || "normal"}
            onUpdate={() => refetch()}
          />
        </div>

        {/* Complete Badge */}
        <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <p className="text-sm font-medium text-emerald-700">Profile Setup Complete! 🎉</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
