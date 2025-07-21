import express from 'express'
import environmentSettingsController from '../controllers/environmentSettingsController.js'

const router = express.Router()

// Environment settings CRUD routes
router.get('/', environmentSettingsController.getSettings)
router.put('/', environmentSettingsController.updateSettings)

// Provider status routes
router.get('/providers', environmentSettingsController.getProviders)

// Connection testing
router.post('/test', environmentSettingsController.testConnection)

// Default configuration
router.get('/defaults', environmentSettingsController.getDefaults)

// Reset to defaults
router.post('/reset', environmentSettingsController.resetSettings)

// Configuration schema
router.get('/config', environmentSettingsController.getProviderConfig)
router.get('/schema', environmentSettingsController.getSchema)

// Import/Export
router.post('/export', environmentSettingsController.exportSettings)
router.post('/import', environmentSettingsController.importSettings)

export default router
