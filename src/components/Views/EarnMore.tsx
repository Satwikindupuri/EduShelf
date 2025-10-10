import React from "react";
import { Clock } from "lucide-react";

const EarnMore: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-black text-center px-6">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8 max-w-lg">
        <div className="flex justify-center mb-4">
          <Clock className="h-10 w-10 text-yellow-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
          Coming Soon 🚀
        </h1>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          We’re building something exciting! <br />
          Soon, students with great handwriting can earn money by writing
          **notes and assignments** for others. It’s a simple and efficient
          way to help busy students complete their work — while you earn per
          page as a part-time opportunity.
        </p>

        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 italic">
          Stay tuned — “EarnMore” will launch soon on EduShelf!
        </p>
      </div>
    </div>
  );
};

export default EarnMore;
