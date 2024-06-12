module.exports = {
  NOT_FOUND: (field) => {
    if (field) return `${field}が見つかりません。`;
    return 'データがありません。';
  }
};
