import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const downloadRouter = Router();

downloadRouter.get('/api/download', (req, res) => {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Nível máximo de compressão
  });

  res.attachment('fintrack_project.zip');
  archive.pipe(res);

  // Adiciona diretórios específicos ao arquivo zip
  const directories = ['client', 'server', 'shared'];
  directories.forEach(dir => {
    archive.directory(path.join(process.cwd(), dir), dir);
  });

  // Adiciona arquivos específicos da raiz ao arquivo zip
  const rootFiles = [
    'tsconfig.json',
    'package.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'vite.config.ts',
    'drizzle.config.ts',
    'theme.json',
    'README.md'
  ];

  rootFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: file });
    }
  });

  archive.finalize();
});

export default downloadRouter;