import { buildZillowUrl } from '../zillowUrlBuilder'

describe('buildZillowUrl', () => {
  describe('standard address formats', () => {
    it('should format "Lower Merion Township, PA, USA" correctly', () => {
      const result = buildZillowUrl('Lower Merion Township, PA, USA')
      expect(result).toBe('https://www.zillow.com/lower-merion-township-pa/')
    })

    it('should format "Cornwells Heights, Bensalem, PA, USA" correctly', () => {
      const result = buildZillowUrl('Cornwells Heights, Bensalem, PA, USA')
      expect(result).toBe('https://www.zillow.com/cornwells-heights-bensalem-pa/')
    })

    it('should format "Philadelphia, PA, USA" correctly', () => {
      const result = buildZillowUrl('Philadelphia, PA, USA')
      expect(result).toBe('https://www.zillow.com/philadelphia-pa/')
    })

    it('should handle city names with special characters', () => {
      const result = buildZillowUrl("St. Mary's, PA, USA")
      expect(result).toBe('https://www.zillow.com/st-marys-pa/')
    })

    it('should handle multiple word city names', () => {
      const result = buildZillowUrl('New York, NY, USA')
      expect(result).toBe('https://www.zillow.com/new-york-ny/')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = buildZillowUrl('')
      expect(result).toBe('https://www.zillow.com/')
    })

    it('should handle empty string with city name fallback', () => {
      const result = buildZillowUrl('', 'Philadelphia')
      expect(result).toBe('https://www.zillow.com/philadelphia/')
    })

    it('should use city name when address is empty', () => {
      const result = buildZillowUrl('', 'Lower Merion Township')
      expect(result).toBe('https://www.zillow.com/lower-merion-township/')
    })

    it('should handle address without state', () => {
      const result = buildZillowUrl('Philadelphia, USA')
      expect(result).toBe('https://www.zillow.com/philadelphia/')
    })

    it('should handle address with only city name', () => {
      const result = buildZillowUrl('Philadelphia')
      expect(result).toBe('https://www.zillow.com/philadelphia/')
    })
  })

  describe('formatting', () => {
    it('should remove special characters', () => {
      const result = buildZillowUrl('St. Louis, MO, USA')
      expect(result).toBe('https://www.zillow.com/st-louis-mo/')
    })

    it('should handle multiple spaces', () => {
      const result = buildZillowUrl('New    York, NY, USA')
      expect(result).toBe('https://www.zillow.com/new-york-ny/')
    })

    it('should handle trailing/leading spaces', () => {
      const result = buildZillowUrl('  Philadelphia, PA, USA  ')
      expect(result).toBe('https://www.zillow.com/philadelphia-pa/')
    })
  })
})

