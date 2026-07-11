import XLSX from 'xlsx';
import fs from 'fs';

const filePath = 'Database กลุ่มวิจัย หลังบ้าน.xlsx';

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

try {
  const workbook = XLSX.readFile(filePath);
  let sqlStatements = [];

  // 1. SHEET: คลังผลงานวิจัย
  const researchSheet = workbook.Sheets['คลังผลงานวิจัย'];
  if (researchSheet) {
    const data = XLSX.utils.sheet_to_json(researchSheet);
    data.forEach(row => {
      const metadata = {
        department: 'Nursing', // default
        year: String(row['ปี'] || '2569'),
        contribution: row['การมีส่วนร่วม'] || '',
        scope: row['ขอบเขตผลงาน'] || '',
        funding: row['ทุนวิจัย'] || '',
        journal_rank: row['ระดับฐาน'] || '',
        journal_name: row['วารสาร'] || ''
      };
      
      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, metadata) VALUES (
        'research',
        ${escapeSqlString(row['ชื่อเรื่อง'])},
        ${escapeSqlString(row['นักวิจัย'])},
        true,
        ${escapeSqlString(JSON.stringify(metadata))}
      );`;
      sqlStatements.push(sql);
    });
  }

  // 2. SHEET: คลังทรัพย์สินทางปัญญา
  const ipSheet = workbook.Sheets['คลังทรัพย์สินทางปัญญา'];
  if (ipSheet) {
    const data = XLSX.utils.sheet_to_json(ipSheet);
    data.forEach(row => {
      // Map ip_type to lookup values
      let ipType = 'Copyright';
      if (row['ทรัพย์สินทางปัญญา'] === 'อนุสิทธิบัตร') ipType = 'PettyPatent';
      if (row['ทรัพย์สินทางปัญญา'] === 'สิทธิบัตร') ipType = 'Patent';
      if (row['ทรัพย์สินทางปัญญา'] === 'เครื่องหมายการค้า') ipType = 'Trademark';

      const metadata = {
        department: 'Nursing',
        year: '2569',
        scope: row['ประเภทของงาน'] || '',
        creator_type: row['ผู้สร้างสรรค์'] || '',
        source: row['ที่มาของชิ้นงาน'] || '',
        ip_type: ipType,
        ip_subtype: row['ประเภท'] || '',
        export_date: String(row['วันที่ส่งออก'] || ''),
        application_status: row['สถานะเลขคำขอ'] || '',
        registration_number: String(row['เลขที่คำขอ'] || ''),
        status: row['สถานะปัจจุบัน'] || ''
      };

      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, metadata) VALUES (
        'intellectual_property',
        ${escapeSqlString(row['ชื่อผลงาน'])},
        ${escapeSqlString(row['เจ้าของผลงานหลัก'])},
        true,
        ${escapeSqlString(JSON.stringify(metadata))}
      );`;
      sqlStatements.push(sql);
    });
  }

  // 3. SHEET: คลังรางวัลและความสำเร็จ
  const awardSheet = workbook.Sheets['คลังรางวัลและความสำเร็จ'];
  if (awardSheet) {
    const data = XLSX.utils.sheet_to_json(awardSheet);
    data.forEach(row => {
      let awardLevel = 'National';
      if (row['ระดับเวทีการนำเสนอ'] === 'นานาชาติ') awardLevel = 'International';
      if (row['ระดับเวทีการนำเสนอ'] === 'สถาบัน') awardLevel = 'Institutional';

      const metadata = {
        department: 'Nursing',
        year: String(row['ปี'] || '2569'),
        scope: row['ขอบเขตผลงาน'] || '',
        presenter: row['ผู้นำเสนอ'] || '',
        award_level: awardLevel,
        organizer: row['เวทีการนำเสนอ'] || '',
        award_name: row['รางวัล'] || ''
      };

      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, metadata) VALUES (
        'award',
        ${escapeSqlString(row['ชื่อผลงาน'])},
        ${escapeSqlString(row['เจ้าของผลงาน'])},
        true,
        ${escapeSqlString(JSON.stringify(metadata))}
      );`;
      sqlStatements.push(sql);
    });
  }

  // 4. SHEET: คลังนวัตกรรม
  const innovationSheet = workbook.Sheets['คลังนวัตกรรม'];
  if (innovationSheet) {
    const data = XLSX.utils.sheet_to_json(innovationSheet);
    data.forEach(row => {
      const metadata = {
        department: 'Nursing',
        year: String(row['ปี'] || '2569'),
        creator_type: row['ผู้สร้างสรรค์'] || '',
        scope: row['ขอบเขตผลงาน'] || '',
        source: row['ที่มาของชิ้นงาน'] || '',
        research_type: 'Basic', // default lookup category
        innovation_type: row['ประเภทของนวัตกรรม'] || '',
        ip_status: row['ยื่นขอจดทรัพย์สินทางปัญญา'] || '',
        published: row['ตีพิมพ์'] || '',
        presented: row['นำเสนอผลงาน'] || '',
        drive_link: row['รายละเอียดผลงาน'] || ''
      };

      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, description, metadata) VALUES (
        'innovation',
        ${escapeSqlString(row['ชื่อผลงาน'])},
        ${escapeSqlString(row['เจ้าของผลงานหลัก'])},
        true,
        ${row['รายละเอียดผลงาน'] ? escapeSqlString(`รายละเอียดเพิ่มเติม: ${row['รายละเอียดผลงาน']}`) : 'NULL'},
        ${escapeSqlString(JSON.stringify(metadata))}
      );`;
      sqlStatements.push(sql);
    });
  }

  // 5. SHEET: คลังการนำผลงานวิจัยและนวัตกรรมไ
  const utilizationSheet = workbook.Sheets['คลังการนำผลงานวิจัยและนวัตกรรมไ'];
  if (utilizationSheet) {
    const data = XLSX.utils.sheet_to_json(utilizationSheet);
    data.forEach(row => {
      let utType = 'Public';
      if (row['ประเภทผลงาน'] === 'นโยบาย') utType = 'Policy';
      if (row['ประเภทผลงาน'] === 'พาณิชย์') utType = 'Commercial';
      if (row['ประเภทผลงาน'] === 'วิชาการ') utType = 'Academic';

      const metadata = {
        department: 'Nursing',
        year: String(row['ปี'] || '2569'),
        utilization_type: utType
      };

      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, metadata) VALUES (
        'utilization',
        ${escapeSqlString(row['ผลงาน'])},
        'คณาจารย์ SMNC',
        true,
        ${escapeSqlString(JSON.stringify(metadata))}
      );`;
      sqlStatements.push(sql);
    });
  }

  // Write SQL output to file
  const sqlOutput = sqlStatements.join('\n');
  fs.writeFileSync('seed.sql', sqlOutput);
  console.log(`Generated seed.sql with ${sqlStatements.length} insert statements.`);

} catch (err) {
  console.error('Error generating seed SQL:', err);
}
