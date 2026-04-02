import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchLookbooks, uploadImage } from "../../api/firebaseFunctions";
import { db } from "../../api/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp, onSnapshot, getDocs } from "firebase/firestore";
import { Loader2, Plus, Trash2, Upload, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { compressImage } from "../../utils/imageUtils";

export default function AdminLookbooks() {
    const [lookbooks, setLookbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State - Minimal
    const initialFormState = {
        image: null,
        imageUrl: ""
    };

    const [formData, setFormData] = useState(initialFormState);
    const [submitStep, setSubmitStep] = useState(""); // "", "compressing", "uploading", "saving"

    const loadLookbooks = async (isManual = false) => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "lookbooks"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            data.sort((a, b) => {
                const dateA = a.created_at?.seconds || 0;
                const dateB = b.created_at?.seconds || 0;
                return dateB - dateA;
            });
            
            setLookbooks(data);
            if (isManual) toast.success("Refreshed!");
        } catch (error) {
            console.error("Manual Fetch Error:", error);
            toast.error("Failed to fetch lookbooks: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        const q = collection(db, "lookbooks");
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                data.sort((a, b) => {
                    const dateA = a.created_at?.seconds || 0;
                    const dateB = b.created_at?.seconds || 0;
                    return dateB - dateA;
                });
                setLookbooks(data);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore Sync Error (Lookbooks):", error);
                if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
                    loadLookbooks();
                } else {
                    toast.error("Real-time sync failed.");
                    setLoading(false);
                }
            }
        );
        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setFormData(initialFormState);
        setSubmitStep("");
    };

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            setFormData({ ...formData, image: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.image && !formData.imageUrl) {
            toast.error("Please select an image");
            return;
        }

        try {
            setIsSubmitting(true);
            let finalImageUrl = formData.imageUrl;

            if (formData.image) {
                setSubmitStep("compressing");
                toast.loading("Compressing look image...", { id: "look-upload" });
                const compressedFile = await compressImage(formData.image, { maxSizeMB: 1.5 });
                
                setSubmitStep("uploading");
                toast.loading("Uploading look image...", { id: "look-upload" });
                finalImageUrl = await uploadImage(compressedFile);
                toast.success("Image uploaded", { id: "look-upload" });
            }

            setSubmitStep("saving");
            await addDoc(collection(db, "lookbooks"), {
                image: finalImageUrl,
                created_at: serverTimestamp()
            });

            toast.success("Look added successfully!");
            setIsModalOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            toast.error("Failed to add look: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this look?")) return;
        try {
            await deleteDoc(doc(db, "lookbooks", id));
            toast.success("Look deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    return (
        <AdminLayout title="Lookbook Management">
            <div className="mb-6 flex justify-end gap-3">
                <button
                    onClick={() => loadLookbooks(true)}
                    className="px-4 py-2 border border-gray-200 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                    Refresh
                </button>
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
            ) : lookbooks.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-space font-bold mb-2">No Looks Found</h3>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
                        >
                            <Plus size={18} />
                            Add New Look
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {lookbooks.map((look) => (
                        <div key={look.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden group relative aspect-[3/4]">
                            <img src={look.image} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(look.id)}
                                    className="bg-white text-red-500 p-3 rounded-full hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Visual-First Modal */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setIsModalOpen(false);
                            resetForm();
                        }
                    }}
                >
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 md:p-8">
                        <h2 className="text-2xl font-bold mb-6">Add New Look</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 bg-gray-50 relative">
                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {formData.image ? (
                                    <div className="flex flex-col items-center gap-2 text-green-600">
                                        <CheckCircle size={32} />
                                        <span className="text-sm font-medium">{formData.image.name}</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-400">
                                        <Upload size={48} className="mb-4" />
                                        <span className="font-bold uppercase tracking-widest text-xs">Select Image</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-2 border rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 min-w-[140px] flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={14} />
                                            <span>
                                                {submitStep === "compressing" ? "COMPRESSING..." : 
                                                 submitStep === "uploading" ? "UPLOADING..." : 
                                                 "SAVING..."}
                                            </span>
                                        </>
                                    ) : "CREATE LOOK"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
