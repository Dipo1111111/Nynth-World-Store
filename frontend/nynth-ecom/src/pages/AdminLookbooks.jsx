import React, { useState, useEffect } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { fetchLookbooks, uploadImage } from "../api/firebaseFunctions";
import { db } from "../api/firebase";
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Plus, Trash2, Edit2, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { compressImage } from "../utils/imageUtils";

export default function AdminLookbooks() {
    const [lookbooks, setLookbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        season: "",
        image: null,
        imageUrl: "",
        featured: false,
        colorPalette: "",
        productTags: "" // comma separated
    });

    const loadLookbooks = async () => {
        try {
            setLoading(true);
            const data = await fetchLookbooks();
            setLookbooks(data);
        } catch (error) {
            toast.error("Failed to load lookbooks");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLookbooks();
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSubmitting(true);

            let finalImageUrl = formData.imageUrl;

            if (formData.image) {
                toast.loading("Compressing look image...", { id: "look-upload" });
                const compressedFile = await compressImage(formData.image, { maxSizeMB: 1.5 });
                toast.loading("Uploading look image...", { id: "look-upload" });
                finalImageUrl = await uploadImage(compressedFile);
                toast.success("Image uploaded", { id: "look-upload" });
            }

            if (!finalImageUrl) {
                throw new Error("Please upload an image or provide a URL");
            }

            await addDoc(collection(db, "lookbooks"), {
                title: formData.title,
                description: formData.description,
                season: formData.season,
                image: finalImageUrl,
                featured: formData.featured,
                colorPalette: formData.colorPalette,
                products: formData.productTags.split(",").map(t => t.trim()).filter(Boolean),
                created_at: serverTimestamp()
            });

            toast.success("Lookbook added successfully!");
            setIsModalOpen(false);
            setFormData({
                title: "",
                description: "",
                season: "",
                image: null,
                imageUrl: "",
                featured: false,
                colorPalette: "",
                productTags: ""
            });
            loadLookbooks();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add lookbook: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this lookbook?")) return;
        try {
            await deleteDoc(doc(db, "lookbooks", id));
            toast.success("Lookbook deleted");
            loadLookbooks();
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <AdminLayout title="Lookbook Management">
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add New Look
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lookbooks.map((look) => (
                        <div key={look.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group">
                            <div className="aspect-[3/4] relative bg-gray-100">
                                <img src={look.image} alt={look.title} className="w-full h-full object-cover" />
                                {look.featured && (
                                    <span className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                                        Featured
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg mb-1">{look.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{look.description}</p>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-400">{look.season}</span>
                                    <button
                                        onClick={() => handleDelete(look.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
                        <h2 className="text-2xl font-bold mb-6">Add Lookbook Entry</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        required
                                        className="w-full border rounded-lg p-3"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Season</label>
                                    <input
                                        className="w-full border rounded-lg p-3"
                                        placeholder="SS24"
                                        value={formData.season}
                                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full border rounded-lg p-3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Upload Image</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 bg-gray-50 relative">
                                    <input
                                        type="file"
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {formData.image ? (
                                        <div className="flex items-center justify-center gap-2 text-green-600">
                                            <CheckCircle size={20} />
                                            <span>{formData.image.name}</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-400">
                                            <Upload size={32} className="mb-2" />
                                            <span>Click to upload image</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Color Palette</label>
                                    <input
                                        className="w-full border rounded-lg p-3"
                                        placeholder="Black, White, Grey"
                                        value={formData.colorPalette}
                                        onChange={(e) => setFormData({ ...formData, colorPalette: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Product Tags</label>
                                    <input
                                        className="w-full border rounded-lg p-3"
                                        placeholder="Hoodie, Tee (comma separated)"
                                        value={formData.productTags}
                                        onChange={(e) => setFormData({ ...formData, productTags: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="featured" className="text-sm font-medium">Feature on Homepage</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Creating..." : "Create Look"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
