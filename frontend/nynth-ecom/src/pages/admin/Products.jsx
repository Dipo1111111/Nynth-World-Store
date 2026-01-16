import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import {
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  uploadMultipleImages
} from "../../api/firebaseFunctions";
import { Loader2, Plus, Edit2, Trash2, X, Upload, Check, ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageUtils";

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
    inStock: true,
    featured: false,
    bestSeller: false,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [uploadFiles, setUploadFiles] = useState([]); // Files to upload

  const categories = [
    { value: "tees", label: "Tees" },
    { value: "hoodies", label: "Hoodies" },
    { value: "headwear", label: "Headwear" },
    { value: "accessories", label: "Accessories" },
    { value: "pants", label: "Pants" },
  ];

  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const availableColors = ["Black", "White", "Grey", "Navy", "Beige", "Red"];

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
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
      images: product.images || (product.imageUrl ? [product.imageUrl] : []),
      sizes: product.sizes || [],
      colors: product.colors || [],
      inStock: product.inStock !== false,
      featured: product.featured || false,
      bestSeller: product.bestSeller || false,
    });
    setUploadFiles([]);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setUploadFiles([]);
    setIsModalOpen(true);
  };

  const toggleSelection = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Upload new images if any
      let newImageUrls = [];
      if (uploadFiles.length > 0) {
        toast.loading("Compressing images...", { id: "upload-status" });
        const compressedFiles = await Promise.all(
          uploadFiles.map(file => compressImage(file))
        );
        toast.loading("Uploading images...", { id: "upload-status" });
        newImageUrls = await uploadMultipleImages(compressedFiles);
        toast.success("Images uploaded", { id: "upload-status" });
      }

      // Combine existing images (that verify user didn't delete) and new ones
      // For now, simple append. Ideally manage deletions too.
      const finalImages = [...formData.images, ...newImageUrls];

      // If no images at all, use placeholder (or require one)
      if (finalImages.length === 0) {
        toast.error("At least one image is required");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        images: finalImages,
        // Helper field for old code that expects imageUrl
        imageUrl: finalImages[0],
        updated_at: new Date()
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Product updated successfully");
      } else {
        await addProduct(payload);
        toast.success("Product created successfully");
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
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

  return (
    <AdminLayout title="Products">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-medium text-gray-500">Product</th>
                <th className="p-4 font-medium text-gray-500">Category</th>
                <th className="p-4 font-medium text-gray-500">Price</th>
                <th className="p-4 font-medium text-gray-500">Stock</th>
                <th className="p-4 font-medium text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 group">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {(product.images?.[0] || product.imageUrl) ? (
                          <img
                            src={product.images?.[0] || product.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-full h-full p-3 text-gray-300" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{product.title || product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 capitalize text-gray-600">{product.category}</td>
                  <td className="p-4 font-medium">₦{product.price?.toLocaleString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.inStock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Images */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <label className="text-sm font-medium">Images</label>

                {/* Existing Images */}
                <div className="flex gap-2 mb-2 overflow-x-auto">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden relative flex-shrink-0">
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        {/* Delete logic would go here */}
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
                    onChange={e => setUploadFiles(Array.from(e.target.files))}
                  />
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload size={24} className="mb-1" />
                    <span className="text-sm">
                      {uploadFiles.length > 0
                        ? `${uploadFiles.length} files selected`
                        : "Click to upload images"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.inStock}
                    onChange={e => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Featured</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bestSeller}
                    onChange={e => setFormData({ ...formData, bestSeller: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Best Seller</span>
                </label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-black text-white rounded-lg hover:opacity-90 flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={16} />}
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
