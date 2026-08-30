const multer = require('multer');
const path = require('path');
const fs = require('fs');

const assetsDir = path.join(__dirname, '../../assets/cuts_image');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../assets/cuts_image'));   // 🔧 apne folder-structure ke hisaab se adjust karo
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);   // .jpg/.png waise ka waisa rakhne ke liye
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

module.exports = upload;