// Factory function for TemplateSettings model
export function createTemplateSettings(data = {}) {
  return {
    version: data.version || '1.0.0',
    lastUpdated: data.lastUpdated || new Date().toISOString(),
    defaultIssueTypes: data.defaultIssueTypes || ['story', 'task', 'bug', 'epic', 'subtask'],
    maxTemplatesPerType: data.maxTemplatesPerType || 10,
    allowCustomIssueTypes: data.allowCustomIssueTypes !== false,
    autoBackup: data.autoBackup !== false,
    backupRetentionDays: data.backupRetentionDays || 30,
  };
}

// Validate settings data
export function validateSettings(data) {
  if (data.maxTemplatesPerType && (data.maxTemplatesPerType < 1 || data.maxTemplatesPerType > 50)) {
    throw new Error('maxTemplatesPerType must be between 1 and 50');
  }
  if (
    data.backupRetentionDays &&
    (data.backupRetentionDays < 1 || data.backupRetentionDays > 365)
  ) {
    throw new Error('backupRetentionDays must be between 1 and 365');
  }
  if (data.defaultIssueTypes && !Array.isArray(data.defaultIssueTypes)) {
    throw new Error('defaultIssueTypes must be an array');
  }
}

// Update settings (pure function)
export function updateSettings(settings, updates) {
  const allowedFields = [
    'defaultIssueTypes',
    'maxTemplatesPerType',
    'allowCustomIssueTypes',
    'autoBackup',
    'backupRetentionDays',
  ];
  const updated = { ...settings };
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      updated[key] = updates[key];
    }
  });
  updated.lastUpdated = new Date().toISOString();
  return updated;
}

// Convert to database format
export function toDbFormat(settings) {
  return {
    version: settings.version,
    lastUpdated: settings.lastUpdated,
    defaultIssueTypes: settings.defaultIssueTypes,
    maxTemplatesPerType: settings.maxTemplatesPerType,
    allowCustomIssueTypes: settings.allowCustomIssueTypes,
    autoBackup: settings.autoBackup,
    backupRetentionDays: settings.backupRetentionDays,
  };
}

// Convert to API response format
export function toApiFormat(settings) {
  return toDbFormat(settings);
}

// Create settings from database data
export function fromDb(dbData) {
  return createTemplateSettings(dbData);
}
