import { describe, expect, it } from 'vitest'

import {
  describeComplexOperation,
  formatMatrix,
  mapUnitCategoryLabel,
  parseMatrixInput,
  parseNumberList,
} from '@/components/AdvancedPanels'

describe('Advanced panel helpers', () => {
  describe('parseMatrixInput', () => {
    it('parses multiline matrix text into numeric arrays', () => {
      const result = parseMatrixInput('1 2 3\n4 5 6')
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ])
    })

    it('supports commas and extra whitespace', () => {
      const result = parseMatrixInput('1, 2, 3\n  4,5, 6')
      expect(result).toEqual([
        [1, 2, 3],
        [4, 5, 6],
      ])
    })

    it('throws when rows have different column counts', () => {
      expect(() => parseMatrixInput('1 2\n3 4 5')).toThrowError('所有行必须包含相同数量的列。')
    })

    it('throws on invalid numbers', () => {
      expect(() => parseMatrixInput('1 a\n3 4')).toThrowError('无效的数字: a')
    })
  })

  describe('parseNumberList', () => {
    it('parses comma and whitespace separated numbers', () => {
      const result = parseNumberList('1, 2  3\n4')
      expect(result).toEqual([1, 2, 3, 4])
    })

    it('throws on invalid value', () => {
      expect(() => parseNumberList('1, x')).toThrowError('无效的数字: x')
    })
  })

  describe('format helpers', () => {
    it('formats matrices with trimmed decimals', () => {
      const result = formatMatrix([
        [1, 2.3456789012],
        [3.3333333333, 4],
      ])
      expect(result).toBe('[1, 2.3456789012]\n[3.3333333333, 4]')
    })
  })

  describe('describeComplexOperation', () => {
    it('maps operations to symbols', () => {
      expect(describeComplexOperation('add')).toBe('＋')
      expect(describeComplexOperation('subtract')).toBe('－')
      expect(describeComplexOperation('multiply')).toBe('×')
      expect(describeComplexOperation('divide')).toBe('÷')
      expect(describeComplexOperation('conjugate')).toBe('conjugate')
    })
  })

  describe('mapUnitCategoryLabel', () => {
    it('returns localized labels', () => {
      expect(mapUnitCategoryLabel('length')).toBe('长度')
      expect(mapUnitCategoryLabel('temperature')).toBe('温度')
      expect(mapUnitCategoryLabel('unknown')).toBe('unknown')
    })
  })
})
