import fs from 'fs';
import { execSync } from 'child_process';

const docxPath = 'majorleads-copy.docx';
const extractPath = 'docs_temp';

try {
    if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
    }
    fs.mkdirSync(extractPath);
    execSync(`tar -xf "${docxPath}" -C ${extractPath}`);

    const xml = fs.readFileSync(`${extractPath}/word/document.xml`, 'utf8');

    const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
    let text = '';

    for (const p of paragraphs) {
        let pText = '';
        const regex = /<w:t(?: [^>]+)?>([^<]*)<\/w:t>/g;
        let m;
        while ((m = regex.exec(p)) !== null) {
            pText += m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        }
        if (pText.trim()) {
            text += pText + '\n';
        }
    }

    fs.writeFileSync('docx_content.txt', text);
    console.log('Extraction completed successfully.');
} catch (e) {
    console.error('Error:', e.message);
} finally {
    if (fs.existsSync(extractPath)) {
        fs.rmSync(extractPath, { recursive: true, force: true });
    }
}
