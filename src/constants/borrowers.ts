export type Borrower = {
  name: string
  image?: string
  description: string
  industry?: string
  links: Record<string, string>
  location?: string
  founded?: number | string
  rating?: string
}

export const borrowers: Record<string, Borrower> = {
  fasanara: {
    rating: 'AA',
    founded: 2019,
    industry: 'Market Making',
    location: 'Cayman Islands',
    image: 'images/borrowers/fasanara.svg',
    name: 'Fasanara Investments Master Fund',
    links: {
      website: 'https://www.fasanara.com/digital',
      twitter: 'https://twitter.com/FasanaraDigital',
      linkedin: 'https://www.linkedin.com/company/fasanara',
      crunchbase: 'https://www.crunchbase.com/organization/fasanara-capital'
    },
    description: 'Fasanara Digital was founded in 2019 and it is part of Fasanara Capital, a 200 people London-based Hedge Fund founded in 2011 and specialised in alternative credit and fintech strategies. Fasanara Capital across its different funds manages over 4bn USD. Fasanara Digital, with a team of 15 people fully dedicated to investments and development in crypto, manages a delta neutral high turnover fund specialised in market-making and arbitrage strategies. The fund trades approximately 10bn USD per month on both spot and derivatives on all major trading venues.'
  },
  portofino: {
    rating: 'BB',
    founded: 2021,
    industry: 'Market Making',
    location: 'Zug, Switzerland',
    name: 'Portofino Technologies',
    image: 'images/borrowers/portofino.svg',
    links: {
      website: 'https://www.portofino.tech',
      linkedin: 'https://www.linkedin.com/company/portofino-technologies',
      crunchbase: 'https://www.crunchbase.com/organization/portofino-technologies',
    },
    description: 'Portofino Technologies (Portofino Technologies AG) is a crypto-native technology start-up with 35+ employees across 5 global locations, with headquarters in Zug, Switzerland. Portofino deploys its proprietary market-making technology to trade on centralised, decentralised and OTC markets and provides token services & investments to Web3 projects.'
  },
  wincent: {
    rating: 'A',
    founded: 2018,
    name: 'Wincent',
    location: 'Gibraltar',
    industry: 'Market Making',
    image: 'images/borrowers/wincent.svg',
    links: {
      website: 'https://www.wincent.co',
      linkedin: 'https://www.linkedin.com/company/wincent-co',
    },
    description: 'Wincent (Wincent Investment Fund PCC Limited) is a leading crypto market maker with $3B+ daily volume and 300K+ daily transactions.'
  },
  bastion: {
    rating: 'A',
    founded: 2014,
    location: 'Hong Kong',
    industry: 'Market Making',
    name: 'Bastion Trading Limited',
    image: 'images/borrowers/bastion.svg',
    links: {
      website: 'https://bastiontrading.com',
      twitter: 'https://twitter.com/BastionTrading',
      linkedin: 'https://www.linkedin.com/company/bastiontrade',
      crunchbase: 'https://www.crunchbase.com/organization/bastion-trading',
    },
    description: 'Founded in Hong Kong in 2014 by a team of seasoned traders from Tier-1 Investment Banks, Bastion Trading has been trading cryptocurrencies since 2017 across various CEX and DEX platforms, both as a proprietary trader and as a market maker. Specializing in derivatives trading, market making in spots and options, machine learning & data-driven systematic strategies, as well as actively engaging in DeFi and treasury management. The company is based primarily out of the Asia Pacific region with more than 50 professionals including traders, programmers, operation specialists and business development executives.'
  }
}