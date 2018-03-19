exports.ErrorForbidden = class extends Error {
  constructor(message='Forbidden') {
    super(message);
    this.status = 403;
  }
};

exports.ErrorNotFound = class extends Error {
  constructor(message='Not Found') {
    super(message);
    this.status = 404;
  }
};