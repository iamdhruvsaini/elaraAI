"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSetupProfileMutation } from "@/redux/services/profile/profileService";
import { Loader2, User, Calendar, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ProfileSetupPage = () => {
  const router = useRouter();
  const [setupProfile, { isLoading }] = useSetupProfileMutation();

  const [faceAnalysis, setFaceAnalysis] = useState<any>(null);
  const [formData, setFormData] = useState({
    date_of_birth: "",
    gender: "",
    preferred_style: "",
  });

  useEffect(() => {
    // Get face analysis data from sessionStorage
    const analysisData = sessionStorage.getItem("faceAnalysis");
    if (analysisData) {
      setFaceAnalysis(JSON.parse(analysisData));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const profileData = {
        skin_tone: faceAnalysis?.skin_tone,
        undertone: faceAnalysis?.undertone,
        skin_type: faceAnalysis?.skin_type,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || undefined,
        preferred_style: formData.preferred_style || undefined,
      };

      const response = await setupProfile(profileData).unwrap();
      console.log("✅ Profile setup successful:", response);

      // Clear face analysis data
      sessionStorage.removeItem("faceAnalysis");

      // Navigate to allergies page
      router.push("/profile/allergies");
    } catch (error: any) {
      console.error("❌ Profile setup failed:", error);
      alert(error?.data?.message || "Failed to setup profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-6 h-6 text-purple-600" />
              <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            </div>
            <CardDescription className="text-base">
              Let's personalize your beauty experience with some additional information
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Face Analysis Summary */}
            {faceAnalysis && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Your Skin Analysis
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Skin Tone</p>
                    <p className="font-medium text-gray-900">{faceAnalysis.skin_tone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Undertone</p>
                    <p className="font-medium text-gray-900">{faceAnalysis.undertone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Skin Type</p>
                    <p className="font-medium text-gray-900">{faceAnalysis.skin_type}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth (Optional)
                </Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender (Optional)
                </Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select your gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>

              {/* Preferred Style */}
              <div className="space-y-2">
                <Label htmlFor="preferred_style" className="text-sm font-medium">
                  Preferred Style (Optional)
                </Label>
                <select
                  id="preferred_style"
                  name="preferred_style"
                  value={formData.preferred_style}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select your preferred style</option>
                  <option value="natural">Natural</option>
                  <option value="glamorous">Glamorous</option>
                  <option value="bold">Bold</option>
                  <option value="minimal">Minimal</option>
                  <option value="artistic">Artistic</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold text-base transition-colors"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      Setting up your profile...
                    </>
                  ) : (
                    "Continue to Allergies"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600"></div>
          <div className="w-3 h-3 rounded-full bg-purple-300"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">Step 1 of 3</p>
      </div>
    </div>
  );
};

export default ProfileSetupPage;
