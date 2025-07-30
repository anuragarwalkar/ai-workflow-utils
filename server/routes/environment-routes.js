import express from 'express'
import environmentController from '../controllers/environment/index.js'

const router = express.Router()

// Environment settings CRUD routes
router.get('/', environmentController.getSettings)
router.put('/', environmentController.updateSettings)

// Provider status routes
router.get('/providers', environmentController.getProviders)

// Connection testing
router.post('/test', environmentController.testConnection)

// Default configuration
router.get('/defaults', environmentController.getDefaults)

// Reset to defaults
router.post('/reset', environmentController.resetSettings)

// Configuration schema
router.get('/config', environmentController.getProviderConfig)
router.get('/schema', environmentController.getSchema)

// Import/Export
router.post('/export', environmentController.exportSettings)
router.post('/import', environmentController.importSettings)

export default router
