import { downloadWordDocument, exportCategoryReportToWord, exportItemToWord } from '@/utils/wordExport'
import { WisdomItem } from '@/components/views/Dashboard'

describe('wordExport utils', () => {
  let createObjectURLSpy: any
  let revokeObjectURLSpy: any
  let clickSpy: any

  beforeEach(() => {
    createObjectURLSpy = jest.fn().mockReturnValue('blob:test-url')
    revokeObjectURLSpy = jest.fn()
    clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    global.URL.createObjectURL = createObjectURLSpy
    global.URL.revokeObjectURL = revokeObjectURLSpy
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('downloadWordDocument', () => {
    it('creates blob and triggers link download', () => {
      downloadWordDocument('test_doc', 'Test Title', '<p>Hello World</p>')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('exportItemToWord', () => {
    it('exports a single item to word with metadata and description', () => {
      const mockItem: WisdomItem = {
        id: '1',
        title: 'งานวิจัยนวัตกรรมสุขภาพ',
        category: 'research',
        description: 'บทคัดย่อของงานวิจัย',
        authors: 'ดร.สมชาย',
        is_public: true,
        created_at: '2026-01-01T00:00:00.000Z',
        metadata: {
          research_type: 'การวิจัยทางคลินิก',
          journal_name: 'Thai Medical Journal',
          year: '2567',
        },
      }

      exportItemToWord(mockItem, 'งานวิจัย')
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('exportCategoryReportToWord', () => {
    const mockItems: WisdomItem[] = [
      {
        id: '1',
        title: 'Research Paper 1',
        category: 'research',
        is_public: true,
        metadata: { year: '2566', journal_name: 'Thai Medical Journal', scope: 'ระดับชาติ' },
        authors: 'Dr. Alice',
        created_at: '2026-01-01',
      },
      {
        id: '2',
        title: 'Innovation Item 1',
        category: 'innovation',
        is_public: true,
        metadata: { year: '2567', organizer: 'SMNC' },
        authors: 'Dr. Bob',
        created_at: '2026-01-02',
      },
    ]

    it('generates and downloads word report for category list', () => {
      exportCategoryReportToWord('งานวิจัย', mockItems)
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })

    it('handles empty items list without crashing', () => {
      exportCategoryReportToWord('รางวัล', [])
      expect(createObjectURLSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })
  })
})
