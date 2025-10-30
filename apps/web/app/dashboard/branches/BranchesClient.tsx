"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  orgId: string;
  status?: string;
  description?: string | null;
  notes?: string | null;
  monthlyBudget?: number | null;
  yearlyBudget?: number | null;
  budgetCurrency?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  managerPhone?: string | null;
  operatingHours?: string | null;
  capacity?: number | null;
  employeeCount?: number | null;
  costCenterCode?: string | null;
  taxId?: string | null;
  billing: {
    id: string;
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  shipping: {
    id: string;
    line1: string;
    line2?: string | null;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BranchFormData {
  name: string;
  status: string;
  description: string;
  notes: string;
  monthlyBudget: string;
  yearlyBudget: string;
  budgetCurrency: string;
  phone: string;
  email: string;
  website: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  operatingHours: string;
  capacity: string;
  employeeCount: string;
  costCenterCode: string;
  taxId: string;
  billing: {
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shipping: {
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

const emptyFormData: BranchFormData = {
  name: "",
  status: "ACTIVE",
  description: "",
  notes: "",
  monthlyBudget: "",
  yearlyBudget: "",
  budgetCurrency: "USD",
  phone: "",
  email: "",
  website: "",
  managerName: "",
  managerEmail: "",
  managerPhone: "",
  operatingHours: "",
  capacity: "",
  employeeCount: "",
  costCenterCode: "",
  taxId: "",
  billing: {
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
  },
  shipping: {
    line1: "",
    line2: "",
    city: "",
    postalCode: "",
    country: "",
  },
};

interface BranchesClientProps {
  orgId: string;
  userRole: string;
  userName: string;
  userEmail: string;
}

export default function BranchesClient({ orgId, userRole, userName, userEmail }: BranchesClientProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(emptyFormData);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [useSameBilling, setUseSameBilling] = useState(true);

  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

  // Fetch branches
  useEffect(() => {
    fetchBranches();
  }, [orgId]);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/branches?orgId=${orgId}`);
      const data = await response.json();
      
      if (response.ok) {
        setBranches(data.branches);
      } else {
        setError(data.error || "Failed to load branches");
      }
    } catch (err) {
      setError("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = () => {
    setFormData(emptyFormData);
    setUseSameBilling(true);
    setError("");
    setIsAddDialogOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      status: branch.status || "ACTIVE",
      description: branch.description || "",
      notes: branch.notes || "",
      monthlyBudget: branch.monthlyBudget ? (branch.monthlyBudget / 100).toString() : "",
      yearlyBudget: branch.yearlyBudget ? (branch.yearlyBudget / 100).toString() : "",
      budgetCurrency: branch.budgetCurrency || "USD",
      phone: branch.phone || "",
      email: branch.email || "",
      website: branch.website || "",
      managerName: branch.managerName || "",
      managerEmail: branch.managerEmail || "",
      managerPhone: branch.managerPhone || "",
      operatingHours: branch.operatingHours || "",
      capacity: branch.capacity?.toString() || "",
      employeeCount: branch.employeeCount?.toString() || "",
      costCenterCode: branch.costCenterCode || "",
      taxId: branch.taxId || "",
      billing: {
        line1: branch.billing.line1,
        line2: branch.billing.line2 || "",
        city: branch.billing.city,
        postalCode: branch.billing.postalCode,
        country: branch.billing.country,
      },
      shipping: {
        line1: branch.shipping.line1,
        line2: branch.shipping.line2 || "",
        city: branch.shipping.city,
        postalCode: branch.shipping.postalCode,
        country: branch.shipping.country,
      },
    });
    setUseSameBilling(
      branch.billing.line1 === branch.shipping.line1 &&
      branch.billing.city === branch.shipping.city &&
      branch.billing.postalCode === branch.shipping.postalCode
    );
    setError("");
    setIsEditDialogOpen(true);
  };

  const handleDeleteBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    try {
      const payload: any = {
        orgId,
        name: formData.name,
        status: formData.status,
        billing: formData.billing,
        shipping: useSameBilling ? formData.billing : formData.shipping,
      };

      // Add optional fields if they have values
      if (formData.description) payload.description = formData.description;
      if (formData.notes) payload.notes = formData.notes;
      if (formData.monthlyBudget) payload.monthlyBudget = Math.round(parseFloat(formData.monthlyBudget) * 100);
      if (formData.yearlyBudget) payload.yearlyBudget = Math.round(parseFloat(formData.yearlyBudget) * 100);
      if (formData.budgetCurrency) payload.budgetCurrency = formData.budgetCurrency;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.email) payload.email = formData.email;
      if (formData.website) payload.website = formData.website;
      if (formData.managerName) payload.managerName = formData.managerName;
      if (formData.managerEmail) payload.managerEmail = formData.managerEmail;
      if (formData.managerPhone) payload.managerPhone = formData.managerPhone;
      if (formData.operatingHours) payload.operatingHours = formData.operatingHours;
      if (formData.capacity) payload.capacity = parseInt(formData.capacity);
      if (formData.employeeCount) payload.employeeCount = parseInt(formData.employeeCount);
      if (formData.costCenterCode) payload.costCenterCode = formData.costCenterCode;
      if (formData.taxId) payload.taxId = formData.taxId;

      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAddDialogOpen(false);
        fetchBranches();
      } else {
        setError(data.error || "Failed to create branch");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    setFormLoading(true);
    setError("");

    try {
      const payload: any = {
        name: formData.name,
        status: formData.status,
        billing: formData.billing,
        shipping: useSameBilling ? formData.billing : formData.shipping,
      };

      // Add optional fields if they have values
      if (formData.description) payload.description = formData.description;
      if (formData.notes) payload.notes = formData.notes;
      if (formData.monthlyBudget) payload.monthlyBudget = Math.round(parseFloat(formData.monthlyBudget) * 100);
      if (formData.yearlyBudget) payload.yearlyBudget = Math.round(parseFloat(formData.yearlyBudget) * 100);
      if (formData.budgetCurrency) payload.budgetCurrency = formData.budgetCurrency;
      if (formData.phone) payload.phone = formData.phone;
      if (formData.email) payload.email = formData.email;
      if (formData.website) payload.website = formData.website;
      if (formData.managerName) payload.managerName = formData.managerName;
      if (formData.managerEmail) payload.managerEmail = formData.managerEmail;
      if (formData.managerPhone) payload.managerPhone = formData.managerPhone;
      if (formData.operatingHours) payload.operatingHours = formData.operatingHours;
      if (formData.capacity) payload.capacity = parseInt(formData.capacity);
      if (formData.employeeCount) payload.employeeCount = parseInt(formData.employeeCount);
      if (formData.costCenterCode) payload.costCenterCode = formData.costCenterCode;
      if (formData.taxId) payload.taxId = formData.taxId;

      const response = await fetch(`/api/branches/${selectedBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchBranches();
      } else {
        setError(data.error || "Failed to update branch");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBranch) return;

    setFormLoading(true);

    try {
      const response = await fetch(`/api/branches/${selectedBranch.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        fetchBranches();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete branch");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const updateFormField = (section: 'billing' | 'shipping', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              <h2 className="text-3xl font-bold text-gray-900">Branch Locations</h2>
            </div>
            {isAdmin && (
              <Button onClick={handleAddBranch} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            )}
          </div>
          <p className="text-gray-600">Manage your branch locations and addresses</p>
        </div>

        {error && !isAddDialogOpen && !isEditDialogOpen && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}

        {branches.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No branches yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first branch location</p>
              {isAdmin && (
                <Button onClick={handleAddBranch}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Branch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((branch) => (
              <Card key={branch.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{branch.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Created {new Date(branch.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBranch(branch)}
                          className="hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBranch(branch)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Billing Address
                    </h4>
                    <p className="text-sm text-gray-600">
                      {branch.billing.line1}
                      {branch.billing.line2 && `, ${branch.billing.line2}`}
                      <br />
                      {branch.billing.city}, {branch.billing.postalCode}
                      <br />
                      {branch.billing.country}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Shipping Address
                    </h4>
                    <p className="text-sm text-gray-600">
                      {branch.shipping.line1}
                      {branch.shipping.line2 && `, ${branch.shipping.line2}`}
                      <br />
                      {branch.shipping.city}, {branch.shipping.postalCode}
                      <br />
                      {branch.shipping.country}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* Add Branch Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch location with billing and shipping addresses
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="manager">Manager</TabsTrigger>
                  <TabsTrigger value="operating">Operating</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Main Office"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Branch description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyBudget">Monthly Budget</Label>
                      <Input
                        id="monthlyBudget"
                        type="number"
                        step="0.01"
                        value={formData.monthlyBudget}
                        onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearlyBudget">Yearly Budget</Label>
                      <Input
                        id="yearlyBudget"
                        type="number"
                        step="0.01"
                        value={formData.yearlyBudget}
                        onChange={(e) => setFormData({ ...formData, yearlyBudget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetCurrency">Budget Currency</Label>
                    <Select value={formData.budgetCurrency} onValueChange={(value) => setFormData({ ...formData, budgetCurrency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="costCenterCode">Cost Center Code</Label>
                      <Input
                        id="costCenterCode"
                        value={formData.costCenterCode}
                        onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
                        placeholder="CC-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxId">Tax ID</Label>
                      <Input
                        id="taxId"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="Tax identification number"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="manager" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Manager Name</Label>
                    <Input
                      id="managerName"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerEmail">Manager Email</Label>
                    <Input
                      id="managerEmail"
                      type="email"
                      value={formData.managerEmail}
                      onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                      placeholder="manager@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="managerPhone">Manager Phone</Label>
                    <Input
                      id="managerPhone"
                      type="tel"
                      value={formData.managerPhone}
                      onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="operating" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="operatingHours">Operating Hours</Label>
                    <Input
                      id="operatingHours"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      placeholder="Mon-Fri: 9AM-5PM"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeCount">Employee Count</Label>
                      <Input
                        id="employeeCount"
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Billing Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="billing-line1">Address Line 1 *</Label>
                    <Input
                      id="billing-line1"
                      value={formData.billing.line1}
                      onChange={(e) => updateFormField('billing', 'line1', e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="billing-line2">Address Line 2</Label>
                    <Input
                      id="billing-line2"
                      value={formData.billing.line2}
                      onChange={(e) => updateFormField('billing', 'line2', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-city">City *</Label>
                    <Input
                      id="billing-city"
                      value={formData.billing.city}
                      onChange={(e) => updateFormField('billing', 'city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-postalCode">Postal Code *</Label>
                    <Input
                      id="billing-postalCode"
                      value={formData.billing.postalCode}
                      onChange={(e) => updateFormField('billing', 'postalCode', e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="billing-country">Country *</Label>
                    <Input
                      id="billing-country"
                      value={formData.billing.country}
                      onChange={(e) => updateFormField('billing', 'country', e.target.value)}
                      placeholder="United States"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="same-address"
                  checked={useSameBilling}
                  onChange={(e) => setUseSameBilling(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="same-address" className="cursor-pointer">
                  Shipping address is the same as billing
                </Label>
              </div>

              {!useSameBilling && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Shipping Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="shipping-line1">Address Line 1 *</Label>
                      <Input
                        id="shipping-line1"
                        value={formData.shipping.line1}
                        onChange={(e) => updateFormField('shipping', 'line1', e.target.value)}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="shipping-line2">Address Line 2</Label>
                      <Input
                        id="shipping-line2"
                        value={formData.shipping.line2}
                        onChange={(e) => updateFormField('shipping', 'line2', e.target.value)}
                        placeholder="Suite 100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-city">City *</Label>
                      <Input
                        id="shipping-city"
                        value={formData.shipping.city}
                        onChange={(e) => updateFormField('shipping', 'city', e.target.value)}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping-postalCode">Postal Code *</Label>
                      <Input
                        id="shipping-postalCode"
                        value={formData.shipping.postalCode}
                        onChange={(e) => updateFormField('shipping', 'postalCode', e.target.value)}
                        placeholder="10001"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="shipping-country">Country *</Label>
                      <Input
                        id="shipping-country"
                        value={formData.shipping.country}
                        onChange={(e) => updateFormField('shipping', 'country', e.target.value)}
                        placeholder="United States"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Creating..." : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch location and addresses
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="manager">Manager</TabsTrigger>
                  <TabsTrigger value="operating">Operating</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Branch Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Main Office"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Branch description..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-monthlyBudget">Monthly Budget</Label>
                      <Input
                        id="edit-monthlyBudget"
                        type="number"
                        step="0.01"
                        value={formData.monthlyBudget}
                        onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-yearlyBudget">Yearly Budget</Label>
                      <Input
                        id="edit-yearlyBudget"
                        type="number"
                        step="0.01"
                        value={formData.yearlyBudget}
                        onChange={(e) => setFormData({ ...formData, yearlyBudget: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-budgetCurrency">Budget Currency</Label>
                    <Select value={formData.budgetCurrency} onValueChange={(value) => setFormData({ ...formData, budgetCurrency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="AED">AED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-costCenterCode">Cost Center Code</Label>
                      <Input
                        id="edit-costCenterCode"
                        value={formData.costCenterCode}
                        onChange={(e) => setFormData({ ...formData, costCenterCode: e.target.value })}
                        placeholder="CC-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-taxId">Tax ID</Label>
                      <Input
                        id="edit-taxId"
                        value={formData.taxId}
                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                        placeholder="Tax identification number"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="branch@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-website">Website</Label>
                    <Input
                      id="edit-website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="manager" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-managerName">Manager Name</Label>
                    <Input
                      id="edit-managerName"
                      value={formData.managerName}
                      onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-managerEmail">Manager Email</Label>
                    <Input
                      id="edit-managerEmail"
                      type="email"
                      value={formData.managerEmail}
                      onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                      placeholder="manager@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-managerPhone">Manager Phone</Label>
                    <Input
                      id="edit-managerPhone"
                      type="tel"
                      value={formData.managerPhone}
                      onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="operating" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-operatingHours">Operating Hours</Label>
                    <Input
                      id="edit-operatingHours"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                      placeholder="Mon-Fri: 9AM-5PM"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-capacity">Capacity</Label>
                      <Input
                        id="edit-capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        placeholder="100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-employeeCount">Employee Count</Label>
                      <Input
                        id="edit-employeeCount"
                        type="number"
                        value={formData.employeeCount}
                        onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Billing Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-billing-line1">Address Line 1 *</Label>
                    <Input
                      id="edit-billing-line1"
                      value={formData.billing.line1}
                      onChange={(e) => updateFormField('billing', 'line1', e.target.value)}
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-billing-line2">Address Line 2</Label>
                    <Input
                      id="edit-billing-line2"
                      value={formData.billing.line2}
                      onChange={(e) => updateFormField('billing', 'line2', e.target.value)}
                      placeholder="Suite 100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-billing-city">City *</Label>
                    <Input
                      id="edit-billing-city"
                      value={formData.billing.city}
                      onChange={(e) => updateFormField('billing', 'city', e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-billing-postalCode">Postal Code *</Label>
                    <Input
                      id="edit-billing-postalCode"
                      value={formData.billing.postalCode}
                      onChange={(e) => updateFormField('billing', 'postalCode', e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-billing-country">Country *</Label>
                    <Input
                      id="edit-billing-country"
                      value={formData.billing.country}
                      onChange={(e) => updateFormField('billing', 'country', e.target.value)}
                      placeholder="United States"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-same-address"
                  checked={useSameBilling}
                  onChange={(e) => setUseSameBilling(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="edit-same-address" className="cursor-pointer">
                  Shipping address is the same as billing
                </Label>
              </div>

              {!useSameBilling && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Shipping Address</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="edit-shipping-line1">Address Line 1 *</Label>
                      <Input
                        id="edit-shipping-line1"
                        value={formData.shipping.line1}
                        onChange={(e) => updateFormField('shipping', 'line1', e.target.value)}
                        placeholder="123 Main Street"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="edit-shipping-line2">Address Line 2</Label>
                      <Input
                        id="edit-shipping-line2"
                        value={formData.shipping.line2}
                        onChange={(e) => updateFormField('shipping', 'line2', e.target.value)}
                        placeholder="Suite 100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-shipping-city">City *</Label>
                      <Input
                        id="edit-shipping-city"
                        value={formData.shipping.city}
                        onChange={(e) => updateFormField('shipping', 'city', e.target.value)}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-shipping-postalCode">Postal Code *</Label>
                      <Input
                        id="edit-shipping-postalCode"
                        value={formData.shipping.postalCode}
                        onChange={(e) => updateFormField('shipping', 'postalCode', e.target.value)}
                        placeholder="10001"
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="edit-shipping-country">Country *</Label>
                      <Input
                        id="edit-shipping-country"
                        value={formData.shipping.country}
                        onChange={(e) => updateFormField('shipping', 'country', e.target.value)}
                        placeholder="United States"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? "Updating..." : "Update Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[90vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Branch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedBranch?.name}</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={formLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? "Deleting..." : "Delete Branch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

