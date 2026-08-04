import { WisdomItem } from '../components/views/Dashboard'
import { formatAuthorsForDisplay } from './authorHelper'

/**
 * Downloads Word (.doc) document from HTML content string
 */
export const downloadWordDocument = (filename: string, title: string, bodyHtml: string) => {
  const fullHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
        body {
          font-family: 'Sarabun', 'TH Sarabun PSK', sans-serif;
          font-size: 14pt;
          line-height: 1.6;
          color: #1e293b;
          padding: 30px;
        }
        h1 {
          color: #0b1d3a;
          font-size: 20pt;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
        }
        .header-sub {
          text-align: center;
          color: #0ea5a0;
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 25px;
          border-bottom: 2px solid #0ea5a0;
          padding-bottom: 10px;
        }
        .section-title {
          font-size: 14pt;
          font-weight: bold;
          color: #0b1d3a;
          margin-top: 20px;
          margin-bottom: 10px;
          background-color: #f1f5f9;
          padding: 6px 12px;
          border-left: 4px solid #0ea5a0;
        }
        .stat-grid {
          display: table;
          width: 100%;
          margin: 15px 0;
        }
        .stat-card {
          display: table-cell;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          padding: 12px;
          text-align: center;
          border-radius: 6px;
        }
        .stat-num {
          font-size: 22pt;
          font-weight: bold;
          color: #0ea5a0;
        }
        .stat-label {
          font-size: 11pt;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
          font-size: 11pt;
          vertical-align: top;
        }
        th {
          background-color: #f1f5f9;
          color: #0b1d3a;
          font-weight: bold;
        }
        tr:nth-child(even) td {
          background-color: #fafafa;
        }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10pt;
          font-weight: bold;
          background: #e2e8f0;
          color: #334155;
        }
        .footer {
          margin-top: 40px;
          text-align: right;
          font-size: 10pt;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
      <div class="footer">
        ออกรายงานโดย ระบบคลังปัญญาดิจิทัล SMNC · วิทยาลัยพยาบาลศรีมหาสารคาม ณ วันที่ ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </body>
    </html>
  `

  const blob = new Blob(['\ufeff', fullHtml], {
    type: 'application/msword;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.doc`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Exports a single WisdomItem report as Word (.doc)
 */
export const exportItemToWord = (item: WisdomItem, categoryLabel: string) => {
  const metadataRows = Object.entries(item.metadata || {})
    .filter(([key, val]) => val && key !== 'department' && key !== 'contribution')
    .map(([key, val]) => {
      const labelMap: Record<string, string> = {
        research_type: 'ประเภทงานวิจัย',
        ip_type: 'ประเภททรัพย์สินทางปัญญา',
        award_level: 'ระดับรางวัลเชิดชูเกียรติ',
        utilization_type: 'ประเภทการใช้ประโยชน์',
        journal_name: 'ตีพิมพ์ในวารสาร',
        registration_number: 'เลขที่คำขอ',
        registration_date: 'วันที่จดทะเบียนสิทธิ์',
        organizer: 'รายละเอียดเวทีการนำเสนอ',
        organization_used: 'หน่วยงานที่อ้างอิงนำไปใช้',
        impact_summary: 'ประโยชน์เชิงประจักษ์',
        year: 'ปี',
        scope: 'ขอบเขตของผลงาน',
        creator_type: 'กลุ่มผู้สร้างสรรค์',
        source: 'ที่มาของผลงาน',
        patent_number: 'เลขที่อนุสิทธิบัตร/สิทธิบัตร',
        application_status: 'สถานะเลขคำขอ',
        status: 'สถานะการยื่นขอสิทธิ์ปัจจุบัน',
        contribution: 'การมีส่วนร่วมในผลงาน',
        funding: 'ทุนวิจัยที่ได้รับ',
        journal_rank: 'ระดับฐานข้อมูลวารสาร',
        award_name: 'รางวัลที่ได้รับ',
        innovation_type: 'ประเภทนวัตกรรม',
        ip_status: 'การยื่นขอทรัพย์สินทางปัญญา',
      }
      return `<tr>
        <td style="width: 35%; font-weight: bold; background: #f8fafc;">${labelMap[key] || key}</td>
        <td>${val}</td>
      </tr>`
    })
    .join('')

  const html = `
    <h1>รายงานสรุปรายละเอียดผลงาน</h1>
    <div class="header-sub">คลังปัญญาดิจิทัล SMNC · ${categoryLabel}</div>

    <div class="section-title">ข้อมูลหลักของผลงาน</div>
    <table>
      <tr>
        <td style="width: 35%; font-weight: bold; background: #f8fafc;">ชื่อผลงาน / หัวข้อ</td>
        <td style="font-weight: bold; color: #0b1d3a;">${item.title}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f8fafc;">หมวดหมู่ผลงาน</td>
        <td><span class="badge">${categoryLabel}</span></td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f8fafc;">คณะผู้จัดทำ / เจ้าของผลงาน</td>
        <td>${formatAuthorsForDisplay(item.authors) || 'ไม่ระบุ'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f8fafc;">สถานะการเผยแพร่</td>
        <td>${item.is_public ? 'เปิดเผยต่อสาธารณะ (Public)' : 'เฉพาะบุคลากรภายใน (Private)'}</td>
      </tr>
      <tr>
        <td style="font-weight: bold; background: #f8fafc;">วันที่บันทึกลงระบบ</td>
        <td>${new Date(item.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
      </tr>
    </table>

    ${metadataRows ? `
      <div class="section-title">ข้อมูลรายละเอียดเฉพาะกลุ่ม</div>
      <table>
        ${metadataRows}
      </table>
    ` : ''}

    ${item.description && item.description !== '-' ? `
      <div class="section-title">บทคัดย่อ / รายละเอียดเพิ่มเติม</div>
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; white-space: pre-line;">
        ${item.description}
      </div>
    ` : ''}
  `

  const safeTitle = item.title.replace(/[^a-zA-Z0-9ก-๙]/g, '_').substring(0, 30)
  downloadWordDocument(`รายงาน_${safeTitle}`, `รายงาน - ${item.title}`, html)
}

/**
 * Exports summary statistics report as Word (.doc) for a full repository category list
 */
export const exportCategoryReportToWord = (categoryLabel: string, items: WisdomItem[]) => {
  const totalCount = items.length

  // Calculate year breakdown
  const yearCounts: Record<string, number> = {}
  items.forEach((item) => {
    const yr = item.metadata?.year || 'ไม่ระบุ'
    yearCounts[yr] = (yearCounts[yr] || 0) + 1
  })

  const yearBreakdownHtml = Object.entries(yearCounts)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([yr, count]) => `<tr><td>ปี ${yr}</td><td style="text-align: right; font-weight: bold;">${count} รายการ</td></tr>`)
    .join('')

  // Build table rows of items
  const itemRows = items
    .map((item, idx) => {
      const yearStr = item.metadata?.year || '-'
      const authorsStr = formatAuthorsForDisplay(item.authors) || '-'
      const subInfo = item.metadata?.organizer || item.metadata?.journal_name || item.metadata?.ip_type || item.metadata?.innovation_type || item.metadata?.award_name || '-'
      return `<tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td style="text-align: center;">${yearStr}</td>
        <td style="font-weight: bold; color: #0b1d3a;">${item.title}</td>
        <td>${authorsStr}</td>
        <td>${subInfo}</td>
      </tr>`
    })
    .join('')

  const html = `
    <h1>รายงานสถิติและคลังข้อมูลสรุป</h1>
    <div class="header-sub">หมวดหมู่: ${categoryLabel} · วิทยาลัยพยาบาลศรีมหาสารคาม</div>

    <div class="section-title">1. สรุปสถิติภาพรวม (Overview Statistics)</div>
    <table>
      <tr>
        <th style="width: 70%;">รายการสถิติ</th>
        <th style="text-align: right;">จำนวน</th>
      </tr>
      <tr>
        <td style="font-weight: bold; color: #0b1d3a;">จำนวนผลงานทั้งหมดในหมวดหมู่นี้</td>
        <td style="text-align: right; font-weight: bold; color: #0ea5a0; font-size: 14pt;">${totalCount} รายการ</td>
      </tr>
      ${yearBreakdownHtml}
    </table>

    <div class="section-title">2. ตารางรายชื่อผลงานทั้งหมด (${totalCount} รายการ)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">ลำดับ</th>
          <th style="width: 10%; text-align: center;">ปี</th>
          <th style="width: 40%;">ชื่อผลงาน</th>
          <th style="width: 24%;">ผู้จัดทำ / เจ้าของผลงาน</th>
          <th style="width: 20%;">รายละเอียดสำคัญ</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows.length > 0 ? itemRows : '<tr><td colspan="5" style="text-align: center;">ไม่พบข้อมูลผลงานในระบบ</td></tr>'}
      </tbody>
    </table>
  `

  const dateStr = new Date().toISOString().substring(0, 10)
  downloadWordDocument(`รายงานสถิติ_${categoryLabel}_${dateStr}`, `รายงานสถิติ - ${categoryLabel}`, html)
}
