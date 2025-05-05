
-- Create a storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Set up security policies for the avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Only authenticated users can upload avatars
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Only users can update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);

-- Only users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = (storage.foldername(name))[1]::uuid);
