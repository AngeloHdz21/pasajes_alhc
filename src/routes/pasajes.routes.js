const { Router } = require('express');
const router = Router();
const pasajesController = require('../controllers/pasajes.controller');

router.get('/pasajes', pasajesController.getPasajes);
router.post('/pasajes', pasajesController.createPasaje);
router.put('/pasajes/:id', pasajesController.updatePasaje);
router.delete('/pasajes/:id', pasajesController.deletePasaje);

router.post('/pasajes/csv', pasajesController.generarCSV);

module.exports = router;