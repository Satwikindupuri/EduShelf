import React, { useState, useEffect } from "react";
import { MessageSquare, Clock, CheckCircle, XCircle, User, Book, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
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
    description: string;
    image_url: string | null;
  };
  requester?: {
    phone?: string;
  };
  owner?: {
    phone?: string;
  };
}

const RequestsView: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ExchangeRequest | null>(null);

  useEffect(() => {
    if (user) fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab]);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const q =
        activeTab === "received"
          ? query(collection(db, "exchange_requests"), where("owner_id", "==", user.uid))
          : query(collection(db, "exchange_requests"), where("requester_id", "==", user.uid));

      const snapshot = await getDocs(q);
      const data: ExchangeRequest[] = [];

      for (const docSnap of snapshot.docs) {
        const requestData = docSnap.data() as ExchangeRequest;

        // Fetch book details
        let bookData = null;
        if (requestData.book_id) {
          const bookRef = doc(db, "books", requestData.book_id);
          const bookSnap = await getDoc(bookRef);
          if (bookSnap.exists()) bookData = bookSnap.data();
        }

        // Fetch requester phone from profiles
        let requesterData = null;
        if (requestData.requester_id) {
          const profileRef = doc(db, "profiles", requestData.requester_id);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) requesterData = { phone: profileSnap.data()?.phone };
          else console.log("Requester profile not found:", requestData.requester_id);
        }

        // Fetch owner phone from profiles
        let ownerData = null;
        if (requestData.owner_id) {
          const profileRef = doc(db, "profiles", requestData.owner_id);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) ownerData = { phone: profileSnap.data()?.phone };
          else console.log("Owner profile not found:", requestData.owner_id);
        }

        data.push({
          ...requestData,
          id: docSnap.id,
          books: bookData as any,
          requester: requesterData as any,
          owner: ownerData as any,
        });
      }

      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: "approved" | "rejected") => {
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const defaultBookImage =
    "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Book Exchange Requests</h1>
        <p className="text-gray-600 text-lg">Manage your incoming and outgoing requests with ease.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-300 ease-in-out ${
              activeTab === "received"
                ? "border-b-4 border-blue-500 text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Requests Received</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 py-4 px-6 text-sm font-semibold transition-all duration-300 ease-in-out ${
              activeTab === "sent"
                ? "border-b-4 border-blue-500 text-blue-600 bg-blue-50"
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
        <p className="text-center text-gray-500 mt-10">Loading requests... ⏳</p>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 transform transition-all duration-300 hover:shadow-xl hover:scale-105"
              onClick={() => setSelectedRequest(request)}
            >
              <div className="flex items-start space-x-4">
                <img
                  src={request.books?.image_url || defaultBookImage}
                  alt={request.books?.title}
                  className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                  onError={(e) => ((e.target as HTMLImageElement).src = defaultBookImage)}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {request.books?.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 truncate">{request.books?.description}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                    <Clock size={16} />
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium border rounded-full ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status.toUpperCase()}
                  </span>
                  
                  {/* Action Buttons for received requests */}
                  {activeTab === "received" && request.status === "pending" && (
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRequestStatus(request.id, "approved");
                        }}
                        className="flex-1 bg-green-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRequestStatus(request.id, "rejected");
                        }}
                        className="flex-1 bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Message Button */}
                  {request.status === "approved" && (activeTab === "received" ? request.requester?.phone : request.owner?.phone) && (
                    <a
                      href={`https://wa.me/+91${activeTab === "received" ? request.requester?.phone : request.owner?.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // Prevent modal from opening
                      className="mt-4 inline-block"
                    >
                      <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        Message on WhatsApp 💬
                      </button>
                    </a>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl shadow-lg border border-gray-200">
          <p className="text-gray-500 text-xl font-medium">No requests found.</p>
          <p className="text-gray-400 mt-2">You haven't received or sent any requests yet.</p>
        </div>
      )}

      {/* Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 relative shadow-2xl animate-fade-in">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedRequest.books?.title}</h2>
              <p className="text-gray-500 text-sm">
                Request {activeTab === "received" ? "from" : "to"}:{" "}
                <span className="font-medium text-gray-700">
                  {activeTab === "received" ? selectedRequest.requester_id : selectedRequest.owner_id}
                </span>
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <span className="text-gray-600 font-medium">Status:</span>
                <span
                  className={`ml-2 px-3 py-1 text-sm font-semibold border rounded-full ${getStatusColor(
                    selectedRequest.status
                  )}`}
                >
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                <span className="font-medium text-gray-700">Message:</span> {selectedRequest.message || "No message provided."}
              </p>
            </div>

            {/* Modal Action Buttons for received requests */}
            {activeTab === "received" && selectedRequest.status === "pending" && (
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "approved");
                    setSelectedRequest(null);
                  }}
                  className="flex-1 bg-green-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={20} className="inline-block mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    updateRequestStatus(selectedRequest.id, "rejected");
                    setSelectedRequest(null);
                  }}
                  className="flex-1 bg-red-600 text-white rounded-lg px-6 py-3 font-semibold hover:bg-red-700 transition-colors"
                >
                  <XCircle size={20} className="inline-block mr-2" />
                  Reject
                </button>
              </div>
            )}

            {/* Modal Message Button */}
            {(selectedRequest.status === "approved" && (activeTab === "received" ? selectedRequest.requester?.phone : selectedRequest.owner?.phone)) && (
              <a
                href={`https://wa.me/+91${activeTab === "received" ? selectedRequest.requester?.phone : selectedRequest.owner?.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block w-full"
              >
                <button className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-lg font-medium transition-colors">
                  Message on WhatsApp 💬
                </button>
              </a>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsView;