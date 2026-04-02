import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductOrderBatch
} from "../../api/firebaseFunctions";
import { uploadImageToCloudinary } from "../../api/cloudinary";
import { Loader2, Plus, Edit2, Trash2, X, Upload, Check, ImageIcon, Package, ChevronLeft, ChevronRight, Star, GripVertical, Eye, EyeOff } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageUtils";
import { useSettings } from "../../context/SettingsContext";


const SortableMobileCard = ({ product, handleEdit, handleDelete, handleTogglePublic }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1, position: 'relative' };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white p-4 rounded-xl border ${isDragging ? "border-black shadow-lg opacity-80" : "border-gray-100 shadow-sm"} flex flex-col gap-3 group`}>
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-black/5">
          {(product.images?.[0] || product.imageUrl) ? (
            <img src={product.images?.[0] || product.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-full h-full p-4 text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <h3 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{product.title || product.name}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{product.category}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-sm">₦{product.price?.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${
                product.stockQuantity <= 0 ? "bg-red-50 text-red-600 border border-red-100" :
                product.stockQuantity <= 5 ? "bg-orange-50 text-orange-600 border border-orange-100" :
                "bg-green-50 text-green-600 border border-green-100"
              }`}>
                {product.stockQuantity <= 0 ? "Out" : `${product.stockQuantity} Left`}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
        <button {...attributes} {...listeners} className="flex items-center justify-center p-2 bg-gray-50 text-gray-400 hover:text-black rounded-lg border border-transparent touch-none active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <button 
          onClick={() => handleTogglePublic(product)} 
          className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${product.isPublic !== false ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`}
        >
          {product.isPublic !== false ? <><Eye size={14}/> Visible</> : <><EyeOff size={14}/> Hidden</>}
        </button>
        <button onClick={() => handleEdit(product)} className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg border border-black/5 hover:bg-gray-100">
          <Edit2 size={14} />
        </button>
        <button onClick={() => handleDelete(product.id)} className="flex items-center justify-center p-2 bg-red-50 text-red-500 rounded-lg border border-red-100 hover:bg-red-100">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const SortableDesktopRow = ({ product, handleEdit, handleDelete, handleTogglePublic }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1, position: 'relative' };

  return (
    <tr ref={setNodeRef} style={style} className={`group transition-colors ${isDragging ? "bg-gray-50 shadow-lg ring-1 ring-black/5 opacity-80" : "hover:bg-gray-50"}`}>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden border border-black/5">
            {(product.images?.[0] || product.imageUrl) ? (
              <img src={product.images?.[0] || product.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-full h-full p-3 text-gray-300" />
            )}
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm uppercase tracking-tight block">{product.title || product.name}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">ID: {product.id.slice(0, 8)}</span>
          </div>
        </div>
      </td>
      <td className="p-4 capitalize text-gray-600 text-sm font-medium">{product.category}</td>
      <td className="p-4 font-bold text-sm">₦{product.price?.toLocaleString()}</td>
      <td className="p-4">
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider w-fit border ${
            product.stockQuantity <= 0 ? "bg-red-50 text-red-600 border-red-100" :
            product.stockQuantity <= 5 ? "bg-orange-50 text-orange-600 border-orange-100" :
            "bg-green-50 text-green-600 border-green-100"
          }`}>
            {product.stockQuantity <= 0 ? "Out of Stock" : product.stockQuantity <= 5 ? "Low Stock" : "In Stock"}
          </span>
          <span className="text-[10px] text-gray-400 font-bold px-1 uppercase tracking-tighter">{product.stockQuantity} UNITS</span>
        </div>
      </td>
      <td className="p-4 text-right">
        <div className="flex justify-end items-center gap-2 transition-all">
          <button 
            onClick={() => handleTogglePublic(product)} 
            className={`p-1.5 focus:outline-none rounded-lg border hover:opacity-80 transition-opacity ${product.isPublic !== false ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}
            title={product.isPublic !== false ? "Hide from Store" : "Show on Store"}
          >
            {product.isPublic !== false ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button {...attributes} {...listeners} className="p-2 text-gray-400 hover:text-black cursor-grab active:cursor-grabbing touch-none">
            <GripVertical size={16} />
          </button>
          <button onClick={() => handleEdit(product)} className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg border border-transparent hover:border-black/5">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    title: "",
    price: "",
    description: "",
    category: "tees",
    images: [], // Array of URL strings
    sizes: [], // Array of strings e.g. ["S", "M", "L"]
    colors: [], // Array of strings e.g. ["Black", "White"]
    tags: [], // E.g. ["New", "Best Seller"]
    stockQuantity: 0,
    sizeStock: {}, // { "S": 10, "M": 5 }
    weight: 0,
    inStock: true,
    featured: false,
    bestSeller: false,
    modelImage: null,
    displayOrder: 999, // Default for new products
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isUploading, setIsUploading] = useState(false); // Track active uploads

  const categories = [
    { value: "tees", label: "T-SHIRTS" },
    { value: "hoodies", label: "HOODIES" },
    { value: "headwear", label: "HEADWEAR" },
    { value: "accessories", label: "ACCESSORIES" },
    { value: "pants", label: "PANTS" },
    { value: "polo", label: "POLO" },
    { value: "sleeves", label: "SLEEVES" },
  ];

  const { settings } = useSettings();
  const availableSizes = settings?.available_sizes ? settings.available_sizes.split(',').map(s => s.trim()) : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  const availableColors = settings?.available_colors ? settings.available_colors.split(',').map(c => c.trim()) : [
    "Black", "White", "Grey", "Navy", "Beige", "Red",
    "Blue", "Green", "Olive", "Brown", "Burgundy",
    "Pink", "Yellow", "Purple"
  ];
  const availableTags = ["New", "Best Seller", "Essential", "Limited Edition", "Sale", "Restocked"];


  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((p) => p.id === active.id);
        const newIndex = items.findIndex((p) => p.id === over.id);
        const newArray = arrayMove(items, oldIndex, newIndex);
        
        toast.promise(
          updateProductOrderBatch(newArray),
          { loading: 'Saving new order...', success: 'Order updated successfully', error: 'Failed to update order' },
          { id: 'order-update' }
        );
        return newArray;
      });
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts({ admin: true });
      data.sort((a, b) => {
        const orderA = a.displayOrder !== undefined ? Number(a.displayOrder) : 999;
        const orderB = b.displayOrder !== undefined ? Number(b.displayOrder) : 999;
        if (orderA !== orderB) return orderA - orderB;
        return (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0);
      });
      setProducts(data);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      title: product.title || "",
      price: product.price || "",
      description: product.description || "",
      category: product.category || "tees",
      displayOrder: product.displayOrder, // Preserve existing order
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      sizes: product.availableSizes || product.sizes || [],
      colors: product.availableColors || product.colors || [],
      tags: product.tags || [],
      stockQuantity: product.stockQuantity || 0,
      sizeStock: product.sizeStock || {},
      weight: product.weight || 0,
      inStock: product.inStock !== false,
      featured: product.featured || false,
      bestSeller: product.bestSeller || false,
      modelImage: product.modelImage || product.modalImage || null,
    });
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploading(true);
      const totalFiles = files.length;
      toast.loading(`Compressing ${totalFiles} image${totalFiles > 1 ? 's' : ''}...`, { id: "upload-status" });
      
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file))
      );
      
      let uploadedUrls = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        toast.loading(`Uploading image ${i + 1} of ${totalFiles}...`, { id: "upload-status" });
        try {
          const url = await uploadImageToCloudinary(compressedFiles[i]);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.error(`Failed to upload image ${i + 1}:`, uploadErr);
          toast.error(`Failed to upload image ${i + 1}.`, { id: `err-${i}` });
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));
        toast.success(`Added ${uploadedUrls.length} image(s)`, { id: "upload-status" });
      } else {
        toast.dismiss("upload-status");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload", { id: "upload-status" });
    } finally {
      setIsUploading(false);
      // Clear input so same file can be selected again if needed
      e.target.value = "";
    }
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        // If removing a size, also remove it from sizeStock
        const newSizeStock = { ...prev.sizeStock };
        if (field === 'sizes') delete newSizeStock[value];
        
        return { 
          ...prev, 
          [field]: current.filter(item => item !== value),
          sizeStock: field === 'sizes' ? newSizeStock : prev.sizeStock
        };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSizeStockChange = (size, value) => {
    const qty = parseInt(value) || 0;
    setFormData(prev => {
      const newSizeStock = { ...prev.sizeStock, [size]: qty };
      const totalStock = Object.values(newSizeStock).reduce((a, b) => a + b, 0);
      return { 
        ...prev, 
        sizeStock: newSizeStock,
        stockQuantity: totalStock
      };
    });
  };

  const bulkUpdateStock = (value) => {
    const qty = parseInt(value) || 0;
    setFormData(prev => {
      const newSizeStock = {};
      prev.sizes.forEach(size => {
        newSizeStock[size] = qty;
      });
      const totalStock = Object.values(newSizeStock).reduce((a, b) => a + b, 0);
      return { 
        ...prev, 
        sizeStock: newSizeStock,
        stockQuantity: totalStock
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isUploading) {
      toast.error("Please wait for images to finish uploading");
      return;
    }

    try {
      setIsSubmitting(true);

      const finalImages = formData.images;

      if (finalImages.length === 0) {
        toast.error("At least one image is required");
        setIsSubmitting(false);
        return;
      }

      toast.loading(editingId ? "Saving changes..." : "Creating product...", { id: "upload-status" });

      const payload = {
        ...formData,
        availableSizes: formData.sizes,
        availableColors: formData.colors,
        tags: formData.tags,
        price: parseFloat(formData.price),
        displayOrder: formData.displayOrder !== undefined ? formData.displayOrder : 999,
        images: finalImages,
        imageUrl: finalImages[0],
        modelImage: formData.modelImage || (finalImages.length > 0 ? finalImages[0] : null),
        updated_at: new Date()
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Product updated successfully", { id: "upload-status" });
      } else {
        await addProduct(payload);
        toast.success("Product created successfully", { id: "upload-status" });
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error("Product submission error:", error);
      toast.error(`Operation failed: ${error.message || "Unknown error"}`, { 
        id: "upload-status",
        duration: 5000 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      toast.success("Product deleted");
      loadProducts();
    }
  };

  const handleTogglePublic = async (product) => {
    const newStatus = product.isPublic === false ? true : false;
    const actionText = newStatus ? 'show' : 'hide';
    
    if (confirm(`Are you sure you want to ${actionText} "${product.title || product.name}" on the storefront?`)) {
      try {
        await updateProduct(product.id, { isPublic: newStatus });
        toast.success(newStatus ? "Product is now visible on the store" : "Product is hidden from the store");
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isPublic: newStatus } : p));
      } catch (error) {
        console.error(error);
        toast.error("Failed to update visibility");
      }
    }
  };

  return (
    <AdminLayout title="Products">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-4 sm:py-3 sm:px-6"
        >
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-transparent sm:bg-white sm:rounded-xl sm:border sm:border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center bg-white rounded-xl border border-gray-200">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
<div className="grid grid-cols-1 gap-4 sm:hidden pb-10">
              {products.map(product => (
                <SortableMobileCard key={product.id} product={product} handleEdit={handleEdit} handleDelete={handleDelete} handleTogglePublic={handleTogglePublic} />
              ))}
              {products.length === 0 && (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                  <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No products found</p>
                </div>
              )}
            </div>
              </SortableContext>
            </DndContext>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-gray-400">Product</th>
                      <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-gray-400 whitespace-nowrap">Category</th>
                      <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-gray-400 whitespace-nowrap">Price</th>
                      <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-gray-400">Stock</th>
                      <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-gray-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    <tbody className="divide-y divide-gray-100">
                      {products.map(product => (
                        <SortableDesktopRow key={product.id} product={product} handleEdit={handleEdit} handleDelete={handleDelete} handleTogglePublic={handleTogglePublic} />
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-12 text-center">
                            <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No products found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </SortableContext>
                </table>
              </DndContext>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">{editingId ? "Edit Product" : "New Product"}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <input
                    required
                    className="w-full border p-3 rounded-lg"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price (₦)</label>
                  <input
                    type="number"
                    required
                    className="w-full border p-3 rounded-lg"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={4}
                  className="w-full border p-3 rounded-lg"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full border p-3 rounded-lg bg-white"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Variants */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sizes</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSelection("sizes", size)}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${formData.sizes.includes(size)
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Colors</label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => toggleSelection("colors", color)}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${formData.colors.includes(color)
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleSelection("tags", tag)}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${formData.tags.includes(tag)
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {formData.sizes.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-black/5 shadow-sm">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-black">Inventory per Size</label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 border-r border-gray-100 pr-3">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Bulk Update:</span>
                        <div className="flex">
                          <input 
                            id="bulk-stock-input"
                            type="number" 
                            placeholder="0"
                            className="w-12 p-1 text-[10px] border border-r-0 rounded-l font-bold text-center focus:outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('bulk-stock-input');
                              if (input.value !== "") {
                                bulkUpdateStock(input.value);
                                input.value = "";
                                toast.success("Applied to all sizes");
                              }
                            }}
                            className="px-2 py-1 bg-black text-white text-[8px] font-bold uppercase rounded-r hover:bg-gray-800 transition-colors"
                          >
                            Set All
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if(confirm("Zero out all stock for this product?")) bulkUpdateStock(0);
                        }}
                        className="text-[9px] font-bold text-red-400 hover:text-red-500 uppercase tracking-tighter transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {formData.sizes.map(size => (
                      <div key={size} className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500">{size}</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.sizeStock[size] || 0}
                          onChange={(e) => handleSizeStockChange(size, e.target.value)}
                          className="w-full p-2 text-xs border rounded-lg font-bold focus:border-black transition-colors"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Images */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <label className="text-sm font-medium">Images</label>

                {/* Existing Images */}
                <div className="flex gap-4 mb-2 overflow-x-auto no-scrollbar pb-4 snap-x">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="flex flex-col gap-2 flex-shrink-0 snap-start">
                      <div className="w-28 h-28 rounded-lg border border-gray-200 overflow-hidden relative">
                        <img src={img} className="w-full h-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-1 left-1 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm z-10 pointer-events-none">
                            Primary
                          </div>
                        )}
                        {formData.modelImage === img && (
                          <div className="absolute bottom-1 left-1 bg-yellow-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm z-10 pointer-events-none">
                            Model
                          </div>
                        )}
                      </div>
                      
                      {/* Action Bar (Always visible, below the image) */}
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (idx === 0) return;
                            const newImages = [...formData.images];
                            const temp = newImages[idx - 1];
                            newImages[idx - 1] = newImages[idx];
                            newImages[idx] = temp;
                            setFormData({ ...formData, images: newImages });
                          }}
                          disabled={idx === 0}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Left"
                        >
                          <ChevronLeft size={16} strokeWidth={2.5} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelImage: formData.modelImage === img ? null : img })}
                          className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${formData.modelImage === img ? 'text-yellow-500 bg-yellow-50' : 'text-gray-600'}`}
                          title="Toggle Model Image"
                        >
                          <Star size={14} fill={formData.modelImage === img ? "currentColor" : "none"} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== idx);
                            // Also clear model image if deleted
                            setFormData(prev => ({ 
                              ...prev, 
                              images: newImages,
                              modelImage: prev.modelImage === img ? null : prev.modelImage 
                            }));
                          }}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete Image"
                        >
                          <Trash2 size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (idx === formData.images.length - 1) return;
                            const newImages = [...formData.images];
                            const temp = newImages[idx + 1];
                            newImages[idx + 1] = newImages[idx];
                            newImages[idx] = temp;
                            setFormData({ ...formData, images: newImages });
                          }}
                          disabled={idx === formData.images.length - 1}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Right"
                        >
                          <ChevronRight size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload size={24} className="mb-1" />
                    <span className="text-sm">
                      {isUploading
                        ? "Uploading images..."
                        : "Click to upload images"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inventory Management */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-4 border-t border-gray-100">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Stock Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      readOnly
                      className="w-full border p-3 rounded-lg pl-10 bg-gray-50 text-gray-500 font-bold"
                      value={formData.stockQuantity}
                    />
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Automatic Total from Sizes</p>
                </div>

                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="w-full border p-3 rounded-lg pl-10"
                      value={formData.weight}
                      onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                    />
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <p className="text-[11px] text-gray-400">Used for interstate shipping calculations (₦1,500/kg above 3kg).</p>
                </div>

                <div className="flex flex-col justify-end gap-3 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 accent-black"
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bestSeller}
                      onChange={e => setFormData({ ...formData, bestSeller: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 accent-black"
                    />
                    <span className="text-sm font-medium">Best Seller</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting || isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                  disabled={isSubmitting || isUploading}
                >
                  {(isSubmitting || isUploading) && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
