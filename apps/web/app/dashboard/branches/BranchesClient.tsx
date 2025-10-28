"use client";

import { useState, useEffect } from "react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  orgId: string;
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
}

export default function BranchesClient({ orgId, userRole }: BranchesClientProps) {
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
      const payload = {
        orgId,
        name: formData.name,
        billing: formData.billing,
        shipping: useSameBilling ? formData.billing : formData.shipping,
      };

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
      const payload = {
        name: formData.name,
        billing: formData.billing,
        shipping: useSameBilling ? formData.billing : formData.shipping,
      };

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
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch Locations</h1>
          <p className="text-gray-600 mt-1">Manage your branch locations and addresses</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddBranch} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Branch
          </Button>
        )}
      </div>

      {error && !isAddDialogOpen && !isEditDialogOpen && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {branches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
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
            <Card key={branch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{branch.name}</CardTitle>
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
                      >
                        <Pencil className="h-4 w-4" />
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
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Billing Address</h4>
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
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Shipping Address</h4>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new branch location with billing and shipping addresses
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAdd}>
            <div className="space-y-6 py-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

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
            <DialogFooter>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>
              Update branch location and addresses
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="space-y-6 py-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                  {error}
                </div>
              )}

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
            <DialogFooter>
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedBranch?.name}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={formLoading}
            >
              {formLoading ? "Deleting..." : "Delete Branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

