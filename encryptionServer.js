const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex').slice(0, 32); // 32 bytes key
const IV_LENGTH = 16; // Initialization vector length

app.use(express.json());
app.use(express.static('uploads'));

app.post('/encrypt', upload.single('file'), (req, res) => {
  const inputFilePath = req.file.path;
  const outputFilePath = `${req.file.path}.enc`;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);

  const input = fs.createReadStream(inputFilePath);
  const output = fs.createWriteStream(outputFilePath);

  input.pipe(cipher).pipe(output);

  output.on('finish', () => {
    res.json({
      message: 'File encrypted successfully',
      encryptedFile: outputFilePath,
      key: ENCRYPTION_KEY,
      iv: iv.toString('hex'),
    });
  });
});

// Decrypt a file
app.post('/decrypt', upload.single('file'), (req, res) => {
  const inputFilePath = req.file.path;
  const outputFilePath = path.join('uploads', `${req.file.originalname.replace('.enc', '')}`);
  const { key, iv } = req.body;

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key),
    Buffer.from(iv, 'hex')
  );

  const input = fs.createReadStream(inputFilePath);
  const output = fs.createWriteStream(outputFilePath);

  input.pipe(decipher).pipe(output);

  output.on('finish', () => {
    res.json({
      message: 'File decrypted successfully',
      decryptedFile: outputFilePath,
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
