import templateDbService from '../services/templateDbService.js'
import logger from '../logger.js'

class TemplateController {
  // Initialize the database
  async init() {
    try {
      await templateDbService.init()
      logger.info('Template controller initialized')
    } catch (error) {
      logger.error('Failed to initialize template controller:', error)
      throw error
    }
  }

  // GET /api/templates - Get all templates
  async getAllTemplates(req, res) {
    try {
      const templates = await templateDbService.getAllTemplates()
      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      logger.error('Error getting templates:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get templates',
        details: error.message
      })
    }
  }

  // GET /api/templates/type/:issueType - Get templates by issue type
  async getTemplatesByType(req, res) {
    try {
      const { issueType } = req.params
      const templates = await templateDbService.getTemplatesByType(issueType)
      res.json({
        success: true,
        data: templates
      })
    } catch (error) {
      logger.error('Error getting templates by type:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get templates by type',
        details: error.message
      })
    }
  }

  // GET /api/templates/active/:issueType - Get active template for issue type
  async getActiveTemplate(req, res) {
    try {
      const { issueType } = req.params
      const template = await templateDbService.getActiveTemplate(issueType)
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: `No active template found for issue type: ${issueType}`
        })
      }

      res.json({
        success: true,
        data: template
      })
    } catch (error) {
      logger.error('Error getting active template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get active template',
        details: error.message
      })
    }
  }

  // POST /api/templates - Create new template
  async createTemplate(req, res) {
    try {
      const { name, issueType, content } = req.body

      // Validation
      if (!name || !issueType || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, issueType, content'
        })
      }

      // Allow any issue type - no restrictions
      const template = await templateDbService.createTemplate({
        name,
        issueType,
        content
      })

      res.status(201).json({
        success: true,
        data: template,
        message: 'Template created successfully'
      })
    } catch (error) {
      logger.error('Error creating template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create template',
        details: error.message
      })
    }
  }

  // PUT /api/templates/:id - Update template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params
      const updates = req.body

      // Remove fields that shouldn't be updated directly
      delete updates.id
      delete updates.createdAt
      delete updates.variables // This is auto-generated

      const template = await templateDbService.updateTemplate(id, updates)

      res.json({
        success: true,
        data: template,
        message: 'Template updated successfully'
      })
    } catch (error) {
      logger.error('Error updating template:', error)
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        })
      }

      if (error.message.includes('Cannot modify')) {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to update template',
        details: error.message
      })
    }
  }

  // DELETE /api/templates/:id - Delete template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params
      const deletedTemplate = await templateDbService.deleteTemplate(id)

      res.json({
        success: true,
        data: deletedTemplate,
        message: 'Template deleted successfully'
      })
    } catch (error) {
      logger.error('Error deleting template:', error)
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        })
      }

      if (error.message.includes('Cannot delete')) {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to delete template',
        details: error.message
      })
    }
  }

  // PUT /api/templates/active/:issueType/:templateId - Set active template
  async setActiveTemplate(req, res) {
    try {
      const { issueType, templateId } = req.params
      const template = await templateDbService.setActiveTemplate(issueType, templateId)

      res.json({
        success: true,
        data: template,
        message: `Active template for ${issueType} set successfully`
      })
    } catch (error) {
      logger.error('Error setting active template:', error)
      
      if (error.message.includes('not found') || error.message.includes('not compatible')) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to set active template',
        details: error.message
      })
    }
  }

  // GET /api/templates/settings - Get template settings
  async getSettings(req, res) {
    try {
      const settings = await templateDbService.getSettings()
      res.json({
        success: true,
        data: settings
      })
    } catch (error) {
      logger.error('Error getting settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to get settings',
        details: error.message
      })
    }
  }

  // PUT /api/templates/settings - Update template settings
  async updateSettings(req, res) {
    try {
      const updates = req.body
      
      // Remove fields that shouldn't be updated directly
      delete updates.version
      delete updates.lastUpdated

      const settings = await templateDbService.updateSettings(updates)

      res.json({
        success: true,
        data: settings,
        message: 'Settings updated successfully'
      })
    } catch (error) {
      logger.error('Error updating settings:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update settings',
        details: error.message
      })
    }
  }

  // POST /api/templates/reset - Reset to default templates
  async resetToDefaults(req, res) {
    try {
      const data = await templateDbService.resetToDefaults()
      
      res.json({
        success: true,
        data: data,
        message: 'Templates reset to defaults successfully'
      })
    } catch (error) {
      logger.error('Error resetting to defaults:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to reset to defaults',
        details: error.message
      })
    }
  }

  // GET /api/templates/export - Export user templates
  async exportTemplates(req, res) {
    try {
      const exportData = await templateDbService.exportTemplates()
      
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="templates-export-${new Date().toISOString().split('T')[0]}.json"`)
      
      res.json(exportData)
    } catch (error) {
      logger.error('Error exporting templates:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to export templates',
        details: error.message
      })
    }
  }

  // POST /api/templates/import - Import templates
  async importTemplates(req, res) {
    try {
      const importData = req.body

      if (!importData || typeof importData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid import data format'
        })
      }

      const importedTemplates = await templateDbService.importTemplates(importData)

      res.json({
        success: true,
        data: importedTemplates,
        message: `Successfully imported ${importedTemplates.length} templates`
      })
    } catch (error) {
      logger.error('Error importing templates:', error)
      
      if (error.message.includes('Invalid import data')) {
        return res.status(400).json({
          success: false,
          error: error.message
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to import templates',
        details: error.message
      })
    }
  }

  // POST /api/templates/duplicate/:id - Duplicate template
  async duplicateTemplate(req, res) {
    try {
      const { id } = req.params
      const { name } = req.body

      // Get the original template
      const templates = await templateDbService.getAllTemplates()
      const originalTemplate = templates.find(t => t.id === id)

      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        })
      }

      // Create duplicate with new name
      const duplicateTemplate = await templateDbService.createTemplate({
        name: name || `${originalTemplate.name} (Copy)`,
        issueType: originalTemplate.issueType,
        content: originalTemplate.content
      })

      res.status(201).json({
        success: true,
        data: duplicateTemplate,
        message: 'Template duplicated successfully'
      })
    } catch (error) {
      logger.error('Error duplicating template:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate template',
        details: error.message
      })
    }
  }
}

export default new TemplateController()
