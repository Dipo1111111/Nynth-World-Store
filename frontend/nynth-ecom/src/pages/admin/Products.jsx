import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import {
 fetchProducts,
 addProduct,
 updateProduct,
 deleteProduct,
 updateProductOrderBatch,
 uploadImage
} from "../../api/firebaseFunctions";
import { Loader2, Plus, Edit2, Trash2, X, Upload, Check, ImageIcon, Package, ChevronLeft, ChevronRight, Star, GripVertical, Eye, EyeOff, Ticket } from "lucide-react";
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
 <div ref={setNodeRef} style={style} className={`bg-[#0a0a0a] p-4 rounded-xl border ${isDragging ? "border-white/25 shadow-card opacity-80" : "border-white/10 shadow-card"} flex flex-col gap-3 group transition-all`}>
 <div className="flex gap-4">
 <div className="w-20 h-20 bg-white/[0.07] rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
 {(product.images?.[0] || product.imageUrl) ? (
 <img src={product.images?.[0] || product.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
 ) : (
 <ImageIcon className="w-full h-full p-4 text-[#EDEAE2]/35" />
 )}
 </div>
 <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
 <div>
 <h3 className="font-bold text-[#EDEAE2] text-sm truncate uppercase tracking-tight">{product.title || product.name}</h3>
 <p className="text-[10px] text-[#EDEAE2]/42 font-bold uppercase tracking-widest mt-0.5">{product.category}</p>
 </div>
 <div className="flex items-center justify-between mt-2">
 <span className="font-bold text-sm">₦{product.price?.toLocaleString()}</span>
 <div className="flex items-center gap-1">
 <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider border ${
 product.stockQuantity <= 0 ? "bg-rose-500/[0.14] text-rose-300 border-rose-500/25" :
 product.stockQuantity <= 5 ? "bg-amber-500/[0.14] text-amber-300 border-amber-500/25" :
 "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25"
 }`}>
 {product.stockQuantity <= 0 ? "Out" : `${product.stockQuantity} Left`}
 </span>
 </div>
 </div>
 </div>
 </div>
 <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
 <button {...attributes} {...listeners} className="focus-ring flex items-center justify-center p-2 bg-white/[0.07] text-[#EDEAE2]/42 hover:text-[#EDEAE2] rounded-lg border border-transparent touch-none active:cursor-grabbing cursor-grab">
 <GripVertical size={16} />
 </button>
 <button
 onClick={() => handleTogglePublic(product)}
 className={`focus-ring flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${product.isPublic !== false ? 'bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25' : 'bg-slate-500/[0.18] text-[#EDEAE2]/55 border-slate-500/30 hover:bg-slate-500/35'}`}
 >
 {product.isPublic !== false ? <><Eye size={14}/> Visible</> : <><EyeOff size={14}/> Hidden</>}
 </button>
 <button onClick={() => handleEdit(product)} className="focus-ring flex items-center justify-center p-2 bg-white/[0.07] text-[#EDEAE2]/65 rounded-lg border border-white/10 hover:bg-white/[0.12]">
 <Edit2 size={14} />
 </button>
 <button onClick={() => handleDelete(product.id)} className="focus-ring flex items-center justify-center p-2 bg-rose-500/[0.14] text-rose-300 rounded-lg border border-rose-500/25 hover:bg-rose-500/25">
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
 <tr ref={setNodeRef} style={style} className={`transition-colors ${isDragging ? "bg-white/[0.05] shadow-card ring-1 ring-white/12 opacity-80" : "hover:bg-white/[0.05]"}`}>
 <td className="p-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white/[0.07] rounded-lg overflow-hidden border border-white/10">
 {(product.images?.[0] || product.imageUrl) ? (
 <img src={product.images?.[0] || product.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
 ) : (
 <ImageIcon className="w-full h-full p-3 text-[#EDEAE2]/35" />
 )}
 </div>
 <div>
 <span className="font-bold text-[#EDEAE2] text-sm uppercase tracking-tight block">{product.title || product.name}</span>
 <span className="text-[9px] text-[#EDEAE2]/42 font-bold uppercase tracking-widest">ID: {product.id.slice(0, 8)}</span>
 </div>
 </div>
 </td>
 <td className="p-4 capitalize text-[#EDEAE2]/65 text-sm font-medium">{product.category}</td>
 <td className="p-4 font-bold text-sm">₦{product.price?.toLocaleString()}</td>
 <td className="p-4">
 <div className="flex flex-col gap-1">
 <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider w-fit border ${
 product.stockQuantity <= 0 ? "bg-rose-500/[0.14] text-rose-300 border-rose-500/25" :
 product.stockQuantity <= 5 ? "bg-amber-500/[0.14] text-amber-300 border-amber-500/25" :
 "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25"
 }`}>
 {product.stockQuantity <= 0 ? "Out of Stock" : product.stockQuantity <= 5 ? "Low Stock" : "In Stock"}
 </span>
 <span className="text-[10px] text-[#EDEAE2]/42 font-bold px-1 uppercase tracking-tighter">{product.stockQuantity} UNITS</span>
 </div>
 </td>
 <td className="p-4 text-right">
 <div className="flex justify-end items-center gap-2 transition-all">
 <button
 onClick={() => handleTogglePublic(product)}
 className={`focus-ring p-1.5 rounded-lg border hover:opacity-80 transition-opacity ${product.isPublic !== false ? 'bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25' : 'bg-slate-500/[0.18] text-[#EDEAE2]/55 border-slate-500/30'}`}
 title={product.isPublic !== false ? "Hide from Store" : "Show on Store"}
 >
 {product.isPublic !== false ? <Eye size={16} /> : <EyeOff size={16} />}
 </button>
 <button {...attributes} {...listeners} className="focus-ring p-2 text-[#EDEAE2]/42 hover:text-[#EDEAE2] cursor-grab active:cursor-grabbing touch-none">
 <GripVertical size={16} />
 </button>
 <button onClick={() => handleEdit(product)} className="focus-ring p-2 text-[#EDEAE2]/65 hover:text-[#EDEAE2] hover:bg-white/[0.09] rounded-lg border border-transparent hover:border-white/10">
 <Edit2 size={16} />
 </button>
 <button onClick={() => handleDelete(product.id)} className="focus-ring p-2 text-rose-300 hover:bg-rose-500/[0.14] rounded-lg border border-transparent hover:border-rose-500/25">
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

 // Modal behavior: freeze the page behind the dialog and let Escape close it.
 // Backdrop clicks close through the overlay onClick below.
 useEffect(() => {
 if (!isModalOpen) return;
 const prev = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 const onKey = (e) => { if (e.key === "Escape") setIsModalOpen(false); };
 window.addEventListener("keydown", onKey);
 return () => {
 document.body.style.overflow = prev;
 window.removeEventListener("keydown", onKey);
 };
 }, [isModalOpen]);

 // Form State
 const initialFormState = {
 title: "",
 price: "",
 compareAtPrice: null,
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
  deliveryFeeEnabled: true, // per-product delivery fee switch (tickets default off)
 modelImage: null,
 displayOrder: 999, // Default for new products
 eventDateTime: null, // Ticket (event) products only
 venue: "", // Ticket (event) products only
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
 { value: "tickets", label: "TICKETS (EVENTS)" },
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
 } catch {
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
 compareAtPrice: product.compareAtPrice || null,
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
  deliveryFeeEnabled: product.deliveryFeeEnabled ?? product.category !== "tickets",
 modelImage: product.modelImage || product.modalImage || null,
 eventDateTime: product.eventDateTime
 ? new Date(product.eventDateTime).toLocaleString("sv-SE").slice(0, 16)
 : "",
 venue: product.venue || "",
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
 const url = await uploadImage(compressedFiles[i]);
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

 if (formData.category === "tickets") {
 if (!formData.eventDateTime) {
 toast.error("EVENT DATE & TIME IS REQUIRED FOR TICKETS");
 setIsSubmitting(false);
 return;
 }
  if (!formData.venue.trim()) {
  toast.error("VENUE IS REQUIRED FOR TICKETS");
  setIsSubmitting(false);
  return;
  }
  if (Number(formData.stockQuantity) <= 0) {
  toast.error("SET HOW MANY TICKETS ARE AVAILABLE - 0 KEEPS THE EVENT HIDDEN AND SOLD OUT");
  setIsSubmitting(false);
  return;
  }
  }

 toast.loading(editingId ? "Saving changes..." : "Creating product...", { id: "upload-status" });

 const isTicketProduct = formData.category === "tickets";

 const payload = {
 ...formData,
 deliveryFeeEnabled: formData.deliveryFeeEnabled ?? formData.category !== "tickets",
 availableSizes: isTicketProduct ? [] : formData.sizes,
 availableColors: isTicketProduct ? [] : formData.colors,
 sizeStock: isTicketProduct ? {} : formData.sizeStock,
 weight: isTicketProduct ? 0 : formData.weight,
 eventDateTime: isTicketProduct && formData.eventDateTime
 ? new Date(formData.eventDateTime).toISOString()
 : isTicketProduct ? null : (formData.eventDateTime || null),
 venue: isTicketProduct ? (formData.venue || "") : (formData.venue || null),
 tags: formData.tags,
 price: parseFloat(formData.price),
 compareAtPrice: formData.compareAtPrice || null,
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
   try {
   const success = await deleteProduct(id);
   if (success) {
   toast.success("Product deleted");
   loadProducts();
   } else {
   toast.error("Failed to delete product");
   }
    } catch (error) {
    console.error(error);
    toast.error(error.message || "Failed to delete product");
    }
   }
   };

  const handleTogglePublic = async (product) => {
   const newStatus = product.isPublic === false ? true : false;
   const actionText = newStatus ? 'show' : 'hide';

   if (confirm(`Are you sure you want to ${actionText} "${product.title || product.name}" on the storefront?`)) {
   try {
   const success = await updateProduct(product.id, { isPublic: newStatus });
   if (success) {
   toast.success(newStatus ? "Product is now visible on the store" : "Product is hidden from the store");
   setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isPublic: newStatus } : p));
   } else {
   toast.error("Failed to update visibility");
   }
    } catch (error) {
    console.error(error);
    toast.error(error.message || "Failed to update visibility");
    }
   }
   };

 return (
 <AdminLayout title="Products">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-1">
 {products.length} product{products.length !== 1 ? "s" : ""} · drag rows or long-press cards to reorder
 </p>
 <p className="text-sm text-[#EDEAE2]/55">Keep your catalog ordered and discoverable.</p>
 </div>
 <button
 onClick={handleCreate}
 className="focus-ring btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-4 sm:py-2.5 sm:px-5 shadow-card"
 >
 <Plus size={18} />
 <span>Add Product</span>
 </button>
 </div>

 <div className="bg-transparent sm:bg-[#0a0a0a] sm:rounded-xl sm:border sm:border-white/10 sm:shadow-card overflow-hidden">
 {loading ? (
 <div className="p-12 flex justify-center bg-[#0a0a0a] rounded-xl border border-white/10">
 <Loader2 className="animate-spin text-white/25" size={32} />
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
 <div className="text-center py-20 bg-[#0a0a0a] rounded-xl border border-dashed border-white/22">
 <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.09] flex items-center justify-center mb-3">
 <Package className="h-6 w-6 text-[#EDEAE2]/35" />
 </div>
 <p className="text-[#EDEAE2]/55 text-xs font-bold uppercase tracking-widest">No products found</p>
 </div>
 )}
 </div>
 </SortableContext>
 </DndContext>

 {/* Desktop Table View */}
 <div className="hidden sm:block overflow-x-auto">
 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
 <table className="w-full text-left admin-table">
 <thead className="bg-white/[0.05] border-b border-white/10">
 <tr>
 <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-[#EDEAE2]/42">Product</th>
 <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-[#EDEAE2]/42 whitespace-nowrap">Category</th>
 <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-[#EDEAE2]/42 whitespace-nowrap">Price</th>
 <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-[#EDEAE2]/42">Stock</th>
 <th className="p-4 font-bold text-[10px] tracking-widest uppercase text-[#EDEAE2]/42 text-right">Actions</th>
 </tr>
 </thead>
 <SortableContext items={products.map(p => p.id)} strategy={verticalListSortingStrategy}>
 <tbody className="divide-y divide-white/10">
 {products.map(product => (
 <SortableDesktopRow key={product.id} product={product} handleEdit={handleEdit} handleDelete={handleDelete} handleTogglePublic={handleTogglePublic} />
 ))}
 {products.length === 0 && (
 <tr>
 <td colSpan="5" className="p-12 text-center">
 <div className="w-12 h-12 mx-auto rounded-xl bg-white/[0.09] flex items-center justify-center mb-3">
 <Package className="h-6 w-6 text-[#EDEAE2]/35" />
 </div>
 <p className="text-[#EDEAE2]/55 text-xs font-bold uppercase tracking-widest">No products found</p>
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

 {/* Modal - portaled to document.body so no layout ancestor can offset it.
     m-auto (not items-center) keeps the top reachable on short screens. */}
 {isModalOpen && createPortal(
<div
className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-4 flex animate-in fade-in duration-200"
onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
>
<div
role="dialog"
aria-modal="true"
aria-label={editingId ? "Edit product" : "New product"}
className="bg-[#0a0a0a] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-raised border border-white/10 m-auto animate-in fade-in zoom-in-95 duration-200"
>
 <div className="flex justify-between items-center mb-6">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 mb-1">Catalog</p>
 <h2 className="text-2xl font-bold text-[#EDEAE2]">{editingId ? "Edit Product" : "New Product"}</h2>
 </div>
 <button
 onClick={() => setIsModalOpen(false)}
 className="focus-ring p-2 hover:bg-white/[0.09] rounded-lg transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Title</label>
 <input
 required
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 value={formData.title}
 onChange={e => setFormData({ ...formData, title: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Price (₦)</label>
 <input
 type="number"
 required
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 value={formData.price}
 onChange={e => setFormData({ ...formData, price: e.target.value })}
 />
 </div>
 <div className="space-y-2 md:col-span-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">
 Compare at Price (₦) <span className="text-[#EDEAE2]/42 text-xs normal-case">- optional</span>
 </label>
 <input
 type="number"
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 placeholder="e.g. 15000"
 value={formData.compareAtPrice || ""}
 onChange={e => setFormData({ ...formData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })}
 />
 <p className="text-[11px] text-[#EDEAE2]/42">Original price shown with strikethrough. Leave empty to hide.</p>
 </div>

 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Description</label>
 <textarea
 rows={4}
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 value={formData.description}
 onChange={e => setFormData({ ...formData, description: e.target.value })}
 />
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Category</label>
 <select
 className="w-full px-4 py-3 border border-white/14 rounded-lg bg-[#0a0a0a] focus-ring cursor-pointer"
 value={formData.category}
 onChange={e => setFormData({ ...formData, category: e.target.value })}
 >
 {categories.map(c => (
 <option key={c.value} value={c.value}>{c.label}</option>
 ))}
 </select>
 </div>

 {/* Ticket / Event fields */}
 {formData.category === "tickets" && (
 <div className="space-y-4 pt-4 border-t border-white/10 bg-white/[0.05] p-4 rounded-xl">
 <div className="flex items-center gap-2">
 <Ticket size={16} className="text-[#EDEAE2]" />
 <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]">Event Setup - e-tickets auto-deliver</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Event Date &amp; Time (WAT)</label>
 <input
 type="datetime-local"
 className="w-full px-4 py-3 border border-white/14 rounded-lg bg-[#0a0a0a] focus-ring"
 value={formData.eventDateTime || ""}
 onChange={e => setFormData({ ...formData, eventDateTime: e.target.value })}
 />
 <p className="text-[11px] text-[#EDEAE2]/42">Drives the countdown, sold-out state and e-ticket date.</p>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Venue</label>
 <input
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 placeholder="e.g. Lagos - Eko Hotel Convention Centre"
 value={formData.venue || ""}
 onChange={e => setFormData({ ...formData, venue: e.target.value })}
 />
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Total Tickets Available (Capacity)</label>
 <input
 type="number"
 min="0"
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 value={formData.stockQuantity}
 onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
 />
  <p className="text-[11px] text-[#EDEAE2]/42">Auto-reduced per ticket sold. Hits 0 = SOLD OUT on the storefront. New events must start above 0 or buyers will never see them.</p>
 </div>
 </div>
 )}

 {/* Variants - apparel & headwear only. Tickets are single-format:
 no sizes, no colors, no merchandising badges. */}
 {formData.category !== "tickets" && (
 <div className="space-y-4 pt-4 border-t border-white/10">
 {formData.category !== "headwear" && (
 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-2">Sizes</label>
 <div className="flex flex-wrap gap-2">
 {availableSizes.map(size => (
 <button
 key={size}
 type="button"
 onClick={() => toggleSelection("sizes", size)}
 className={`focus-ring px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[0.98] ${formData.sizes.includes(size)
 ? "bg-[#EDEAE2] text-[#0d0d0f] border-white/25"
 : "bg-[#0a0a0a] text-[#EDEAE2]/65 border-white/14 hover:border-white/60"
 }`}
 >
 {size}
 </button>
 ))}
 </div>
 </div>
 )}

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-2">Colors</label>
 <div className="flex flex-wrap gap-2">
 {availableColors.map(color => (
 <button
 key={color}
 type="button"
 onClick={() => toggleSelection("colors", color)}
 className={`focus-ring px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[0.98] ${formData.colors.includes(color)
 ? "bg-[#EDEAE2] text-[#0d0d0f] border-white/25"
 : "bg-[#0a0a0a] text-[#EDEAE2]/65 border-white/14 hover:border-white/60"
 }`}
 >
 {color}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-2">Tags</label>
 <div className="flex flex-wrap gap-2">
 {availableTags.map(tag => (
 <button
 key={tag}
 type="button"
 onClick={() => toggleSelection("tags", tag)}
 className={`focus-ring px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-[0.98] ${formData.tags.includes(tag)
 ? "bg-[#EDEAE2] text-[#0d0d0f] border-white/25"
 : "bg-[#0a0a0a] text-[#EDEAE2]/65 border-white/14 hover:border-white/60"
 }`}
 >
 {tag}
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {formData.category !== "headwear" && formData.category !== "tickets" ? (
 formData.sizes.length > 0 && (
 <div className="bg-white/[0.05] p-4 rounded-xl border border-white/10 space-y-4">
 <div className="flex justify-between items-center bg-[#0a0a0a] p-3 rounded-lg border border-white/10 shadow-card">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]">Inventory per Size</label>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 border-r border-white/10 pr-3">
 <span className="text-[9px] font-bold text-[#EDEAE2]/42 uppercase tracking-tighter">Bulk Update:</span>
 <div className="flex">
 <input
 id="bulk-stock-input"
 type="number"
 placeholder="0"
 className="w-12 p-1 text-[10px] border border-r-0 rounded-l font-bold text-center focus-ring"
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
 className="px-2 py-1 bg-[#EDEAE2] text-[#0d0d0f] text-[8px] font-bold uppercase rounded-r hover:opacity-90 transition-opacity"
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
 className="text-[9px] font-bold text-rose-300 hover:text-rose-300 uppercase tracking-tighter transition-colors"
 >
 Clear All
 </button>
 </div>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 {formData.sizes.map(size => (
 <div key={size} className="space-y-1">
 <label className="text-[10px] font-bold text-[#EDEAE2]/55">{size}</label>
 <input
 type="number"
 min="0"
 value={formData.sizeStock[size] || 0}
 onChange={(e) => handleSizeStockChange(size, e.target.value)}
 className="w-full p-2 text-xs border border-white/14 rounded-lg font-bold focus-ring"
 />
 </div>
 ))}
 </div>
 </div>
 )
 ) : formData.category === "headwear" ? (
 <div className="space-y-2">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Total Units In Stock</label>
 <input
 type="number"
 min="0"
 placeholder="Enter total quantity"
 className="w-full px-4 py-3 border border-white/14 rounded-lg focus-ring"
 value={formData.stockQuantity}
 onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
 />
 <p className="text-[10px] text-[#EDEAE2]/42 font-bold uppercase tracking-tight italic">
 * Headwear is treat as One Size. Enter total units available across all expandable strap units.
 </p>
 </div>
 ) : null}

 {/* Images */}
 <div className="space-y-2 pt-4 border-t border-white/10">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Images</label>

 {/* Existing Images */}
 <div className="flex gap-4 mb-2 overflow-x-auto no-scrollbar pb-4 snap-x">
 {formData.images.map((img, idx) => (
 <div key={idx} className="flex flex-col gap-2 flex-shrink-0 snap-start">
 <div className="w-28 h-28 rounded-xl border border-white/14 overflow-hidden relative shadow-card">
 <img src={img} className="w-full h-full object-cover" />
 {idx === 0 && (
 <div className="absolute top-1 left-1 bg-[#EDEAE2] text-[#0d0d0f] text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider z-10 pointer-events-none">
 Primary
 </div>
 )}
 {formData.modelImage === img && (
 <div className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider z-10 pointer-events-none">
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
 className="focus-ring p-1.5 rounded-md hover:bg-white/[0.09] text-[#EDEAE2]/65 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 title="Move Left"
 >
 <ChevronLeft size={16} strokeWidth={2.5} />
 </button>

 <button
 type="button"
 onClick={() => setFormData({ ...formData, modelImage: formData.modelImage === img ? null : img })}
 className={`focus-ring p-1.5 rounded-md hover:bg-white/[0.09] transition-colors ${formData.modelImage === img ? 'text-amber-500 bg-amber-500/[0.14]' : 'text-[#EDEAE2]/65'}`}
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
 className="focus-ring p-1.5 rounded-md hover:bg-rose-500/[0.14] text-rose-300 transition-colors"
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
 className="focus-ring p-1.5 rounded-md hover:bg-white/[0.09] text-[#EDEAE2]/65 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
 title="Move Right"
 >
 <ChevronRight size={16} strokeWidth={2.5} />
 </button>
 </div>
 </div>
 ))}
 </div>

 <div className="border-2 border-dashed border-white/26 rounded-xl p-6 text-center cursor-pointer hover:border-white/45 hover:bg-white/[0.05] transition-all relative">
 <input
 type="file"
 multiple
 accept="image/*"
 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
 onChange={handleImageUpload}
 disabled={isUploading}
 />
 <div className="flex flex-col items-center text-[#EDEAE2]/42">
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
 <div className="flex flex-col md:flex-row gap-4 md:gap-8 pt-4 border-t border-white/10">
 {formData.category !== "tickets" && (
 <div className="space-y-2 flex-1">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Stock Quantity</label>
 <div className="relative">
 <input
 type="number"
 min="0"
 readOnly
 className="w-full px-4 py-3 pl-10 border border-white/14 rounded-lg bg-white/[0.05] text-[#EDEAE2]/55 font-bold focus-ring"
 value={formData.stockQuantity}
 />
 <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EDEAE2]/42" size={18} />
 </div>
 <p className="text-[10px] text-[#EDEAE2]/42 font-bold uppercase tracking-tighter">Automatic Total from Sizes</p>
 </div>
 )}

 {formData.category !== "tickets" && (
 <div className="space-y-2 flex-1">
 <label className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 block mb-1.5">Weight (kg)</label>
 <div className="relative">
 <input
 type="number"
 step="0.1"
 min="0"
 className="w-full px-4 py-3 pl-10 border border-white/14 rounded-lg focus-ring"
 value={formData.weight}
 onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
 />
 <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EDEAE2]/42" size={18} />
 </div>
 <p className="text-[11px] text-[#EDEAE2]/42">Used for interstate shipping calculations (₦1,500/kg above 3kg).</p>
 </div>
 )}

 <div className="flex flex-col justify-end gap-3 pb-2">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={formData.featured}
 onChange={e => setFormData({ ...formData, featured: e.target.checked })}
 className="w-4 h-4 rounded border-white/32 accent-[#EDEAE2]"
 />
 <span className="text-sm font-medium">Featured</span>
 </label>

  {formData.category !== "tickets" && (
  <label className="flex items-center gap-2 cursor-pointer">
  <input
  type="checkbox"
  checked={formData.bestSeller}
  onChange={e => setFormData({ ...formData, bestSeller: e.target.checked })}
  className="w-4 h-4 rounded border-white/32 accent-[#EDEAE2]"
  />
  <span className="text-sm font-medium">Best Seller</span>
  </label>
  )}
  <label className="flex items-center gap-2 cursor-pointer" title="When off, this product never adds a delivery fee at checkout">
  <input
  type="checkbox"
  checked={formData.deliveryFeeEnabled ?? formData.category !== "tickets"}
  onChange={e => setFormData({ ...formData, deliveryFeeEnabled: e.target.checked })}
  className="w-4 h-4 rounded border-white/32 accent-[#EDEAE2]"
  />
  <span className="text-sm font-medium">Enable Delivery Fee</span>
  </label>
 </div>
 </div>

 <div className="pt-6 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setIsModalOpen(false)}
 className="focus-ring px-6 py-2.5 border border-white/18 rounded-lg hover:bg-white/[0.05]"
 disabled={isSubmitting || isUploading}
 >
 Cancel
 </button>
 <button
 type="submit"
 className="focus-ring px-6 py-2.5 bg-[#EDEAE2] text-[#0d0d0f] rounded-lg hover:opacity-90 shadow-card flex items-center gap-2"
 disabled={isSubmitting || isUploading}
 >
 {(isSubmitting || isUploading) && <Loader2 className="animate-spin" size={16} />}
 {editingId ? "Save Changes" : "Create Product"}
 </button>
 </div>
  </form>
  </div>
  </div>,
  document.body
  )}
  </AdminLayout>
 );
}