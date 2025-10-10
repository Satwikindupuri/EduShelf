import React, { useState, useEffect } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import BookCard from "../Books/BookCard";
import AddBookForm from "../Books/AddBookForm";
import { useAuth } from "../../contexts/AuthContext";

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
  regulation?: string;
  profiles?: {
    name: string;
  };
}

interface HomeViewProps {
  darkMode?: boolean; // Dark mode prop
}

const HomeView: React.FC<HomeViewProps> = ({ darkMode = false }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedRegulation, setSelectedRegulation] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const booksRef = collection(db, "books");
      const q = query(booksRef, where("is_available", "==", true));
      const snapshot = await getDocs(q);
      const data: Book[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Book[];

      const requestsRef = collection(db, "exchange_requests");
      const requestsSnapshot = await getDocs(requestsRef);
      const approvedBookIds = requestsSnapshot.docs
        .filter((req) => req.data().status === "approved")
        .map((req) => req.data().book_id);

      const filteredData = data.filter((book) => !approvedBookIds.includes(book.id));
      setBooks(filteredData);

      const uniqueSubjects = Array.from(new Set(filteredData.map((book) => book.subject)));
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (user && book.owner_id === user.uid) return false;

    const title = book.title?.toLowerCase() || "";
    const matchesSearch = title.includes(searchTerm.toLowerCase());
    const matchesSubject = !selectedSubject || book.subject === selectedSubject;
    const matchesRegulation = !selectedRegulation || book.regulation === selectedRegulation;

    return matchesSearch && matchesSubject && matchesRegulation;
  });

  const bgClass = darkMode ? "bg-gray-900" : "bg-white";
  const textClass = darkMode ? "text-gray-100" : "text-gray-900";
  const borderClass = darkMode ? "border-gray-700" : "border-gray-200";
  const inputBgClass = darkMode ? "bg-gray-800 text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-400";

  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Available Books</h1>
          <p className={`text-gray-600 dark:text-gray-400`}>
            Discover and request books & written notes from your fellow students
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className={`${bgClass} rounded-xl shadow-sm border ${borderClass} p-6 mb-8`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Box */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by book title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${borderClass} ${inputBgClass}`}
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${borderClass} ${inputBgClass}`}
            >
              <option value="">All Branches</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {/* Regulation Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedRegulation}
              onChange={(e) => setSelectedRegulation(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none ${borderClass} ${inputBgClass}`}
            >
              <option value="">All Regulations</option>
              <option value="R19">R19</option>
              <option value="R20">R20</option>
              <option value="R23">R23</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book Count */}
      <div className="mb-6">
        <p className={`text-gray-600 dark:text-gray-400`}>
          {loading
            ? "Loading..."
            : `${filteredBooks.length} book${filteredBooks.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Book Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={`${bgClass} rounded-xl shadow-md p-6 animate-pulse`}>
              <div className="bg-gray-300 dark:bg-gray-700 h-48 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="bg-gray-300 dark:bg-gray-700 h-4 rounded w-3/4"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-4 rounded w-1/2"></div>
                <div className="bg-gray-300 dark:bg-gray-700 h-8 rounded mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onRequestSent={fetchBooks} darkMode={darkMode} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${textClass}`}>No books found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || selectedSubject || selectedRegulation
              ? "Try adjusting your search criteria"
              : "Be the first to add a book to the exchange!"}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            <span>Add First Book</span>
          </button>
        </div>
      )}

      {showAddForm && <AddBookForm onClose={() => setShowAddForm(false)} onBookAdded={fetchBooks} />}
    </div>
  );
};

export default HomeView;
