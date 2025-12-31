/**
 * Document Import Service
 * Parse PDF and Word documents to extract agreement terms
 */

interface ParsedDocument {
  text: string
  title?: string
  metadata?: {
    pages?: number
    author?: string
    createdDate?: Date
  }
  sections?: {
    heading: string
    content: string
  }[]
}

interface ExtractedTerms {
  title?: string
  description?: string
  keyTerms?: string
  parties?: {
    party1?: string
    party2?: string
  }
  dates?: {
    startDate?: string
    endDate?: string
  }
  sections?: string[]
}

export class DocumentImport {
  /**
   * Parse PDF document
   * WARNING: This is a placeholder implementation. 
   * In production, integrate a library like pdf-parse, pdfjs-dist, or pdf2json
   */
  static async parsePDF(file: File): Promise<ParsedDocument> {
    try {
      // TODO: Implement actual PDF parsing using pdf-parse or similar
      // For now, return placeholder data
      console.warn('⚠️ PDF parsing not fully implemented. This is a placeholder. Integrate pdf-parse library for production use.')
      
      return {
        text: 'PDF content extraction requires pdf-parse library integration. This is placeholder data.',
        title: file.name.replace('.pdf', ''),
        metadata: {
          pages: 0,
        },
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      throw new Error('Failed to parse PDF document. PDF parsing library not yet integrated.')
    }
  }

  /**
   * Parse Word document (.docx)
   * WARNING: This is a placeholder implementation.
   * In production, integrate a library like mammoth or docx
   */
  static async parseWord(file: File): Promise<ParsedDocument> {
    try {
      // TODO: Implement actual Word parsing using mammoth or similar
      // For now, return placeholder data
      console.warn('⚠️ Word parsing not fully implemented. This is a placeholder. Integrate mammoth library for production use.')
      
      return {
        text: 'Word document extraction requires mammoth library integration. This is placeholder data.',
        title: file.name.replace('.docx', '').replace('.doc', ''),
      }
    } catch (error) {
      console.error('Word parsing error:', error)
      throw new Error('Failed to parse Word document. Word parsing library not yet integrated.')
    }
  }

  /**
   * Extract agreement terms from parsed document
   */
  static extractTerms(document: ParsedDocument): ExtractedTerms {
    const { text, title } = document
    const terms: ExtractedTerms = {}

    // Extract title
    if (title) {
      terms.title = title
    }

    // Try to extract parties
    const partyMatches = text.match(
      /between\s+([A-Z][a-z\s]+)\s+and\s+([A-Z][a-z\s]+)/i
    )
    if (partyMatches) {
      terms.parties = {
        party1: partyMatches[1].trim(),
        party2: partyMatches[2].trim(),
      }
    }

    // Try to extract dates
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g
    const dates = text.match(dateRegex)
    if (dates && dates.length >= 1) {
      terms.dates = {
        startDate: this.normalizeDate(dates[0]),
        endDate: dates.length > 1 ? this.normalizeDate(dates[1]) : undefined,
      }
    }

    // Extract key sections
    const sections = this.extractSections(text)
    if (sections.length > 0) {
      terms.sections = sections.map(s => s.heading)
      
      // Use first section as description if available
      if (sections[0]) {
        terms.description = sections[0].content.substring(0, 500)
      }
    }

    // Extract key terms (look for numbered or bulleted lists)
    const keyTermsMatch = text.match(/(?:terms|obligations|conditions):\s*(.+?)(?:\n\n|$)/is)
    if (keyTermsMatch) {
      terms.keyTerms = keyTermsMatch[1].trim().substring(0, 1000)
    }

    return terms
  }

  /**
   * Extract sections from document text
   */
  private static extractSections(text: string): { heading: string; content: string }[] {
    const sections: { heading: string; content: string }[] = []
    
    // Try to match common heading patterns
    // Pattern 1: All caps headings
    const allCapsPattern = /^([A-Z\s]{3,})$/gm
    
    // Pattern 2: Numbered headings (1. Title, 2. Title, etc.)
    const numberedPattern = /^\d+\.\s+(.+)$/gm
    
    // Pattern 3: Article/Section headings
    const articlePattern = /^(?:Article|Section)\s+(\d+)[:\s]+(.+)$/gm

    const lines = text.split('\n')
    let currentSection: { heading: string; content: string } | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      
      if (!trimmed) continue

      // Check if this is a heading
      const isAllCaps = /^[A-Z\s]{3,}$/.test(trimmed)
      const isNumbered = /^\d+\.\s+/.test(trimmed)
      const isArticle = /^(?:Article|Section)\s+\d+/i.test(trimmed)

      if (isAllCaps || isNumbered || isArticle) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection)
        }

        // Start new section
        currentSection = {
          heading: trimmed,
          content: '',
        }
      } else if (currentSection) {
        // Add to current section content
        currentSection.content += trimmed + ' '
      }
    }

    // Save last section
    if (currentSection) {
      sections.push(currentSection)
    }

    return sections
  }

  /**
   * Normalize date format to YYYY-MM-DD
   */
  private static normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Invalid date
    }
    return dateStr
  }

  /**
   * Validate file type
   */
  static isValidFileType(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
    ]
    return validTypes.includes(file.type)
  }

  /**
   * Get file extension
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * Main import function - handles both PDF and Word
   */
  static async importDocument(file: File): Promise<ExtractedTerms> {
    if (!this.isValidFileType(file)) {
      throw new Error(
        'Invalid file type. Please upload a PDF or Word document.'
      )
    }

    const extension = this.getFileExtension(file.name)
    let parsed: ParsedDocument

    if (extension === 'pdf') {
      parsed = await this.parsePDF(file)
    } else if (extension === 'docx' || extension === 'doc') {
      parsed = await this.parseWord(file)
    } else {
      throw new Error('Unsupported file format')
    }

    return this.extractTerms(parsed)
  }
}
