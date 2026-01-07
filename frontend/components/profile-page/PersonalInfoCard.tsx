"use client";

import { Button } from "@/components/ui/button";
import { Calendar, Edit, Loader2, Save, User, X } from "lucide-react";

interface FormData {
  full_name: string;
  date_of_birth: string;
  gender: string;
  preferred_style: string;
}

interface PersonalInfoCardProps {
  email: string;
  formData: FormData;
  isEditing: boolean;
  isUpdating: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export const PersonalInfoCard = ({
  email,
  formData,
  isEditing,
  isUpdating,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: PersonalInfoCardProps) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
            <User className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Personal Info</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={onSave}
              disabled={isUpdating}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Email</label>
          <input
            value={email}
            disabled
            className="w-full h-11 px-3 rounded-xl bg-slate-100 text-slate-500 text-sm border-0"
          />
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Full Name</label>
          <input
            name="full_name"
            value={formData.full_name}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full h-11 px-3 rounded-xl text-sm border transition-all ${
              isEditing 
                ? "bg-white border-slate-200 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400" 
                : "bg-slate-100 border-transparent text-slate-600"
            }`}
          />
        </div>

        {/* Date of Birth */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Date of Birth
          </label>
          <input
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full h-11 px-3 rounded-xl text-sm border transition-all ${
              isEditing 
                ? "bg-white border-slate-200 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400" 
                : "bg-slate-100 border-transparent text-slate-600"
            }`}
          />
        </div>

        {/* Gender */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full h-11 px-3 rounded-xl text-sm border transition-all ${
              isEditing 
                ? "bg-white border-slate-200 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400" 
                : "bg-slate-100 border-transparent text-slate-600"
            }`}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-binary</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        {/* Preferred Style */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500">Preferred Style</label>
          <select
            name="preferred_style"
            value={formData.preferred_style}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full h-11 px-3 rounded-xl text-sm border transition-all ${
              isEditing 
                ? "bg-white border-slate-200 focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400" 
                : "bg-slate-100 border-transparent text-slate-600"
            }`}
          >
            <option value="">Select style</option>
            <option value="natural">Natural</option>
            <option value="glamorous">Glamorous</option>
            <option value="bold">Bold</option>
            <option value="minimal">Minimal</option>
            <option value="artistic">Artistic</option>
            <option value="classic">Classic</option>
          </select>
        </div>
      </div>
    </div>
  );
};
