const { UPLOADS_DIR } = require('../../config/uploads');

let storage;
if (process.env.STORAGE_DRIVER === 'cloudinary') {
  const CloudinaryStorageService = require('./cloudinaryStorage.service');
  storage = new CloudinaryStorageService();
} else {
  const LocalStorageService = require('./localStorage.service');
  storage = new LocalStorageService(UPLOADS_DIR);
}


module.exports = storage;