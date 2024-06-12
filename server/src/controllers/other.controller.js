const otherService = require('../services/other');

exports.getColors = async (req, res) => {
  const colors = await otherService.getColors();

  return res.api(colors);
};
