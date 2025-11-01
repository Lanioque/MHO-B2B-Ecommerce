"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";

const FOOD_RESTRICTIONS = [
  { value: "VEGETARIAN", label: "Vegetarian" },
  { value: "VEGAN", label: "Vegan" },
  { value: "GLUTEN_FREE", label: "Gluten-Free" },
  { value: "DAIRY_FREE", label: "Dairy-Free" },
  { value: "NUT_FREE", label: "Nut-Free" },
  { value: "HALAL", label: "Halal" },
  { value: "KOSHER", label: "Kosher" },
];

interface OnboardingFormProps {
  email?: string;
}

export default function OnboardingForm({ email }: OnboardingFormProps) {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [selectedDietTypes, setSelectedDietTypes] = useState<string[]>([]);
  
  // Branch management
  type BranchData = {
    id: string;
    name: string;
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    country: string;
  };
  
  const [branches, setBranches] = useState<BranchData[]>([
    { id: Date.now().toString(), name: "", line1: "", line2: "", city: "", postalCode: "", country: "" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgId, setOrgId] = useState<string | null>(null);

  const toggleDietType = (value: string) => {
    setSelectedDietTypes(prev =>
      prev.includes(value)
        ? prev.filter(t => t !== value)
        : [...prev, value]
    );
  };

  const handleOrgCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          vatNumber,
          employeeCount: employeeCount ? parseInt(employeeCount) : null,
          supportedDietTypes: selectedDietTypes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create organization");
      } else {
        setOrgId(data.org.id);
        // Note: The session won't automatically refresh with the new membership,
        // but the branches API has a database fallback to check membership directly
        // when the session doesn't have it yet. This handles the onboarding flow.
        setCurrentStep(2);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addBranch = () => {
    setBranches([...branches, { 
      id: Date.now().toString(), 
      name: "", 
      line1: "", 
      line2: "", 
      city: "", 
      postalCode: "", 
      country: "" 
    }]);
  };

  const removeBranch = (id: string) => {
    if (branches.length > 1) {
      setBranches(branches.filter(branch => branch.id !== id));
    }
  };

  const updateBranch = (id: string, field: keyof BranchData, value: string) => {
    setBranches(branches.map(branch => 
      branch.id === id ? { ...branch, [field]: value } : branch
    ));
  };

  const handleBranchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Filter out empty branches (allowing 0 branches)
      const validBranches = branches.filter(b => 
        b.name.trim() || b.line1.trim() || b.city.trim() || b.postalCode.trim() || b.country.trim()
      );

      // Create all valid branches
      if (validBranches.length > 0) {
        const branchPromises = validBranches.map(branch =>
          fetch("/api/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orgId,
              name: branch.name || `Branch ${validBranches.indexOf(branch) + 1}`,
              billing: {
                line1: branch.line1,
                line2: branch.line2,
                city: branch.city,
                postalCode: branch.postalCode,
                country: branch.country,
              },
              shipping: {
                line1: branch.line1,
                line2: branch.line2,
                city: branch.city,
                postalCode: branch.postalCode,
                country: branch.country,
              },
            }),
          })
        );

        const responses = await Promise.all(branchPromises);
        const errors = responses.filter(r => !r.ok);
        
        if (errors.length > 0) {
          const errorData = await errors[0].json();
          setError(errorData.error || "Failed to create some branches");
          return;
        }
      }

      setCurrentStep(3);
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    // Refresh the session to get the new membership data, then redirect to dashboard
    // The session refresh happens on the server when we navigate
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 overflow-auto">
      <div className="w-full max-w-2xl space-y-6 relative">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center transition-colors duration-300 ${
            currentStep >= 1 ? "text-blue-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep >= 1 ? "bg-blue-600 text-white scale-110" : "bg-gray-200 scale-100"
            }`}>
              1
            </div>
            <span className="ml-2 font-medium">Company</span>
          </div>
          <div className={`w-12 h-1 transition-colors duration-300 ${
            currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
          }`} />
          <div className={`flex items-center transition-colors duration-300 ${
            currentStep >= 2 ? "text-blue-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep >= 2 ? "bg-blue-600 text-white scale-110" : "bg-gray-200 scale-100"
            }`}>
              2
            </div>
            <span className="ml-2 font-medium">Branch</span>
          </div>
          <div className={`w-12 h-1 transition-colors duration-300 ${
            currentStep >= 3 ? "bg-blue-600" : "bg-gray-200"
          }`} />
          <div className={`flex items-center transition-colors duration-300 ${
            currentStep >= 3 ? "text-blue-600" : "text-gray-400"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              currentStep >= 3 ? "bg-blue-600 text-white scale-110" : "bg-gray-200 scale-100"
            }`}>
              3
            </div>
            <span className="ml-2 font-medium">Complete</span>
          </div>
        </div>

        {/* Step Container with Transition */}
        <div className="relative min-h-[600px]">
          {/* Step 1: Company Creation */}
          <div 
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              currentStep === 1 
                ? "opacity-100 translate-x-0 z-10" 
                : "opacity-0 -translate-x-full pointer-events-none z-0"
            }`}
          >
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle>Create Your Company</CardTitle>
                <CardDescription>
                  Set up your restaurant or food business information
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleOrgCreate}>
                <CardContent className="space-y-4">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md animate-in fade-in duration-200">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="orgName">Company Name</Label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Restaurant Name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number (Optional)</Label>
                    <Input
                      id="vatNumber"
                      type="text"
                      placeholder="GB123456789"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employeeCount">Number of Employees (Optional)</Label>
                    <Input
                      id="employeeCount"
                      type="number"
                      placeholder="10"
                      value={employeeCount}
                      onChange={(e) => setEmployeeCount(e.target.value)}
                      min="0"
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Supported Food Restrictions (Optional)</Label>
                    <p className="text-sm text-gray-500 mb-3">
                      Select the dietary options your restaurant supports
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {FOOD_RESTRICTIONS.map((restriction, idx) => (
                        <div 
                          key={restriction.value} 
                          className="flex items-center space-x-2 animate-in fade-in duration-300"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <Checkbox
                            id={restriction.value}
                            checked={selectedDietTypes.includes(restriction.value)}
                            onCheckedChange={() => toggleDietType(restriction.value)}
                          />
                          <Label htmlFor={restriction.value} className="cursor-pointer">
                            {restriction.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
                    <Button
                      type="button"
                      disabled={loading}
                      variant="outline"
                      onClick={() => router.back()}
                      className="transition-transform duration-200 hover:scale-105"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="transition-transform duration-200 hover:scale-105"
                    >
                      {loading ? "Creating..." : "Continue"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* Step 2: Branch Information */}
          <div 
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              currentStep === 2 
                ? "opacity-100 translate-x-0 z-10" 
                : currentStep < 2
                ? "opacity-0 translate-x-full pointer-events-none z-0"
                : "opacity-0 -translate-x-full pointer-events-none z-0"
            }`}
          >
            <Card className="w-full shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Add Your Branch Locations</CardTitle>
                    <CardDescription>
                      Add one or more branch locations (optional)
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={addBranch}
                    size="sm"
                    variant="outline"
                    className="transition-transform duration-200 hover:scale-105"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Branch
                  </Button>
                </div>
              </CardHeader>
              <form onSubmit={handleBranchCreate}>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md animate-in fade-in duration-200">
                      {error}
                    </div>
                  )}

                  {branches.map((branch, index) => (
                    <Card key={branch.id} className="p-4 border-2">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">Branch {index + 1}</h4>
                        {branches.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeBranch(branch.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Branch Name (Optional)</Label>
                          <Input
                            type="text"
                            placeholder="Main Location"
                            value={branch.name}
                            onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Address Line 1 (Optional)</Label>
                          <Input
                            type="text"
                            placeholder="123 Main Street"
                            value={branch.line1}
                            onChange={(e) => updateBranch(branch.id, "line1", e.target.value)}
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Address Line 2 (Optional)</Label>
                          <Input
                            type="text"
                            placeholder="Suite 100"
                            value={branch.line2}
                            onChange={(e) => updateBranch(branch.id, "line2", e.target.value)}
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>City (Optional)</Label>
                            <Input
                              type="text"
                              placeholder="New York"
                              value={branch.city}
                              onChange={(e) => updateBranch(branch.id, "city", e.target.value)}
                              className="transition-all duration-200 focus:scale-[1.02]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Postal Code (Optional)</Label>
                            <Input
                              type="text"
                              placeholder="10001"
                              value={branch.postalCode}
                              onChange={(e) => updateBranch(branch.id, "postalCode", e.target.value)}
                              className="transition-all duration-200 focus:scale-[1.02]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Country (Optional)</Label>
                          <Input
                            type="text"
                            placeholder="United States"
                            value={branch.country}
                            onChange={(e) => updateBranch(branch.id, "country", e.target.value)}
                            className="transition-all duration-200 focus:scale-[1.02]"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <div className="mt-4 p-4 bg-blue-50 rounded-md text-sm text-blue-800">
                    <p className="font-semibold mb-2">Tip:</p>
                    <p>You can skip adding branches now and add them later from your dashboard. Empty branches will be ignored.</p>
                  </div>
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
                    <Button
                      type="button"
                      disabled={loading}
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                      className="transition-transform duration-200 hover:scale-105"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="transition-transform duration-200 hover:scale-105"
                    >
                      {loading ? "Creating..." : "Complete Setup"}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>

          {/* Step 3: Complete */}
          <div 
            className={`absolute inset-0 transition-all duration-500 ease-in-out ${
              currentStep === 3 
                ? "opacity-100 scale-100 z-10" 
                : "opacity-0 scale-95 pointer-events-none z-0"
            }`}
          >
            <Card className="w-full shadow-lg">
              <CardHeader>
                <CardTitle>You're All Set!</CardTitle>
                <CardDescription>
                  Your platform is ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4 animate-bounce"></div>
                  <h3 className="text-xl font-semibold mb-2 animate-in fade-in duration-300">Company Setup Complete</h3>
                  <p className="text-gray-600 animate-in fade-in duration-500">
                    You can now manage products, employees, and process orders
                  </p>
                </div>
                
                {/* Navigation Button */}
                <div className="flex justify-center mt-6 pt-6 border-t">
                  <Button 
                    onClick={handleComplete} 
                    size="lg"
                    className="transition-transform duration-200 hover:scale-105"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
