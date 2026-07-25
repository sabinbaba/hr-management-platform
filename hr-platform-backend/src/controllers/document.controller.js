const documentService = require('../services/document.service');
const logger = require('../utils/logger');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file was uploaded' });
    }
    const document = await documentService.uploadDocument(req.params.employeeId, req.file, req.user);
    logger.info(`Document uploaded for employee ${req.params.employeeId}: ${document.fileName}`);
    res.status(201).json({ document });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentService.listDocuments(req.params.employeeId, req.user);
    res.status(200).json({ documents });
  } catch (err) {
    next(err);
  }
}

async function download(req, res, next) {
  try {
    const document = await documentService.getDocumentForDownload(req.params.id, req.user);
    res.download(document.filePath, document.fileName);
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, download };
