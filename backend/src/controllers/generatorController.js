const generatorService = require('../generator/generatorService');

const startGenerating = (req, res) => {
  const io = req.app.get('io');
  generatorService.startGenerator(io);

  res.json({ message: 'Fake trip generator started' });
};

const stopGenerating = (req, res) => {
  generatorService.stopGenerator();

  res.json({ message: 'Fake trip generator stopped' });
};

module.exports = {
  startGenerating,
  stopGenerating
};