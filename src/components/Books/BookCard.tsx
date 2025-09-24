import React, { useState } from 'react';
import { User, DollarSign, Tag, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  description: string;
  price: number | null;
  condition: string;
  image_url: string | null;
  is_available: boolean;
  owner_id: string;
  created_at: string;
  profiles?: {
    name: string;
  };
}

interface BookCardProps {
  book: Book;
  onRequestSent?: () => void;
  showRequestButton?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({ book, onRequestSent, showRequestButton = true }) => {
  const { user } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const isOwnBook = user?.uid === book.owner_id;
  const defaultImage =
    'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400';

  const handleRequestBook = async () => {
    if (!user || isOwnBook) return;

    setRequesting(true);
    try {
      await addDoc(collection(db, 'exchange_requests'), {
        book_id: book.id,
        requester_id: user.uid,
        owner_id: book.owner_id,
        message: message.trim(),
        status: 'pending',
        created_at: serverTimestamp(),
      });

      setShowRequestModal(false);
      setMessage('');
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error requesting book:', error);
      alert('Failed to send request. You may have already requested this book.');
    } finally {
      setRequesting(false);
    }
  };

const formatDate = (dateValue: any) => {
  if (!dateValue) return "Unknown";
  const date =
    typeof dateValue.toDate === "function"
      ? dateValue.toDate()
      : new Date(dateValue);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};


  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'good':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
        {/* Book Image */}
        <div className="relative h-48 bg-gray-100">
          <img
            src={book.image_url || defaultImage}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
          {!book.is_available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Not Available
              </span>
            </div>
          )}
        </div>

        {/* Book Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
            <p className="text-gray-600 text-sm mb-2">by {book.author}</p>

            <div className="flex items-center space-x-2 mb-3">
              <span
                className={`px-2 py-1 text-xs font-medium border rounded-full ${getConditionColor(
                  book.condition
                )}`}
              >
                {book.condition}
              </span>
              <div className="flex items-center text-gray-500 text-xs">
                <Tag className="h-3 w-3 mr-1" />
                <span>{book.subject}</span>
              </div>
            </div>
          </div>

          {book.description && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>
          )}

          {/* Price */}
          <div className="mb-4">
            {book.price ? (
              <div className="flex items-center text-green-600 font-semibold">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>${book.price}</span>
              </div>
            ) : (
              <span className="text-blue-600 font-semibold">Free</span>
            )}
          </div>

          {/* Owner and Date */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{book.profiles?.name || 'Unknown User'}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formatDate(book.created_at)}</span>
            </div>
          </div>

          {/* Request Button */}
          {showRequestButton && !isOwnBook && book.is_available && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Request Book</span>
            </button>
          )}

          {isOwnBook && (
            <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
              Your Book
            </div>
          )}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request "{book.title}"</h3>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message to Owner (Optional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Hi! I'm interested in your book..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestBook}
                disabled={requesting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
              >
                {requesting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookCard;
