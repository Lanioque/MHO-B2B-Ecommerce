"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Branch {
  id: string;
  name: string;
}

interface BranchSelectorProps {
  currentBranchId?: string;
  onBranchChange?: (branchId: string) => void;
}

export function BranchSelector({ currentBranchId, onBranchChange }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranchId || "");

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      // First try to get orgId from localStorage
      let orgId = localStorage.getItem("currentOrgId");
      
      // If not in localStorage, fetch from API
      if (!orgId) {
        try {
          const userResponse = await fetch("/api/me", { credentials: "include" });
          const userData = await userResponse.json();
          if (userResponse.ok && userData.user?.memberships?.length > 0) {
            orgId = userData.user.memberships[0].orgId;
            localStorage.setItem("currentOrgId", orgId);
          } else {
            setLoading(false);
            return;
          }
        } catch (err) {
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/branches?orgId=${orgId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.warn("Failed to fetch branches:", errorData);
        // If no branches, that's okay - just don't show the selector
        setBranches([]);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // No branches is normal - just set empty array
      if (!data.branches || data.branches.length === 0) {
        setBranches([]);
        setLoading(false);
        return;
      }
      
      setBranches(data.branches);
      
      // Set initial branch if not set
      if (!selectedBranch && data.branches && data.branches.length > 0) {
        setSelectedBranch(data.branches[0].id);
        localStorage.setItem("currentBranchId", data.branches[0].id);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    setSelectedBranch(value);
    localStorage.setItem("currentBranchId", value);
    if (onBranchChange) {
      onBranchChange(value);
    }
    // Reload page to apply changes
    window.location.reload();
  };

  if (loading) {
    return <div className="px-2 py-1 text-sm text-gray-500">Loading...</div>;
  }

  if (branches.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Branch:</span>
      <Select value={selectedBranch} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

