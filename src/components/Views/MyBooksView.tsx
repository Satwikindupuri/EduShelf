import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BookCard from '../Books/BookCard';
import AddBookForm from '../Books/AddBookForm';
import { db } from '../../lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';

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
  created_at: Timestamp | null;
}

const MyBooksView: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  const fetchMyBooks = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'books'),
        where('owner_id', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      const booksData: Book[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          created_at: data.created_at || null,
        } as Book;
      });

      setBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (bookId: string, currentStatus: boolean) => {
    try {
      const bookRef = doc(db, 'books', bookId);
      await updateDoc(bookRef, { is_available: !currentStatus });

      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId ? { ...book, is_available: !currentStatus } : book
        )
      );
    } catch (error) {
      console.error('Error updating book:', error);
      alert('Failed to update book availability');
    }
  };

  const deleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      const bookRef = doc(db, 'books', bookId);
      await deleteDoc(bookRef);

      setBooks((prev) => prev.filter((book) => book.id !== bookId));
    } catch (error) {
      console.error('Error deleting book:', error);
      alert('Failed to delete book');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Books</h1>
          <p className="text-gray-600">Manage the books you've listed for exchange</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Books</p>
              <p className="text-2xl font-bold text-gray-900">{books.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">
                {books.filter((book) => book.is_available).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-gray-100 p-2 rounded-lg">
              <EyeOff className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Unavailable</p>
              <p className="text-2xl font-bold text-gray-900">
                {books.filter((book) => !book.is_available).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                <div className="bg-gray-300 h-8 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="relative">
              <BookCard book={book} showRequestButton={false} />

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <button
                  onClick={() => toggleAvailability(book.id, book.is_available)}
                  className={`p-2 rounded-lg shadow-sm transition-colors ${
                    book.is_available
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={book.is_available ? 'Mark as unavailable' : 'Mark as available'}
                >
                  {book.is_available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <button
                  onClick={() => deleteBook(book.id)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg shadow-sm hover:bg-red-200 transition-colors"
                  title="Delete book"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first book to the exchange</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add Your First Book</span>
          </button>
        </div>
      )}

      {/* Add Book Modal */}
      {showAddForm && <AddBookForm onClose={() => setShowAddForm(false)} onBookAdded={fetchMyBooks} />}
    </div>
  );
};

export default MyBooksView;