exports.getColors = async () => {
  let colors = await Color.findAll();
  return colors;
};