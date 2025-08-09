# Phase 1: Controller Layer Refactoring
## Converting Class-based Controllers to Functional Handlers

### Overview
This phase focuses on converting static class methods in controllers to pure functions, improving testability and reducing unnecessary complexity.

---

## 1. Jira Controller Refactoring

### Current Implementation Analysis
```javascript
// server/controllers/jira/jira-controller.js (BEFORE)
class JiraController {
  static async fetchJiraSummaries(issueKeys) {
    try {
      logger.info('Fetching Jira summaries', { issueKeys });
      return await JiraSummaryService.fetchJiraSummaries(issueKeys);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'fetchJiraSummaries');
      throw error;
    }
  }

  static async getIssueDetails(issueKey) {
    try {
      logger.info('Getting Jira issue details', { issueKey });
      return await JiraApiService.fetchIssue(issueKey);
    } catch (error) {
      ErrorHandler.handleApiError(error, 'getIssueDetails');
      throw error;
    }
  }

  static async previewBugReport(req, res) {
    try {
      const { prompt, images = [], issueType } = req.body;
      logger.info('Previewing bug report', {
        hasPrompt: !!prompt,
        imageCount: images.length,
        issueType,
      });
      await JiraContentService.streamPreviewContent(
        { prompt, issueType },
        images,
        res,
      );
    } catch (error) {
      ErrorHandler.handleApiError(error, 'previewBugReport', res);
    }
    res.end();
  }
}
```

### Proposed Functional Implementation
```javascript
// server/controllers/jira/handlers/jira-handlers.js (AFTER)
import logger from '../../../logger.js';
import { withErrorHandling } from '../../../utils/error-handling.js';
import { withLogging } from '../../../utils/logging.js';
import { withValidation } from '../../../utils/validation.js';
import { JiraSummaryService } from '../services/jira-summary-service.js';
import { JiraApiService } from '../services/jira-api-service.js';
import { JiraContentService } from '../services/jira-content-service.js';

// Pure function for fetching summaries
const fetchJiraSummariesCore = async (issueKeys) => {
  return await JiraSummaryService.fetchJiraSummaries(issueKeys);
};

// Composed function with error handling and logging
export const fetchJiraSummaries = withErrorHandling(
  withLogging(
    withValidation(fetchJiraSummariesCore, {
      issueKeys: { type: 'array', required: true, minLength: 1 }
    }),
    'fetchJiraSummaries'
  ),
  'fetchJiraSummaries'
);

// Pure function for getting issue details
const getIssueDetailsCore = async (issueKey) => {
  return await JiraApiService.fetchIssue(issueKey);
};

export const getIssueDetails = withErrorHandling(
  withLogging(
    withValidation(getIssueDetailsCore, {
      issueKey: { type: 'string', required: true, minLength: 1 }
    }),
    'getIssueDetails'
  ),
  'getIssueDetails'
);

// Express handler for preview bug report
export const previewBugReport = withErrorHandling(
  async (req, res) => {
    const { prompt, images = [], issueType } = req.body;
    
    logger.info('Previewing bug report', {
      hasPrompt: !!prompt,
      imageCount: images.length,
      issueType,
    });

    await JiraContentService.streamPreviewContent(
      { prompt, issueType },
      images,
      res,
    );
    
    res.end();
  },
  'previewBugReport'
);

// Express handler for creating Jira issue
export const createJiraIssue = withErrorHandling(
  async (req, res) => {
    logger.info('Creating Jira issue', { body: req.body });
    const result = await JiraApiService.createIssue(req.body);

    res.status(200).json({
      message: 'Jira issue created successfully',
      jiraIssue: result,
    });
  },
  'createJiraIssue'
);

// Express handler for uploading images
export const uploadImage = withErrorHandling(
  async (req, res) => {
    logger.info('Uploading image', { file: req.file });
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const result = await JiraAttachmentService.handleAttachments('temp', [req.file]);
    res.json(result);
  },
  'uploadImage'
);

// Express handler for getting Jira issue
export const getJiraIssue = withErrorHandling(
  async (req, res) => {
    const { id } = req.params;
    logger.info('Getting Jira issue', { issueId: id });
    
    const issue = await getIssueDetails(id);
    res.json(issue);
  },
  'getJiraIssue'
);
```

### Updated Route Handler
```javascript
// server/routes/jira-routes.js (UPDATED)
import express from 'express';
import {
  fetchJiraSummaries,
  getIssueDetails,
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  enhanceDescription,
  generateCommentReply,
  formatComment
} from '../controllers/jira/handlers/jira-handlers.js';

const router = express.Router();

// Routes using functional handlers
router.post('/summaries', async (req, res) => {
  const { issueKeys } = req.body;
  const summaries = await fetchJiraSummaries(issueKeys);
  res.json(summaries);
});

router.get('/issue/:id', getJiraIssue);
router.post('/preview', previewBugReport);
router.post('/create', createJiraIssue);
router.post('/upload', uploadImage);

export default router;
```

---

## 2. Email Controller Refactoring

### Current Implementation
```javascript
// server/controllers/email/emailController.js (BEFORE)
class EmailController {
  static async generateEmail(req, res) {
    try {
      const { tableData, metadata } = req.body;
      const emailBody = EmailContentService.generateEmailBody(tableData, metadata);
      res.json({ success: true, emailBody });
    } catch (error) {
      logger.error('Email generation failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

### Proposed Functional Implementation
```javascript
// server/controllers/email/handlers/email-handlers.js (AFTER)
import { withErrorHandling } from '../../../utils/error-handling.js';
import { withValidation } from '../../../utils/validation.js';
import { EmailContentService } from '../services/email-content-service.js';

// Pure function for email generation
const generateEmailCore = async ({ tableData, metadata }) => {
  return EmailContentService.generateEmailBody(tableData, metadata);
};

// Validation schema
const emailGenerationSchema = {
  tableData: { type: 'array', required: true },
  metadata: { type: 'object', required: false }
};

// Express handler for email generation
export const generateEmail = withErrorHandling(
  async (req, res) => {
    const { tableData, metadata } = req.body;
    
    // Validate input
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid table data: must be non-empty array' 
      });
    }

    const emailBody = await generateEmailCore({ tableData, metadata });
    
    res.json({ 
      success: true, 
      emailBody 
    });
  },
  'generateEmail'
);

// AI-powered email generation
export const generateAIEmail = withErrorHandling(
  async (req, res) => {
    const { prompt, attachedImages = [] } = req.body;
    
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const emailDraft = await EmailContentService.generateEmailWithAI({
      prompt,
      attachedImages
    });

    res.json({
      success: true,
      data: emailDraft
    });
  },
  'generateAIEmail'
);

// Send email handler
export const sendEmail = withErrorHandling(
  async (req, res) => {
    const { to, subject, body, attachments = [] } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, body'
      });
    }

    const result = await EmailContentService.sendEmail({
      to,
      subject,
      body,
      attachments
    });

    res.json({
      success: true,
      data: result
    });
  },
  'sendEmail'
);
```

---

## 3. Pull Request Controller Refactoring

### Current Implementation
```javascript
// server/controllers/pull-request/pull-request-controller.js (BEFORE)
class PullRequestController {
  static async generatePRContent(req, res) {
    try {
      const { commits, ticketNumber, branchName } = req.body;
      await PRContentGenerationService.generateAIContent(
        commits, 
        ticketNumber, 
        branchName, 
        res
      );
    } catch (error) {
      logger.error('PR content generation failed:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
```

### Proposed Functional Implementation
```javascript
// server/controllers/pull-request/handlers/pr-handlers.js (AFTER)
import { withErrorHandling } from '../../../utils/error-handling.js';
import { withValidation } from '../../../utils/validation.js';
import { PRContentGenerationService } from '../services/pr-content-generation-service.js';

// Validation schema for PR generation
const prGenerationSchema = {
  commits: { type: 'array', required: true, minLength: 1 },
  ticketNumber: { type: 'string', required: false },
  branchName: { type: 'string', required: true }
};

// Express handler for PR content generation
export const generatePRContent = withErrorHandling(
  async (req, res) => {
    const { commits, ticketNumber, branchName } = req.body;
    
    // Validate required fields
    if (!Array.isArray(commits) || commits.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Commits array is required and must not be empty'
      });
    }

    if (!branchName || branchName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Branch name is required'
      });
    }

    // Generate PR content with streaming response
    await PRContentGenerationService.generateAIContent(
      commits,
      ticketNumber,
      branchName,
      res
    );
  },
  'generatePRContent'
);

// Handler for PR review
export const reviewPR = withErrorHandling(
  async (req, res) => {
    const { prContent, diffContent } = req.body;
    
    if (!prContent || !diffContent) {
      return res.status(400).json({
        success: false,
        error: 'PR content and diff content are required'
      });
    }

    const review = await PRReviewService.generateReview({
      prContent,
      diffContent
    });

    res.json({
      success: true,
      data: review
    });
  },
  'reviewPR'
);
```

---

## 4. Utility Functions for Functional Composition

### Error Handling Utility
```javascript
// server/utils/error-handling.js
import logger from '../logger.js';

export const withErrorHandling = (fn, context) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}:`, {
        error: error.message,
        stack: error.stack,
        args: args.slice(0, 2) // Log first 2 args for debugging
      });
      
      // Re-throw for Express error handling middleware
      throw error;
    }
  };
};

export const withExpressErrorHandling = (fn, context) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      logger.error(`Express handler error in ${context}:`, {
        error: error.message,
        method: req.method,
        url: req.url,
        body: req.body
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || 'Internal server error'
        });
      }
    }
  };
};
```

### Logging Utility
```javascript
// server/utils/logging.js
import logger from '../logger.js';

export const withLogging = (fn, operation) => {
  return async (...args) => {
    const startTime = Date.now();
    
    logger.info(`Starting ${operation}`, {
      args: args.slice(0, 2), // Log first 2 args
      timestamp: new Date().toISOString()
    });
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      logger.info(`Completed ${operation}`, {
        duration: `${duration}ms`,
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Failed ${operation}`, {
        duration: `${duration}ms`,
        error: error.message
      });
      
      throw error;
    }
  };
};
```

### Validation Utility
```javascript
// server/utils/validation.js
export const withValidation = (fn, schema) => {
  return async (...args) => {
    // Simple validation - can be enhanced with libraries like Joi or Zod
    const [firstArg] = args;
    
    if (typeof firstArg === 'object' && firstArg !== null) {
      for (const [key, rules] of Object.entries(schema)) {
        const value = firstArg[key];
        
        if (rules.required && (value === undefined || value === null)) {
          throw new Error(`${key} is required`);
        }
        
        if (value !== undefined && rules.type) {
          if (rules.type === 'array' && !Array.isArray(value)) {
            throw new Error(`${key} must be an array`);
          }
          
          if (rules.type === 'string' && typeof value !== 'string') {
            throw new Error(`${key} must be a string`);
          }
          
          if (rules.type === 'object' && typeof value !== 'object') {
            throw new Error(`${key} must be an object`);
          }
          
          if (rules.minLength && value.length < rules.minLength) {
            throw new Error(`${key} must have at least ${rules.minLength} items`);
          }
        }
      }
    }
    
    return await fn(...args);
  };
};

// Enhanced validation with Zod (optional upgrade)
export const withZodValidation = (fn, zodSchema) => {
  return async (...args) => {
    const [firstArg] = args;
    
    try {
      zodSchema.parse(firstArg);
    } catch (error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
    
    return await fn(...args);
  };
};
```

---

## 5. Testing Strategy for Phase 1

### Unit Tests for Pure Functions
```javascript
// tests/controllers/jira/handlers/jira-handlers.test.js
import { describe, it, expect, vi } from 'vitest';
import { fetchJiraSummaries, getIssueDetails } from '../../../server/controllers/jira/handlers/jira-handlers.js';

describe('Jira Handlers', () => {
  describe('fetchJiraSummaries', () => {
    it('should fetch summaries for valid issue keys', async () => {
      const issueKeys = ['PROJ-123', 'PROJ-124'];
      const mockSummaries = { 'PROJ-123': 'Summary 1', 'PROJ-124': 'Summary 2' };
      
      // Mock the service
      vi.mock('../../../server/controllers/jira/services/jira-summary-service.js', () => ({
        JiraSummaryService: {
          fetchJiraSummaries: vi.fn().mockResolvedValue(mockSummaries)
        }
      }));
      
      const result = await fetchJiraSummaries(issueKeys);
      expect(result).toEqual(mockSummaries);
    });
    
    it('should throw error for invalid input', async () => {
      await expect(fetchJiraSummaries([])).rejects.toThrow('issueKeys must have at least 1 items');
      await expect(fetchJiraSummaries(null)).rejects.toThrow('issueKeys is required');
    });
  });
});
```

### Integration Tests for Express Handlers
```javascript
// tests/integration/jira-routes.test.js
import request from 'supertest';
import { app } from '../../../server/server.js';

describe('Jira Routes Integration', () => {
  describe('POST /api/jira/summaries', () => {
    it('should return summaries for valid request', async () => {
      const response = await request(app)
        .post('/api/jira/summaries')
        .send({ issueKeys: ['PROJ-123'] })
        .expect(200);
        
      expect(response.body).toHaveProperty('PROJ-123');
    });
    
    it('should return 400 for invalid request', async () => {
      await request(app)
        .post('/api/jira/summaries')
        .send({ issueKeys: [] })
        .expect(400);
    });
  });
});
```

---

## 6. Migration Checklist for Phase 1

### Pre-Migration
- [ ] Set up testing environment
- [ ] Create backup of current controllers
- [ ] Set up utility functions (error-handling, logging, validation)
- [ ] Create new directory structure

### Migration Steps
- [ ] Create `server/utils/` directory with utility functions
- [ ] Create `server/controllers/jira/handlers/` directory
- [ ] Convert JiraController static methods to functional handlers
- [ ] Update jira routes to use new handlers
- [ ] Create `server/controllers/email/handlers/` directory
- [ ] Convert EmailController static methods to functional handlers
- [ ] Update email routes to use new handlers
- [ ] Create `server/controllers/pull-request/handlers/` directory
- [ ] Convert PRController static methods to functional handlers
- [ ] Update PR routes to use new handlers

### Post-Migration
- [ ] Run all existing tests to ensure no regressions
- [ ] Add new unit tests for pure functions
- [ ] Add integration tests for Express handlers
- [ ] Update API documentation
- [ ] Performance testing to ensure no degradation
- [ ] Code review and cleanup

### Rollback Plan
- [ ] Keep original controller files as `.backup` files
- [ ] Document all route changes
- [ ] Create rollback script to restore original structure
- [ ] Test rollback procedure in staging environment

---

## 7. Expected Benefits After Phase 1

### Code Quality Improvements
- **Reduced Complexity**: Elimination of unnecessary class structures
- **Better Separation**: Clear separation between pure business logic and Express handlers
- **Improved Testability**: Pure functions are easier to unit test
- **Consistent Error Handling**: Standardized error handling across all controllers

### Performance Improvements
- **Reduced Memory Usage**: No class instantiation overhead
- **Faster Startup**: Simpler module loading
- **Better Garbage Collection**: Fewer object references

### Developer Experience
- **Easier Debugging**: Clear function call stacks
- **Better IDE Support**: Better autocomplete and type inference
- **Simpler Mocking**: Easier to mock pure functions in tests
- **Consistent Patterns**: All controllers follow the same functional pattern

---

*Phase 1 completion should take 2-3 days and provides the foundation for subsequent phases.*
