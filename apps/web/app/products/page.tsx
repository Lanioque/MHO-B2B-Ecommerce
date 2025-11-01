"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BranchSelector } from "@/components/branch-selector";
import { CartButton } from "@/components/cart/cart-button";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { QuantityControls } from "@/components/cart/quantity-controls";
import { useCart } from "@/lib/hooks/use-cart";
import Link from "next/link";
import { Package2, ShoppingCart, TrendingUp, Eye, Grid3x3, List, Search as SearchIcon, Filter, Plus, Check, X, ArrowUpDown } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  stock: number;
  isVisible: boolean;
  zohoItemId: string | null;
  imageName: string | null;
  brand: string | null;
  categoryName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  products: Product[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const pageSize = 20;

  const { addItem, openDrawer } = useCart();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc'>('newest');
  const [quotedPrices, setQuotedPrices] = useState<Record<string, number>>({});
  const isFetchingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const prevCategoryRef = useRef<string | null>(null);

  // Read category from URL params on mount and when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams?.get('categoryName');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams]);

  // Fetch all categories on mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await fetch('/api/products/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchAllCategories();
  }, []);

  // Fetch organization ID and branch ID from selected branch or user context
  useEffect(() => {
    const fetchOrgId = async () => {
      try {
        // First check if we have a selected branch
        const storedBranchId = localStorage.getItem("currentBranchId");
        if (storedBranchId) {
          setBranchId(storedBranchId);
        }
        let currentOrgId = localStorage.getItem("currentOrgId");
        
        // If branch is selected, fetch branch to get orgId
        if (storedBranchId && !currentOrgId) {
          try {
            const branchResponse = await fetch(`/api/branches/${storedBranchId}`, { credentials: "include" });
            if (branchResponse.ok) {
              const branchData = await branchResponse.json();
              const branchOrgId = branchData.branch?.orgId;
              if (branchOrgId) {
                currentOrgId = branchOrgId;
                localStorage.setItem("currentOrgId", branchOrgId);
              }
            }
          } catch (err) {
            console.error("Failed to fetch branch:", err);
          }
        }
        
        // If still no orgId, try localStorage (set by BranchSelector)
        if (!currentOrgId) {
          currentOrgId = localStorage.getItem("currentOrgId");
        }
        
        // If still no orgId, try to get from user session
        if (!currentOrgId) {
          try {
            const userResponse = await fetch("/api/me", { credentials: "include" });
            const userData = await userResponse.json();
            if (userResponse.ok && userData.user?.memberships?.length > 0) {
              currentOrgId = userData.user.memberships[0].orgId;
              if (currentOrgId) {
                localStorage.setItem("currentOrgId", currentOrgId);
              }
            }
          } catch (err) {
            console.error("Failed to fetch user org:", err);
          }
        }
        
        // Fallback to default org from seed if nothing found
        setOrgId(currentOrgId || '00000000-0000-0000-0000-000000000001');
      } catch (error) {
        console.error("Error fetching org ID:", error);
        // Fallback to default
        setOrgId('00000000-0000-0000-0000-000000000001');
      }
    };

    fetchOrgId();
  }, []);

  const fetchProducts = async (pageNum: number, search: string | null, category: string | null, sort: string | null) => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      console.log('Skipping duplicate fetch request');
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      // Use server-side pagination and search
      let url = `/api/products?page=${pageNum}&pageSize=${pageSize}&isVisible=true`;
      if (search && search.trim() !== "") {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (category && category.trim() !== "") {
        url += `&categoryName=${encodeURIComponent(category)}`;
      }
      if (sort && sort.trim() !== "") {
        url += `&sortBy=${encodeURIComponent(sort)}`;
      }
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
      
      // No need to extract categories here - we fetch them separately via /api/products/categories
      // This prevents unnecessary re-renders and state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Reset page to 1 when category/search/sort changes (but not when just page changes)
  useEffect(() => {
    const categoryChanged = prevCategoryRef.current !== selectedCategory;
    if (categoryChanged) {
      prevCategoryRef.current = selectedCategory;
      if (page !== 1) {
        setPage(1);
        return; // Don't fetch yet, let the page change trigger the fetch
      }
    }
  }, [selectedCategory]);

  // Fetch products when search/filter/sort/page changes
  useEffect(() => {
    if (!orgId) return;

    // On initial load, mark that initial load is complete after first fetch
    const isInitial = isInitialLoadRef.current;
    
    // Reset to page 1 when search changes (category reset is handled separately above)
    const hasSearch = searchQuery && searchQuery.trim() !== "";
    if (hasSearch && page !== 1) {
      setPage(1);
      return; // Return early, let the effect run again with page=1
    }

    fetchProducts(page, searchQuery || null, selectedCategory, sortBy);
    
    // Mark initial load as complete after first successful fetch
    if (isInitial) {
      isInitialLoadRef.current = false;
    }
  }, [orgId, page, searchQuery, selectedCategory, sortBy]);

  // Fetch quoted prices when org or branch changes
  useEffect(() => {
    const loadQuoted = async () => {
      if (!orgId) return;
      try {
        const url = `/api/products/quoted-prices${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`;
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          setQuotedPrices(json.prices || {});
        } else {
          setQuotedPrices({});
        }
      } catch {
        setQuotedPrices({});
      }
    };
    loadQuoted();
  }, [orgId, branchId]);

  const formatPrice = (cents: number, currency: string = "AED") => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  

  // Server-provided products and pagination
  const { filteredProducts, pagination: clientPagination, allCategories } = useMemo(() => {
    if (!data?.products) {
      return {
        filteredProducts: [] as Product[],
        pagination: { page: 1, pageSize: pageSize, total: 0, totalPages: 1 },
        allCategories: categories,
      };
    }
    const visibleProducts = data.products.filter((p: Product) => p.isVisible === true);
    return {
      filteredProducts: visibleProducts,
      pagination: data.pagination,
      allCategories: categories,
    };
  }, [data?.products, data?.pagination, categories]);

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!orgId) {
      toast.warning('Please wait for organization to load...');
      return;
    }
    
    setAddingToCart(productId);
    try {
      await addItem(productId, quantity, orgId, branchId || undefined);
      setJustAdded(productId);
      setTimeout(() => setJustAdded(null), 2000);
      openDrawer();
      toast.success('Product added to cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      toast.error('Failed to add item to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleAddToCartFromModal = async () => {
    if (!selectedProduct) return;
    await handleAddToCart(selectedProduct.id, selectedQuantity);
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg">
            <Package2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Product Catalog
            </h1>
            <p className="text-sm text-gray-600">
              {data ? `${data.pagination.total} products available` : 'Browse our collection'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative hidden sm:block">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name, SKU, category, brand, tags..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {orgId && <CartButton orgId={orgId} branchId={branchId || undefined} />}
          <BranchSelector onBranchChange={async (newBranchId) => {
            // Update branchId state and localStorage
            setBranchId(newBranchId);
            localStorage.setItem("currentBranchId", newBranchId);
            
            // Fetch branch to get orgId when branch changes
            try {
              const branchResponse = await fetch(`/api/branches/${newBranchId}`, { credentials: "include" });
              if (branchResponse.ok) {
                const branchData = await branchResponse.json();
                if (branchData.branch?.orgId) {
                  const newOrgId = branchData.branch.orgId;
                  setOrgId(newOrgId);
                  localStorage.setItem("currentOrgId", newOrgId);
                  // Reset to first page and refetch products
                  setPage(1);
                }
              }
            } catch (err) {
              console.error("Failed to fetch branch org:", err);
            }
          }} />
          <Link href="/test-zoho">
            <Button variant="default" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Sync Zoho
            </Button>
          </Link>
        </div>
      </div>
        {/* Category Filter */}
        {(categories.length > 0 || allCategories.length > 0) && (
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Categories
              </button>
              {(searchQuery ? allCategories : categories).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : ''}
              >
                <Grid3x3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : ''}
              >
                <List className="w-4 h-4 mr-2" />
                List
              </Button>
            </div>
            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name-asc">Name: A to Z</SelectItem>
                    <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                Page {clientPagination.page} of {clientPagination.totalPages}
                {searchQuery && ` (${clientPagination.total} found)`}
              </div>
            </div>
          </div>
        </div>

        {loading && isInitialLoadRef.current ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="max-w-2xl mx-auto shadow-xl border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-red-600" />
                </div>
                <p className="font-semibold text-red-600 mb-2">Error Loading Products</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={() => fetchProducts(page, searchQuery || null, selectedCategory, sortBy)}
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredProducts.length > 0 ? (
          <>
            {/* Products Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {filteredProducts.map((product: Product) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden bg-white flex flex-col h-full"
                  >
                    {/* Top Header */}
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                      <span className="text-xs font-semibold text-gray-700 uppercase">
                        {product.brand || 'Product'}
                      </span>
                      {product.categoryName && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs font-normal px-2 py-1">
                          {product.categoryName}
                        </Badge>
                      )}
                    </div>

                    {/* Product Image */}
                    <div 
                      className="relative h-48 bg-gray-100 rounded-lg mx-4 mb-4 cursor-pointer flex-shrink-0"
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="w-full h-full flex items-center justify-center rounded-lg">
                        <div className="text-center">
                          <Package2 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">No Image</p>
                        </div>
                      </div>
                    </div>

                    <CardHeader className="pb-2 px-4 flex-shrink-0">
                      <CardTitle 
                        className="text-base font-bold text-blue-900 cursor-pointer hover:text-blue-700 min-h-[3rem] line-clamp-2"
                        onClick={() => setSelectedProduct(product)}
                        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 font-normal mt-1 h-5">
                        {product.sku}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-4 pb-4 space-y-3 flex-grow flex flex-col justify-end">
                      {/* Price hidden until final quotation */}
                      <div className="bg-blue-50 rounded-lg p-3 flex-shrink-0">
                        <p className="text-sm font-medium text-blue-700">Price available upon final quotation</p>
                      </div>

                      

                      {/* Add to Cart Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                        disabled={addingToCart === product.id}
                      >
                        {addingToCart === product.id ? (
                          <>Adding...</>
                        ) : justAdded === product.id ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Added!
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mb-8">
                {filteredProducts.map((product: Product) => (
                  <Card
                    key={product.id}
                    className="group hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        {/* Image - Temporarily disabled to avoid 404 errors */}
                        <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <div className="w-full h-full flex items-center justify-center">
                            <Package2 className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors mb-1">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 font-mono">SKU: {product.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Price available upon final quotation</p>
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
                            {product.categoryName && <Badge variant="outline">{product.categoryName}</Badge>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {clientPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(clientPagination.totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (clientPagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= clientPagination.totalPages - 3) {
                      pageNum = clientPagination.totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }

                    return (
                      <Button
                        key={i}
                        variant={pageNum === page ? "default" : "outline"}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 ${pageNum === page ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(clientPagination.totalPages, p + 1))}
                  disabled={page === clientPagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="max-w-2xl mx-auto shadow-xl">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package2 className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-xl font-semibold text-gray-900 mb-2">No Active Products</p>
                <p className="text-sm text-gray-600 mb-6">
                  Sync products from Zoho Inventory to get started
                </p>
                <Link href="/test-zoho">
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Sync from Zoho
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => {
        setSelectedProduct(null);
        setSelectedQuantity(1);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="font-mono">SKU: {selectedProduct.sku}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image - Temporarily disabled to avoid 404 errors */}
                <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Package2 className="w-10 h-10 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500">Image Preview Disabled</p>
                    </div>
                  </div>
                </div>

                {/* Price only */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-sm text-blue-700">Available upon final quotation</p>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-600">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedProduct.brand && (
                    <div>
                      <p className="text-gray-500">Brand</p>
                      <p className="font-semibold">{selectedProduct.brand}</p>
                    </div>
                  )}
                  {selectedProduct.categoryName && (
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-semibold">{selectedProduct.categoryName}</p>
                    </div>
                  )}
                  
                  {selectedProduct.zohoItemId && (
                    <div>
                      <p className="text-gray-500">Source</p>
                      <Badge variant="outline" className="mt-1">Zoho Inventory</Badge>
                    </div>
                  )}
                </div>

                {/* Quantity Selector */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-3 text-gray-700">Quantity</label>
                  <div className="flex items-center gap-4">
                    <QuantityControls
                      quantity={selectedQuantity}
                      onIncrease={() => {
                        const newQty = selectedQuantity + 1;
                        if (!selectedProduct.stock || newQty <= selectedProduct.stock) {
                          setSelectedQuantity(newQty);
                        }
                      }}
                      onDecrease={() => {
                        const newQty = Math.max(1, selectedQuantity - 1);
                        setSelectedQuantity(newQty);
                      }}
                      min={1}
                      max={selectedProduct.stock || undefined}
                    />
                    
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={handleAddToCartFromModal}
                    disabled={addingToCart === selectedProduct.id}
                  >
                    {addingToCart === selectedProduct.id ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add {selectedQuantity} to Cart
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setSelectedProduct(null);
                      setSelectedQuantity(1);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Drawer */}
      {orgId ? <CartDrawer orgId={orgId} branchId={branchId || undefined} /> : null}
    </main>
  );
}
