export interface EthicsSubmission {
  id: string
  project_title: string
  project_description?: string
  status: string
  assigned_reviewer_id?: string
  assigned_reviewer_id_2?: string
  submitter_id?: string
  reviewer_notes?: string
  created_at: string
  updated_at?: string
  profiles?: {
    email?: string
    full_name?: string
  }
}

export interface EthicsAttachment {
  id: string
  submission_id: string
  file_url: string
  file_name?: string
  file_type?: string
  uploaded_at?: string
}

export interface EthicsEvaluation {
  id: string
  submission_id: string
  reviewer_id: string
  status: string
  reviewer_notes: string | null
  created_at: string
  updated_at: string
}

