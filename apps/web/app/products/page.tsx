"use client";

import { useEffect, useState } from "react";
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

  const fetchProducts = async (pageNum: number, search?: string, category?: string | null, sort?: string) => {
    try {
      setLoading(true);
      let url = `/api/products?page=${pageNum}&pageSize=${pageSize}&isVisible=true`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      if (category) {
        url += `&categoryName=${encodeURIComponent(category)}`;
      }
      if (sort) {
        url += `&sortBy=${encodeURIComponent(sort)}`;
      }
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
      
      // Extract unique categories from products
      if (result.products) {
        const uniqueCategories = Array.from(
          new Set(
            result.products
              .map((p: Product) => p.categoryName)
              .filter((cat: string | null | undefined) => cat && cat.trim() !== "")
          )
        ).sort() as string[];
        setCategories((prev) => {
          // Merge with existing categories
          const merged = new Set([...prev, ...uniqueCategories]);
          return Array.from(merged).sort();
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search - wait for user to stop typing
  useEffect(() => {
    if (!orgId) return;

    const timer = setTimeout(() => {
      setPage(1); // Reset to first page when searching or filtering
      fetchProducts(1, searchQuery || undefined, selectedCategory, sortBy);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, sortBy, orgId]);

  // Fetch products when page or sort changes
  useEffect(() => {
    if (orgId) {
      fetchProducts(page, searchQuery || undefined, selectedCategory, sortBy);
    }
  }, [page, sortBy]);

  const formatPrice = (cents: number, currency: string = "AED") => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
    }).format(cents / 100);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="bg-red-500 text-white px-2 py-0.5 text-xs font-medium rounded-full">
          Out of Stock
        </Badge>
      );
    }
    if (stock < 10) {
      return (
        <Badge className="bg-orange-500 text-white px-2 py-0.5 text-xs font-medium rounded-full">
          Low Stock
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500 text-white px-2 py-0.5 text-xs font-medium rounded-full">
        In Stock
      </Badge>
    );
  };

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!orgId) {
      alert('Please wait for organization to load...');
      return;
    }
    
    setAddingToCart(productId);
    try {
      await addItem(productId, quantity, orgId, branchId || undefined);
      setJustAdded(productId);
      setTimeout(() => setJustAdded(null), 2000);
      openDrawer();
    } catch (err) {
      console.error('Failed to add to cart:', err);
      alert('Failed to add item to cart');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link href="/test-zoho">
                <Button variant="default" size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Sync Zoho
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        {categories.length > 0 && (
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
              {categories.map((category) => (
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
                Page {page} of {data?.pagination.totalPages || 1}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
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
                  onClick={() => fetchProducts(page)}
                  variant="default"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : data && data.products.length > 0 ? (
          <>
            {/* Products Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {data.products.map((product: Product) => (
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
                      {/* Price */}
                      <div className="bg-blue-50 rounded-lg p-3 flex-shrink-0">
                        <p className="text-xl font-bold text-blue-700">
                          {formatPrice(product.priceCents, product.currency)}
                        </p>
                      </div>

                      {/* Stock Status */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStockBadge(product.stock)}
                        <span className="text-sm text-gray-700">
                          Stock {product.stock}
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product.id);
                        }}
                        disabled={addingToCart === product.id || product.stock === 0}
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
                {data.products.map((product: Product) => (
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
                              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                {formatPrice(product.priceCents, product.currency)}
                              </p>
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3">
                            {getStockBadge(product.stock)}
                            {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
                            {product.categoryName && <Badge variant="outline">{product.categoryName}</Badge>}
                            <span className="text-sm text-gray-500 ml-auto">
                              Stock: <span className="font-semibold">{product.stock}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(data.pagination.totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (data.pagination.totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= data.pagination.totalPages - 3) {
                      pageNum = data.pagination.totalPages - 6 + i;
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
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
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
      </main>

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

                {/* Price & Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {formatPrice(selectedProduct.priceCents, selectedProduct.currency)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <p className="text-sm text-gray-600 mb-1">Stock Level</p>
                    <p className="text-3xl font-bold text-green-600">
                      {selectedProduct.stock}
                    </p>
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
                  <div>
                    <p className="text-gray-500">Status</p>
                    <Badge className="mt-1">{getStockBadge(selectedProduct.stock)}</Badge>
                  </div>
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
                    <span className="text-sm text-gray-500">
                      (Max: {selectedProduct.stock})
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={handleAddToCartFromModal}
                    disabled={addingToCart === selectedProduct.id || selectedProduct.stock === 0}
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
    </div>
  );
}
