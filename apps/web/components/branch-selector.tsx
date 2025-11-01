"use client";

import { useEffect, useState, useRef } from "react";
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
  const isFetchingRef = useRef(false);
  
  // Initialize from localStorage or prop
  const getInitialBranch = () => {
    if (currentBranchId) return currentBranchId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem("currentBranchId") || "all";
    }
    return "all";
  };
  
  const [selectedBranch, setSelectedBranch] = useState<string>(getInitialBranch());

  useEffect(() => {
    // Prevent duplicate fetches in React StrictMode and concurrent requests
    // Also skip if we already have branches loaded (to prevent re-fetch on remount)
    if (isFetchingRef.current || branches.length > 0) return;
    
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sync with localStorage changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranch = localStorage.getItem("currentBranchId");
      if (storedBranch && storedBranch !== selectedBranch) {
        setSelectedBranch(storedBranch);
      }
    }
  }, []);

  const fetchBranches = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    
    try {
      // Always fetch user data from API to get the current session's orgId
      // localStorage might be stale, especially after onboarding
      let orgId: string | null = null;
      
      try {
        const userResponse = await fetch("/api/me", { credentials: "include" });
        const userData = await userResponse.json();
        if (userResponse.ok && userData.user?.memberships?.length > 0) {
          orgId = userData.user.memberships[0].orgId;
          // Update localStorage with the current orgId from session
          localStorage.setItem("currentOrgId", orgId);
        } else {
          // Fallback to localStorage if API doesn't have memberships
          orgId = localStorage.getItem("currentOrgId");
        }
      } catch (err) {
        // Fallback to localStorage if API call fails
        orgId = localStorage.getItem("currentOrgId");
      }
      
      if (!orgId) {
        setLoading(false);
        isFetchingRef.current = false;
        return;
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
      
      // Set initial branch if not set - check localStorage first
      const storedBranchId = localStorage.getItem("currentBranchId");
      let initialBranchId = currentBranchId || selectedBranch || storedBranchId || "all";
      
      // Validate that the stored/selected branch exists in the fetched branches
      if (initialBranchId && initialBranchId !== "all" && !data.branches.find(b => b.id === initialBranchId)) {
        initialBranchId = "all";
      }
      
      // Default to "all" if no branch is selected
      if (!initialBranchId || initialBranchId === "") {
        initialBranchId = "all";
      }
      
      if (initialBranchId !== selectedBranch) {
        setSelectedBranch(initialBranchId);
        // Notify parent if branch changed
        if (onBranchChange && initialBranchId === "all") {
          onBranchChange("");
        }
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      setBranches([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleChange = async (value: string) => {
    const previousValue = selectedBranch;
    setSelectedBranch(value);
    
    // Don't store "all" in localStorage
    if (value !== "all") {
      localStorage.setItem("currentBranchId", value);
      
      // Fetch branch to get orgId (only if needed)
      try {
        const branchResponse = await fetch(`/api/branches/${value}`, { credentials: "include" });
        if (branchResponse.ok) {
          const branchData = await branchResponse.json();
          if (branchData.branch?.orgId) {
            localStorage.setItem("currentOrgId", branchData.branch.orgId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch branch org:", err);
      }
    } else {
      // Clear branch selection when "All" is selected
      localStorage.removeItem("currentBranchId");
    }
    
    // Only call onBranchChange if the value actually changed
    if (value !== previousValue && onBranchChange) {
      onBranchChange(value === "all" ? "" : value);
    }
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
      <Select value={selectedBranch || "all"} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
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

