export const CATEGORY_TO_TABLE: Record<string, string> = {
  research_type: 'master_research_types',
  department: 'master_departments',
  ip_type: 'master_ip_types',
  award_level: 'master_award_levels',
  utilization_type: 'master_utilization_types',
  journal_rank: 'master_journal_ranks',
  scope: 'master_scopes',
  innovation_type: 'master_innovation_types',
  source: 'master_sources',
  ip_current_status: 'master_ip_statuses',
  venue: 'master_venues',
  year: 'master_years',
  ethics_criteria: 'master_ethics_criteria',
}

export function getTableForCategory(category: string): string {
  return CATEGORY_TO_TABLE[category] || 'lookup_options'
}
