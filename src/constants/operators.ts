export type Operator = {
  name: string
  nameShort?: string
  image?: string
  description: string
  industry?: string
  links: Record<string, string>
  location?: string
  founded?: number | string
  rating?: string
}

export const operators: Record<string, Operator> = {
  bProtocol: {
    founded: 2020,
    name: 'B.Protocol',
    location: 'Tel Aviv, Israel',
    industry: 'DeFi Risk Management',
    image: 'images/borrowers/bprotocol.png',
    links: {
      website: 'https://www.bprotocol.org',
      twitter: 'https://twitter.com/bprotocoleth',
      linkedin: 'https://www.linkedin.com/company/b-protocol',
      crunchbase: 'https://www.crunchbase.com/organization/b-protocol'
    },
    description: 'B.Protocol, a decentralized backstop liquidity protocol, where backstop liquidity providers (BLP) buy their right to liquidate under-collateralized loans and share their profits with the users of the platform. As a result, the users (borrowers and lenders) receive additional yield to their usual interest rate. The proposed mechanism eliminates the need for gas wars between liquidators, and thus transfers a big part of the protocol value back to the borrowers and lenders, which in turn improves their effective interest rate.'
  },
  blockAnalitica: {
    founded: 2018,
    location: 'Ljubljana',
    name: 'Block Analitica',
    industry: 'Risk Intelligence for DeFi',
    image: 'images/borrowers/blockanalitica.png',
    links: {
      website: 'https://blockanalitica.com',
      twitter: 'https://twitter.com/BlockAnalitica',
      linkedin: 'https://www.linkedin.com/company/block-analitica'
    },
    description: 'Established in 2018, our company set out on a mission to offer risk-related services within the DeFi arena.'
  },
  steakhouseFinancial: {
    founded: 2023,
    location: 'Grand Cayman',
    industry: 'Market Making',
    name: 'Steakhouse Financial',
    image: 'images/borrowers/steakhouse.png',
    links: {
      twitter: 'https://twitter.com/SteakhouseFi',
      website: 'https://www.steakhouse.financial',
      linkedin: 'https://www.linkedin.com/company/steakhouse-financial/'
    },
    description: 'Crypto-native financial advisory to grow a new generation of open, transparent and neutral financial services.'
  },
  re7: {
    founded: 2021,
    name: 'Re7 Capital',
    industry: 'Investment Firm',
    image: 'images/borrowers/re7.png',
    location: 'London, England, United Kingdom',
    links: {
      website: 'https://www.re7.capital',
      twitter: 'https://twitter.com/Re7Capital',
      linkedin: 'https://www.linkedin.com/company/re7capital',
      crunchbase: 'https://www.crunchbase.com/organization/re7-capital'
    },
    description: 'Re7 Capital specialises in DeFi R&D and liquid crypto investment strategies.'
  },
  fasanara: {
    rating: 'AA',
    founded: 2019,
    industry: 'Market Making',
    location: 'Cayman Islands',
    nameShort: 'Fasanara Investments',
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
    nameShort: 'Bastion Trading',
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