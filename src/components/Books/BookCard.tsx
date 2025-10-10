import React, { useState, useEffect } from 'react';
import { User, DollarSign, Tag, Clock, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { IndianRupee } from "lucide-react";


interface Book {
  id: string;
  title: string;
  author: string;
  subject: string;
  description: string;
  price: number | null;
  condition: string;
  image_urls?: string[];
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
  const [requestSent, setRequestSent] = useState(false);
  const [message, setMessage] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwnBook = user?.uid === book.owner_id;
  const defaultImage =
    'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400';

  useEffect(() => {
    const checkRequestStatus = async () => {
      if (!user) return;
      const q = query(
        collection(db, 'exchange_requests'),
        where('book_id', '==', book.id),
        where('requester_id', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setRequestSent(true);
    };
    checkRequestStatus();
  }, [book.id, user]);

  const handleRequestBook = async () => {
    if (!user || isOwnBook || requestSent) return;

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

      setRequestSent(true);
      setShowRequestModal(false);
      setMessage('');
      onRequestSent?.();
    } catch (error: any) {
      console.error('Error requesting book:', error);
      alert('Failed to send request.');
    } finally {
      setRequesting(false);
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Unknown';
    try {
      const date = typeof dateValue.toDate === 'function' ? dateValue.toDate() : new Date(dateValue);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Slider logic
  const images = book.image_urls && book.image_urls.length > 0 ? book.image_urls : [defaultImage];

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      {/* Book Card */}
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200">
        {/* Book Image Slider */}
        <div className="relative h-48 bg-gray-100">
          <img
            src={images[currentImageIndex]}
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).src = defaultImage)}
          />

          {/* Left/Right Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-30 text-white p-1 rounded-full hover:bg-opacity-60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

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
            <p className="text-gray-600 text-sm mb-2">{book.author}</p>
            <div className="flex items-center space-x-2 mb-3">
              <span className={`px-2 py-1 text-xs font-medium border rounded-full ${getConditionColor(book.condition)}`}>
                {book.condition}
              </span>
              <div className="flex items-center text-gray-500 text-xs">
                <Tag className="h-3 w-3 mr-1" />
                <span>{book.subject}</span>
              </div>
            </div>
          </div>

          {book.description && <p className="text-gray-700 text-sm mb-4 line-clamp-3">{book.description}</p>}


          {/* Price */}
          <div className="mb-4">
            {book.price ? (
              <div className="flex items-center text-green-600 font-semibold text-lg">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span className="text-lg">{book.price}</span>
              </div>
            ) : (
              <span className="text-blue-600 font-semibold text-lg">Free</span>
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
              onClick={() => !requestSent && setShowRequestModal(true)}
              disabled={requestSent}
              className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                requestSent
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{requestSent ? 'Request Sent' : 'Request Book'}</span>
            </button>
          )}

          {isOwnBook && (
            <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">Your Book</div>
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
                disabled={requesting || requestSent}
                className={`flex-1 py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-all duration-200 ${
                  requestSent || requesting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700'
                }`}
              >
                {requesting ? 'Sending...' : requestSent ? 'Request Sent' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookCard;
