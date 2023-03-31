import fs from 'fs';
import path from 'path';

const getAllFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
};

const getSourceCode = (filePaths) => {
  const sourceCode = {};

  filePaths.forEach((filePath) => {
    if (filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      sourceCode[filePath] = content;
    }
  });

  return sourceCode;
};

export default async function handler(req, res) {
  const srcDir = path.join(process.cwd(), 'src');
  const filePaths = getAllFiles(srcDir);
  const sourceCode = getSourceCode(filePaths);
  res.status(200).json({sourceCode});
}
