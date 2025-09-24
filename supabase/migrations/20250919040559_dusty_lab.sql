/*
  # Book Exchange Application Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `created_at` (timestamp)

    - `books`
      - `id` (uuid, primary key)
      - `title` (text)
      - `author` (text)
      - `subject` (text)
      - `description` (text)
      - `price` (numeric, nullable for free books)
      - `condition` (text)
      - `image_url` (text, nullable)
      - `is_available` (boolean)
      - `owner_id` (uuid, references profiles)
      - `created_at` (timestamp)

    - `exchange_requests`
      - `id` (uuid, primary key)
      - `book_id` (uuid, references books)
      - `requester_id` (uuid, references profiles)
      - `owner_id` (uuid, references profiles)
      - `status` (text: 'pending', 'approved', 'rejected', 'completed')
      - `message` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow read access to books and profiles for all authenticated users
    - Restrict exchange request access to involved parties only
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  subject text NOT NULL,
  description text DEFAULT '',
  price numeric DEFAULT NULL,
  condition text NOT NULL DEFAULT 'good',
  image_url text DEFAULT NULL,
  is_available boolean DEFAULT true,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create exchange_requests table
CREATE TABLE IF NOT EXISTS exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own books"
  ON books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Exchange requests policies
CREATE POLICY "Users can read requests involving them"
  ON exchange_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = owner_id);

CREATE POLICY "Users can create requests for others' books"
  ON exchange_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id AND auth.uid() != owner_id);

CREATE POLICY "Book owners can update request status"
  ON exchange_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for exchange_requests
CREATE TRIGGER update_exchange_requests_updated_at
  BEFORE UPDATE ON exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_books_owner_id ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_is_available ON books(is_available);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_book_id ON exchange_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester_id ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_owner_id ON exchange_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_status ON exchange_requests(status);

-- Prevent duplicate requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
  ON exchange_requests(book_id, requester_id)
  WHERE status = 'pending';