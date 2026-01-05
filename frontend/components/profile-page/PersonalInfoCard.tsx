"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <Card className="lg:col-span-2 shadow-xl border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-purple-600" />
            <CardTitle className="text-2xl">Personal Information</CardTitle>
          </div>
          {!isEditing ? (
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={onSave}
                disabled={isUpdating}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Email</Label>
          <Input value={email} disabled className="bg-gray-50" />
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
            Full Name
          </Label>
          <Input
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={onChange}
            disabled={!isEditing}
            className={!isEditing ? "bg-gray-50" : ""}
          />
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label
            htmlFor="date_of_birth"
            className="text-sm font-medium text-gray-700 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Date of Birth
          </Label>
          <Input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={onChange}
            disabled={!isEditing}
            className={!isEditing ? "bg-gray-50" : ""}
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
            Gender
          </Label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              !isEditing ? "bg-gray-50" : ""
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
        <div className="space-y-2">
          <Label htmlFor="preferred_style" className="text-sm font-medium text-gray-700">
            Preferred Style
          </Label>
          <select
            id="preferred_style"
            name="preferred_style"
            value={formData.preferred_style}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              !isEditing ? "bg-gray-50" : ""
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
      </CardContent>
    </Card>
  );
};
