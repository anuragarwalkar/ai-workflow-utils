// LocalStorage functions
export const saveToLocalStorage = (projectType, issueType, customFields) => {
  try {
    // Get existing data
    const existingData = localStorage.getItem("jira_form_data");
    let jiraFormData = existingData ? JSON.parse(existingData) : {};

    // Update with current form data
    jiraFormData = {
      ...jiraFormData,
      projectType,
      customFieldsByType: {
        ...jiraFormData.customFieldsByType,
        [issueType]: customFields,
      },
    };

    localStorage.setItem("jira_form_data", JSON.stringify(jiraFormData));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};
