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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'books'), {
        title: title.trim(),
        subject: subject.trim(),
        category,
        regulation,
        condition,
        year,
        price: price ? Number(price) : null,
        description: description.trim(),
        image_urls: [
          "https://via.placeholder.com/300x400.png?text=Book+Image"
        ], // ✅ default image
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


          <select
            value={regulation}
            onChange={(e) => setRegulation(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Regulation</option>
            <option value="R18">R19</option>
            <option value="R20">R20</option>
            <option value="R22">R23</option>
          </select>

          {/* <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Book Condition</option>
            <option value="Book Condition">Excellent</option>
            <option value="">Good</option>
            <option value="">Fair</option>
            <option value="">Poor</option>
          </select> */}

          {/* <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Year</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select> */}
          
          <input
            type="number"
            placeholder="Selling Price (₹)"
            value={price ?? ''}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <textarea
            placeholder="Please Provide your Name, Year & Branch,Contact Number"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

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
