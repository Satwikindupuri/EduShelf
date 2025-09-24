import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Book,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

interface ExchangeRequest {
  id: string;
  book_id: string;
  requester_id: string;
  owner_id: string;
  status: "pending" | "approved" | "rejected" | "completed";
  message: string;
  created_at: string;
  updated_at: string;
  books?: {
    title: string;
    author: string;
    image_url: string | null;
  };
  requester?: {
    name: string;
    email: string;
  };
}

const RequestsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let q;
      if (activeTab === "received") {
        q = query(
          collection(db, "exchange_requests"),
          where("owner_id", "==", user.uid)
        );
      } else {
        q = query(
          collection(db, "exchange_requests"),
          where("requester_id", "==", user.uid)
        );
      }

      const snapshot = await getDocs(q);
      const data: ExchangeRequest[] = [];

      for (const docSnap of snapshot.docs) {
        const requestData = docSnap.data() as ExchangeRequest;

        // Fetch book details
        let bookData = null;
        if (requestData.book_id) {
          const bookRef = doc(db, "books", requestData.book_id);
          const bookSnap = await getDoc(bookRef);
          if (bookSnap.exists()) {
            bookData = bookSnap.data();
          }
        }

        // Fetch requester details
        let requesterData = null;
        if (requestData.requester_id) {
          const requesterRef = doc(db, "users", requestData.requester_id);
          const requesterSnap = await getDoc(requesterRef);
          if (requesterSnap.exists()) {
            requesterData = requesterSnap.data();
          }
        }

        data.push({
          id: docSnap.id,
          ...requestData,
          books: bookData as any,
          requester: requesterData as any,
        });
      }

      // Sort by created_at (fallback if Firestore index missing)
      data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const requestRef = doc(db, "exchange_requests", requestId);
      await updateDoc(requestRef, {
        status,
        updated_at: new Date().toISOString(),
      });

      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? { ...request, status, updated_at: new Date().toISOString() }
            : request
        )
      );
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const defaultBookImage =
    "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Exchange Requests
        </h1>
        <p className="text-gray-600">Manage book exchange requests</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === "received"
                ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Requests Received</span>
              {requests.filter(
                (r) => r.status === "pending" && activeTab === "received"
              ).length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 ml-2">
                  {
                    requests.filter(
                      (r) => r.status === "pending" && activeTab === "received"
                    ).length
                  }
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === "sent"
                ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <Book className="h-4 w-4" />
              <span>Requests Sent</span>
            </div>
          </button>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
            >
              <div className="flex space-x-4">
                <div className="bg-gray-300 h-20 w-16 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="bg-gray-300 h-4 rounded w-3/4"></div>
                  <div className="bg-gray-300 h-4 rounded w-1/2"></div>
                  <div className="bg-gray-300 h-8 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                {/* Request Info */}
                <div className="flex space-x-4 mb-4 lg:mb-0">
                  {/* Book Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={request.books?.image_url || defaultBookImage}
                      alt={request.books?.title}
                      className="w-20 h-24 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultBookImage;
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {request.books?.title}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium border rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() +
                          request.status.slice(1)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      by {request.books?.author}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>
                          {activeTab === "received"
                            ? `Request from ${request.requester?.name || ""}`
                            : `Request to owner`}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{request.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {activeTab === "received" && request.status === "pending" && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => updateRequestStatus(request.id, "approved")}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => updateRequestStatus(request.id, "rejected")}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {/* Status Icon */}
                <div className="flex items-center justify-end lg:ml-4">
                  {getStatusIcon(request.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === "received"
              ? "No requests received"
              : "No requests sent"}
          </h3>
          <p className="text-gray-600">
            {activeTab === "received"
              ? "When students request your books, they will appear here"
              : "Books you request from other students will appear here"}
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestsView;
