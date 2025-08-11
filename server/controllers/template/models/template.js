import crypto from 'crypto';

// Factory function for Template model
export function createTemplate(data) {
  return {
    id: data.id || crypto.randomUUID(),
    name: data.name,
    issueType: data.issueType,
    content: data.content,
    isDefault: !!data.isDefault,
    isActive: !!data.isActive,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    variables: data.variables || extractVariables(data.content),
    templateFor: data.templateFor,
    templateType: data.templateType,
    templateCanBeModified: !!data.canBeModified,
    templateCanBeDeleted: !!data.canBeDeleted,
  };
}

// Validate template data
export function validateTemplate(data) {
  const required = ['name', 'content'];
  const missing = required.filter(field => !data[field] || data[field].trim() === '');
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  if (data.name.length > 100) {
    throw new Error('Template name must be 100 characters or less');
  }
  if (data.content.length > 1000000) {
    throw new Error('Template content must be 1000000 characters or less');
  }
}

// Extract variables from template content
export function extractVariables(content) {
  if (!content) return [];
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables = [];
  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  return variables;
}

// Update template data (pure function)
export function updateTemplate(template, updates) {
  const allowedFields = ['name', 'issueType', 'content', 'isActive'];
  const updated = { ...template };
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key) && updates[key] !== undefined) {
      updated[key] = updates[key];
    }
  });
  if (updates.content) {
    updated.variables = extractVariables(updates.content);
  }
  updated.updatedAt = new Date().toISOString();
  return updated;
}

// Convert to database format
export function toDbFormat(template) {
  return {
    id: template.id,
    name: template.name,
    issueType: template.issueType,
    content: template.content,
    isDefault: template.isDefault,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    variables: template.variables,
  };
}

// Convert to API response format
export function toApiFormat(template) {
  return {
    id: template.id,
    name: template.name,
    content: template.content,
    isDefault: template.isDefault,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    variables: template.variables,
    templateFor: template.templateFor,
    canBeDeleted: canBeDeleted(template),
    canBeModified: canBeModified(template),
    type: template.templateType,
  };
}

// Create template from database data
export function fromDb(dbData) {
  return createTemplate(dbData);
}

// Check if template can be deleted
export function canBeDeleted(template) {
  return !!template.templateCanBeDeleted;
}

// Check if template can be modified
export function canBeModified(template) {
  return !!template.templateCanBeModified;
}
