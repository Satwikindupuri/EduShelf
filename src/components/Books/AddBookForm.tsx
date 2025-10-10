import React, { useState } from 'react';
import { X } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface AddBookFormProps {
  onClose: () => void;
  onBookAdded: () => void;
}

const AddBookForm: React.FC<AddBookFormProps> = ({ onClose, onBookAdded }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [regulation, setRegulation] = useState('');
  const [condition, setCondition] = useState('Good');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🖼️ New states for images
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 🖼️ Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files).slice(0, 3); // limit to 3
    setImages(selectedFiles);
    setPreviewUrls(selectedFiles.map(file => URL.createObjectURL(file)));
  };

  // 📄 Convert image to base64 (for Free Tier testing)
  const convertToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 🖼️ "Upload" images as base64 strings
  const uploadImages = async () => {
    const urls: string[] = [];
    for (const file of images) {
      const base64 = await convertToBase64(file);
      urls.push(base64);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages(); // convert to base64
      } else {
        imageUrls = ["https://via.placeholder.com/300x400.png?text=Book+Image"]; // default
      }

      await addDoc(collection(db, 'books'), {
        title: title.trim(),
        subject: subject.trim(),
        category,
        regulation,
        condition,
        year,
        price: price ? Number(price) : null,
        description: description.trim(),
        image_urls: imageUrls, // ✅ base64 or default URL
        is_available: true,
        owner_id: user.uid,
        created_at: serverTimestamp(),
      });

      onBookAdded();
      onClose();
    } catch (error) {
      console.error('Error adding book:', error);
      alert('Failed to add book. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6">List Book for Sale</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Book Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            placeholder="Branch"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Regulation */}
          <select
            value={regulation}
            onChange={(e) => setRegulation(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Regulation</option>
            <option value="R19">R19</option>
            <option value="R20">R20</option>
            <option value="R23">R23</option>
          </select>

          {/* Price */}
          <input
            type="number"
            placeholder="Selling Price (₹)"
            value={price ?? ''}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* Description / Notes */}
          <textarea
            placeholder="Please Provide your Name, Year & Branch."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          {/* 🖼️ Image Upload Section */}
          <div>
            <label className="block font-medium mb-1">Upload Images (max 3)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="w-full border rounded-lg px-4 py-2"
            />

            {/* 🖼️ Preview selected images */}
            {previewUrls.length > 0 && (
              <div className="flex gap-2 mt-2">
                {previewUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Listing...' : 'List Book for Sale'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBookForm;
