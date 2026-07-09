const { Router } = require('express');
const ctrl = require('../controllers/generator.controller');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.get('/tables', ctrl.listTables);
router.get('/tables/:table', ctrl.getTableSchema);

router.get('/generate/:table', ctrl.generateData);
router.post('/generate/:table', ctrl.generateData);

router.post('/generate-fake', ctrl.generateFakeData);
router.post('/insert', ctrl.insertGeneratedData);

router.get('/history', ctrl.getHistory);

router.get('/data/:table', ctrl.getTableData);
router.delete('/data/:table', ctrl.deleteTableData);

module.exports = router;
