-- Fix RLS policies to include assigned_reviewer_id_2 for ethics_submissions and ethics_attachments
DROP POLICY IF EXISTS "Allow users to view their own submissions or assigned reviews" ON public.ethics_submissions;
CREATE POLICY "Allow users to view their own submissions or assigned reviews" 
ON public.ethics_submissions FOR SELECT 
USING (
  auth.uid() = submitter_id 
  OR auth.uid() = assigned_reviewer_id 
  OR auth.uid() = assigned_reviewer_id_2 
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role LIKE '%admin%'))
);

DROP POLICY IF EXISTS "Allow admins and assigned reviewers to update submissions" ON public.ethics_submissions;
CREATE POLICY "Allow admins and assigned reviewers to update submissions" 
ON public.ethics_submissions FOR UPDATE 
USING (
  auth.uid() = assigned_reviewer_id 
  OR auth.uid() = assigned_reviewer_id_2 
  OR auth.uid() = submitter_id 
  OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role LIKE '%admin%'))
);

DROP POLICY IF EXISTS "Allow read for related users, reviewers, or admins" ON public.ethics_attachments;
CREATE POLICY "Allow read for related users, reviewers, or admins" 
ON public.ethics_attachments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM ethics_submissions 
    WHERE ethics_submissions.id = ethics_attachments.submission_id 
      AND (
        ethics_submissions.submitter_id = auth.uid() 
        OR ethics_submissions.assigned_reviewer_id = auth.uid() 
        OR ethics_submissions.assigned_reviewer_id_2 = auth.uid() 
        OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role LIKE '%admin%'))
      )
  )
);
