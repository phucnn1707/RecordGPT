const express = require('express');

express.response.api = function (data = null, message = '', merge = {}) {
  if (data instanceof Promise) {
    return Promise.resolve(data).then((data) => this.api(data, message, merge));
  }
  
  return this.json({
    ...data
  });
};