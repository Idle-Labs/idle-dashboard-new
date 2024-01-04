export type Borrower = {
  name: string
  image?: string
  description: string
  links: Record<string, string>
  location?: string
  founded?: number
  rating?: string
}

export const borrowers: Record<string, Borrower> = {
  fasanara: {
    rating: 'AA',
    founded: 2019,
    location: 'Cayman Islands',
    image: 'images/borrowers/fasanara.svg',
    name: 'Fasanara Investments Master Fund',
    links: {
      website: 'https://www.fasanara.com/digital',
      twitter: 'https://twitter.com/FasanaraDigital',
      linkedin: 'https://www.linkedin.com/company/fasanara',
    },
    description: 'Fasanara Digital was founded in 2019 and it is part of Fasanara Capital, a 200 people London-based Hedge Fund founded in 2011 and specialised in alternative credit and fintech strategies. Fasanara Capital across its different funds manages over 4bn USD. Fasanara Digital, with a team of 15 people fully dedicated to investments and development in crypto, manages a delta neutral high turnover fund specialised in market-making and arbitrage strategies. The fund trades approximately 10bn USD per month on both spot and derivatives on all major trading venues.'
  }
}