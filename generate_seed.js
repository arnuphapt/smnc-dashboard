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

  // ── Master data (lookup_options) ────────────────────────────────────────
  // The source spreadsheet almost never lists an official option set for its
  // own dropdown-shaped columns, so each category below is the union of (a)
  // the fixed choices the spec names outright and (b) whatever distinct
  // strings the real sheets already contain — so historical rows imported
  // below still match a valid option in the new masterdata-driven dropdowns.
  // lookup_options only has a single `value` column now (no separate label) —
  // each entry below is the human-readable string used both for storage and display.
  const LOOKUP_SEEDS = {
    department: [
      'พยาบาลศาสตร์', // matches every row's hardcoded department below
    ],
    research_type: [
      'Routine to Research (R2R)',
      'Original Research',
      'Systematic Review',
      'Case Study',
    ],
    journal_rank: ['TCI1', 'TCI2', 'Q1', 'Q2', 'Q3', 'Q4'],
    scope: ['ปฐมภูมิ', 'อื่นๆ'],
    ip_type: ['อนุสิทธิบัตร', 'ลิขสิทธิ์', 'สิทธิบัตร', 'เครื่องหมายการค้า'],
    award_level: ['ชาติ', 'นานาชาติ', 'สถาบัน'],
    utilization_type: ['ชุมชน/สาธารณะ', 'เชิงนโยบาย', 'เชิงพาณิชย์', 'เชิงวิชาการ'],
    innovation_type: [
      'ผลิตภัณฑ์',
      'สิ่งประดิษฐ์',
      'สื่อการสอน',
      'คู่มือ',
      'แผ่นพับ',
      'สื่อ VDO',
      'Application',
      'เอกสาร/แบบประเมิน', // already used in the innovation sheet
    ],
    source: [
      'อาจารย์',
      'อาจารย์ร่วมกับนักศึกษา',
      'อาจารย์ร่วมกับบุคคลภายนอก',
      'อาจารย์ร่วมกับผู้เข้าอบรม',
      // already used as-is in the innovation/IP sheets — kept as separate
      // options rather than silently rewritten, since they're real historical values
      'การวิจัย',
      'การเรียนการสอน',
      'กิจการนักศึกษา',
      'การบริการวิชาการ',
      'บริการวิชาการ',
    ],
    ip_current_status: ['รอพิจารณา', 'ส่งเอกสารออก', 'อนุมัติแล้ว'],
    venue: ['Nursing Education Quality Fair จัดโดย คณะพยาบาลศาสตร์ มหาวิทยาลัยมหิดล'],
    // Buddhist-era years spanning a few years back/forward from the app's
    // existing '2569' fallback default, used by ปีที่ตีพิมพ์ across every category.
    year: ['2566', '2567', '2568', '2569', '2570', '2571'],
  };

  Object.entries(LOOKUP_SEEDS).forEach(([category, values]) => {
    values.forEach((value, idx) => {
      sqlStatements.push(`INSERT INTO public.lookup_options (category, value, sort_order) VALUES (
        ${escapeSqlString(category)},
        ${escapeSqlString(value)},
        ${idx}
      );`);
    });
  });

  // 1. SHEET: คลังผลงานวิจัย
  const researchSheet = workbook.Sheets['คลังผลงานวิจัย'];
  if (researchSheet) {
    const data = XLSX.utils.sheet_to_json(researchSheet);
    data.forEach(row => {
      const metadata = {
        department: 'พยาบาลศาสตร์', // default
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
      let ipType = 'ลิขสิทธิ์';
      if (row['ทรัพย์สินทางปัญญา'] === 'อนุสิทธิบัตร') ipType = 'อนุสิทธิบัตร';
      if (row['ทรัพย์สินทางปัญญา'] === 'สิทธิบัตร') ipType = 'สิทธิบัตร';
      if (row['ทรัพย์สินทางปัญญา'] === 'เครื่องหมายการค้า') ipType = 'เครื่องหมายการค้า';

      const metadata = {
        department: 'พยาบาลศาสตร์',
        year: '2569',
        scope: row['ประเภทของงาน'] || '', // header is misleading — values are ปฐมภูมิ/อื่นๆ, i.e. the actual scope field
        creator_type: row['ผู้สร้างสรรค์'] || '',
        source: row['ที่มาของชิ้นงาน'] || '',
        ip_type: ipType,
        ip_subtype: row['ประเภท'] || '',
        export_date: String(row['วันที่ส่งออก'] || ''),
        application_status: row['สถานะเลขคำขอ'] || '',
        registration_number: String(row['เลขที่คำขอ'] || ''),
        status: row['สถานะปัจจุบัน'] || '',
        patent_number: '' // no source column — admin fills in via the item form once granted
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
      let awardLevel = 'ชาติ';
      if (row['ระดับเวทีการนำเสนอ'] === 'นานาชาติ') awardLevel = 'นานาชาติ';
      if (row['ระดับเวทีการนำเสนอ'] === 'สถาบัน') awardLevel = 'สถาบัน';

      const metadata = {
        department: 'พยาบาลศาสตร์',
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
        department: 'พยาบาลศาสตร์',
        year: String(row['ปี'] || '2569'),
        creator_type: row['ผู้สร้างสรรค์'] || '',
        scope: row['ขอบเขตผลงาน'] || '',
        source: row['ที่มาของชิ้นงาน'] || '',
        innovation_type: row['ประเภทของนวัตกรรม'] || '',
        ip_status: row['ยื่นขอจดทรัพย์สินทางปัญญา'] || '',
        published: row['ตีพิมพ์'] || '',
        presented: row['นำเสนอผลงาน'] || '',
        award_name: row['รางวัลที่ได้รับ'] || row['รางวัล'] || '', // no source column yet — admin fills in via the item form
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
      let utType = 'ชุมชน/สาธารณะ';
      if (row['ประเภทผลงาน'] === 'นโยบาย') utType = 'เชิงนโยบาย';
      if (row['ประเภทผลงาน'] === 'พาณิชย์') utType = 'เชิงพาณิชย์';
      if (row['ประเภทผลงาน'] === 'วิชาการ') utType = 'เชิงวิชาการ';

      const metadata = {
        department: 'พยาบาลศาสตร์',
        year: String(row['ปี'] || '2569'),
        utilization_type: utType,
        // The source sheet has no เจ้าของผลงาน/หน่วยงานที่นำไปใช้ประโยชน์/วันที่ขอนำไปใช้ประโยชน์
        // columns at all — leave blank for admins to fill in via the item form.
        organization_used: row['หน่วยงานที่นำไปใช้ประโยชน์'] || '',
        utilization_date: row['วันที่ขอนำไปใช้ประโยชน์'] || ''
      };

      const sql = `INSERT INTO public.wisdom_items (category, title, authors, is_public, metadata) VALUES (
        'utilization',
        ${escapeSqlString(row['ผลงาน'])},
        ${escapeSqlString(row['เจ้าของผลงาน'] || 'คณาจารย์ SMNC')},
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
