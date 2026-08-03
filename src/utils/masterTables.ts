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

/**
 * The DB column that stores the human-readable value for each category.
 * Most tables use `name`, but a few differ:
 *   - master_ethics_criteria → `label`
 *   - master_years           → `year_be` (integer — edit not supported here)
 */
export const CATEGORY_VALUE_FIELD: Record<string, string> = {
  ethics_criteria: 'label',
  year: 'year_be',
}

export function getTableForCategory(category: string): string {
  return CATEGORY_TO_TABLE[category] || 'lookup_options'
}

/** Returns the column name that holds the display value for a given category. */
export function getValueFieldForCategory(category: string): string {
  return CATEGORY_VALUE_FIELD[category] || 'name'
}
