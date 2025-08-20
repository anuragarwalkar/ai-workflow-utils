#!/bin/bash

# Script to replace all remaining Postman references with API Client equivalents

# Define the workspace directory
WORKSPACE_DIR="/Users/anurag.arwalkar/Documents/ai-workflow-utils"

echo "🔄 Removing all Postman references and replacing with API Client terminology..."

# Function to replace text in files
replace_text() {
    local file="$1"
    local search="$2"
    local replace="$3"
    
    if [[ -f "$file" ]]; then
        if grep -q "$search" "$file"; then
            sed -i '' "s|$search|$replace|g" "$file"
            echo "  ✅ Updated: $file"
        fi
    fi
}

# Collection-related replacements
echo "📦 Updating collection-related references..."

# Method names and variable names
find "$WORKSPACE_DIR" -name "*.js" -o -name "*.jsx" | while read -r file; do
    replace_text "$file" "convertToPostmanRequest" "convertToApiClientRequest"
    replace_text "$file" "convertFromPostmanItems" "convertFromApiClientItems"
    replace_text "$file" "convertUrlToPostman" "convertUrlToApiClient"
    replace_text "$file" "convertUrlFromPostman" "convertUrlFromApiClient"
    replace_text "$file" "convertHeadersToPostman" "convertHeadersToApiClient"
    replace_text "$file" "convertHeadersFromPostman" "convertHeadersFromApiClient"
    replace_text "$file" "convertBodyToPostman" "convertBodyToApiClient"
    replace_text "$file" "convertBodyFromPostman" "convertBodyFromApiClient"
    replace_text "$file" "getBodyTypeFromPostman" "getBodyTypeFromApiClient"
    replace_text "$file" "extractParamsFromPostmanUrl" "extractParamsFromApiClientUrl"
    replace_text "$file" "normalizePostmanItems" "normalizeApiClientItems"
    replace_text "$file" "toPostmanFormat" "toApiClientFormat"
    replace_text "$file" "fromPostmanFormat" "fromApiClientFormat"
    replace_text "$file" "postmanCollection" "apiClientCollection"
    replace_text "$file" "postmanEnvironment" "apiClientEnvironment"
    replace_text "$file" "postmanUrl" "apiClientUrl"
    replace_text "$file" "postmanHeaders" "apiClientHeaders"
    replace_text "$file" "postmanBody" "apiClientBody"
    replace_text "$file" "postmanData" "apiClientData"
done

# Update metadata fields
echo "🏷️  Updating metadata fields..."
find "$WORKSPACE_DIR" -name "*.js" -o -name "*.jsx" | while read -r file; do
    replace_text "$file" "_postman_id" "_api_client_id"
    replace_text "$file" "_postman_variable_scope" "_api_client_variable_scope"
    replace_text "$file" "_postman_exported_at" "_api_client_exported_at"
    replace_text "$file" "_postman_exported_using" "_api_client_exported_using"
done

# Update schema URLs
echo "🌐 Updating schema URLs..."
find "$WORKSPACE_DIR" -name "*.js" -o -name "*.jsx" | while read -r file; do
    replace_text "$file" "https://schema.getpostman.com/json/collection/v2.1.0/collection.json" "https://schema.api-client-utils.com/json/collection/v2.1.0/collection.json"
done

# Update file extensions
echo "📄 Updating file extensions..."
find "$WORKSPACE_DIR" -name "*.js" -o -name "*.jsx" | while read -r file; do
    replace_text "$file" ".postman_collection.json" ".api_client_collection.json"
done

# Update comments and descriptions
echo "💬 Updating comments and descriptions..."
find "$WORKSPACE_DIR" -name "*.js" -o -name "*.jsx" | while read -r file; do
    replace_text "$file" "Postman format" "API Client format"
    replace_text "$file" "Postman v2.1" "API Client v2.1"
    replace_text "$file" "Postman v2.0" "API Client v2.0"
    replace_text "$file" "Importing Postman collection" "Importing API Client collection"
    replace_text "$file" "Exporting.*to Postman format" "Exporting to API Client format"
    replace_text "$file" "Using Postman v2.1 format" "Using API Client v2.1 format"
done

echo "✅ All Postman references have been replaced with API Client terminology!"
echo "🧹 Remember to test the application to ensure all functionality still works correctly."
