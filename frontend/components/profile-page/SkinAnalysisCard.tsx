"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";

interface SkinAnalysisCardProps {
  skinTone?: string;
  undertone?: string;
  skinType?: string;
}

export const SkinAnalysisCard = ({
  skinTone,
  undertone,
  skinType,
}: SkinAnalysisCardProps) => {
  return (
    <Card className="shadow-xl border-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <CardTitle className="text-lg">Skin Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {skinTone && (
          <div>
            <Label className="text-xs text-gray-600">Skin Tone</Label>
            <p className="font-medium text-gray-900 capitalize">{skinTone}</p>
          </div>
        )}
        {undertone && (
          <div>
            <Label className="text-xs text-gray-600">Undertone</Label>
            <p className="font-medium text-gray-900 capitalize">{undertone}</p>
          </div>
        )}
        {skinType && (
          <div>
            <Label className="text-xs text-gray-600">Skin Type</Label>
            <p className="font-medium text-gray-900 capitalize">{skinType}</p>
          </div>
        )}
        {!skinTone && !undertone && !skinType && (
          <p className="text-sm text-gray-500">No skin analysis data available</p>
        )}
      </CardContent>
    </Card>
  );
};
