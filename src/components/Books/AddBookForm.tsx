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
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [condition, setCondition] = useState('Good');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'books'), {
        title: title.trim(),
        author: author.trim(),
        subject: subject.trim(),
        description: description.trim(),
        price: price ? Number(price) : null,
        condition,
        image_url: imageUrl.trim() || null,
        is_available: true,
        owner_id: user.uid,
        created_at: serverTimestamp(), // proper Firestore timestamp
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

        <h2 className="text-2xl font-bold mb-6">Add a New Book</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            placeholder="Your Year & Section"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="text"
            placeholder="Subject(Same as Title)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <input
            type="number"
            placeholder="Price (leave empty if free)"
            value={price ?? ''}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
          </select>

          <input
            type="text"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Adding...' : 'Add Book'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddBookForm;