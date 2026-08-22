import { WisdomItem } from '../components/views/Dashboard'
import { formatAuthorsForDisplay } from './authorHelper'

/**
 * Downloads Word (.doc) document from HTML content string
 * Formatted with formal official Thai document styling matching the evaluation report
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
          font-family: 'Sarabun', 'TH Sarabun PSK', 'TH Sarabun New', sans-serif;
          font-size: 13pt;
          line-height: 1.5;
          color: #000;
          padding: 24px 30px;
          background: #fff;
        }

        /* Header */
        .doc-header {
          text-align: center;
          margin-bottom: 14px;
        }
        .doc-header .org-name {
          font-size: 18pt;
          font-weight: 800;
          color: #000;
        }
        .doc-header .org-sub {
          font-size: 13.5pt;
          color: #000;
        }
        .doc-header .form-title {
          font-size: 15pt;
          font-weight: 700;
          margin-top: 6px;
          padding: 5px 0;
          color: #000;
        }

        /* แถวเลขที่ / วันที่ */
        .ref-row {
          display: flex;
          justify-content: space-between;
          font-size: 13pt;
          margin: 12px 0 8px 0;
          color: #000;
        }

        /* หัวข้อ Section */
        .section-title {
          font-size: 13.5pt;
          font-weight: 700;
          color: #000;
          margin-top: 14px;
          margin-bottom: 4px;
        }

        /* ตารางข้อมูล */
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 12px;
          border: 1px solid #000;
        }
        th, td {
          border: 1px solid #000;
          padding: 6px 10px 14px 10px;
          font-size: 12.5pt;
          color: #000;
          vertical-align: top;
          line-height: 1.5;
        }
        th {
          font-weight: 700;
          text-align: center;
          background: transparent;
        }
        .lbl {
          width: 180px;
          font-weight: 700;
        }

        /* กล่องข้อความ / บทคัดย่อ */
        .notes-box {
          min-height: 24px;
          padding: 6px 0 12px 0;
          font-size: 12.5pt;
          white-space: pre-wrap;
          margin-top: 4px;
          line-height: 1.6;
          color: #000;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
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
 * Exports a single WisdomItem report as Word (.doc) with official template styling
 */
export const exportItemToWord = (item: WisdomItem, categoryLabel: string) => {
  const thaiDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })

  const metadataRows = Object.entries(item.metadata || {})
    .filter(([key, val]) => val && key !== 'department' && key !== 'contribution')
    .map(([key, val]) => {
      const labelMap: Record<string, string> = {
        research_type: 'ประเภทงานวิจัย',
        ip_type: 'ประเภทของงาน',
        award_level: 'ระดับเวทีการนำเสนอ',
        utilization_type: 'ประเภทผลงาน',
        journal_name: 'วารสาร',
        journal_rank: 'ฐานวารสาร',
        registration_number: 'เลขที่คำขอ',
        patent_number: 'เลขที่',
        submission_date: 'วันที่ส่ง',
        registration_date: 'วันที่อนุมัติ',
        application_status: 'สถานะเลขคำขอ',
        status: 'สถานะปัจจุบัน',
        creator_type: 'ผู้สร้างสรรค์',
        source: 'ที่มาของผลงาน',
        scope: 'ขอบเขตผลงาน',
        organizer: 'รายละเอียดเวทีการนำเสนอ',
        organization_used: 'หน่วยงานที่นำไปใช้ประโยชน์',
        utilization_date: 'วันที่ขอนำไปใช้ประโยชน์',
        impact_summary: 'ประโยชน์เชิงประจักษ์',
        year: 'ปี พ.ศ.',
        fiscal_year: 'ปีงบประมาณ',
        academic_year: 'ปีการศึกษา',
        ip_subtype: 'ประเภททรัพย์สินทางปัญญาย่อย',
        export_date: 'วันที่ส่งออกเอกสาร',
        contribution: 'การมีส่วนร่วมในผลงาน',
        funding: 'ทุนวิจัยที่ได้รับ',
        presenter: 'ผู้นำเสนอผลงาน',
        award_name: 'รางวัลที่ได้รับ',
        innovation_type: 'ประเภทของนวัตกรรม',
        ip_status: 'ยื่นขอจดทรัพย์สินทางปัญญา',
        published: 'ตีพิมพ์ (Published)',
        presented: 'นำเสนอผลงาน (Presented)',
        notes: 'หมายเหตุ',
        remarks: 'หมายเหตุ',
        drive_link: 'ลิงก์ไดรฟ์รายละเอียดผลงาน',
      }
      return `<tr>
        <td class="lbl">${labelMap[key] || key}:</td>
        <td>${val}</td>
      </tr>`
    })
    .join('')

  const html = `
    <!-- Header -->
    <div class="doc-header">
      <div class="org-name">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
      <div class="org-sub">สถาบันพระบรมราชชนก กระทรวงสาธารณสุข</div>
      <div class="form-title">รายงานสรุปรายละเอียดผลงาน &middot; ${categoryLabel}</div>
    </div>

    <!-- เลขที่ / วันที่ -->
    <div class="ref-row">
      <span>เลขที่เอกสาร:&nbsp;............................................</span>
      <span>วันที่พิมพ์:&nbsp;<strong>${thaiDate}</strong></span>
    </div>

    <div class="section-title">ข้อมูลหลักของผลงาน</div>
    <table>
      <tr>
        <td class="lbl">ชื่อผลงาน / หัวข้อ:</td>
        <td colspan="3"><strong>${item.title}</strong></td>
      </tr>
      <tr>
        <td class="lbl">หมวดหมู่ผลงาน:</td>
        <td>${categoryLabel}</td>
        <td class="lbl" style="width: 140px;">สถานะการเผยแพร่:</td>
        <td>${item.is_public ? 'เปิดเผยต่อสาธารณะ (Public)' : 'เฉพาะบุคลากรภายใน (Private)'}</td>
      </tr>
      <tr>
        <td class="lbl">ผู้จัดทำ / เจ้าของผลงาน:</td>
        <td>${formatAuthorsForDisplay(item.authors) || 'ไม่ระบุ'}</td>
        <td class="lbl" style="width: 140px;">วันที่บันทึกลงระบบ:</td>
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
      <div class="notes-box">
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
  const thaiDate = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
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
        <td style="font-weight: bold;">${item.title}</td>
        <td>${authorsStr}</td>
        <td>${subInfo}</td>
      </tr>`
    })
    .join('')

  const html = `
    <!-- Header -->
    <div class="doc-header">
      <div class="org-name">วิทยาลัยพยาบาลศรีมหาสารคาม</div>
      <div class="org-sub">สถาบันพระบรมราชชนก กระทรวงสาธารณสุข</div>
      <div class="form-title">รายงานสถิติและคลังข้อมูลสรุป &middot; ${categoryLabel}</div>
    </div>

    <!-- เลขที่ / วันที่ -->
    <div class="ref-row">
      <span>เลขที่เอกสาร:&nbsp;............................................</span>
      <span>วันที่พิมพ์:&nbsp;<strong>${thaiDate}</strong></span>
    </div>

    <div class="section-title">1. สรุปสถิติภาพรวม (Overview Statistics)</div>
    <table>
      <tr>
        <th style="width: 70%; text-align: left;">รายการสถิติ</th>
        <th style="width: 30%; text-align: right;">จำนวน</th>
      </tr>
      <tr>
        <td><strong>จำนวนผลงานทั้งหมดในหมวดหมู่นี้</strong></td>
        <td style="text-align: right;"><strong>${totalCount} รายการ</strong></td>
      </tr>
      ${yearBreakdownHtml}
    </table>

    <div class="section-title">2. ตารางรายชื่อผลงานทั้งหมด (${totalCount} รายการ)</div>
    <table>
      <thead>
        <tr>
          <th style="width: 6%;">ลำดับ</th>
          <th style="width: 10%;">ปี</th>
          <th style="width: 40%; text-align: left;">ชื่อผลงาน</th>
          <th style="width: 24%; text-align: left;">ผู้จัดทำ / เจ้าของผลงาน</th>
          <th style="width: 20%; text-align: left;">รายละเอียดสำคัญ</th>
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
