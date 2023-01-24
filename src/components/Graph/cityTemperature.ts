export interface CityTemperature {
  date: number;
  deposit: string;
  redeem: string;
}

const cityTemperature: CityTemperature[] = [
  {
    date: 1670886000000,
    deposit: '123.4',
    redeem: '-10.7',
  },
  {
    date: 1670972400000,
    deposit: '58.0',
    redeem: '-19.9',
  },
  {
    date: 1671058800000,
    deposit: '53.3',
    redeem: '-19.1',
  },
  {
    date: 1671145200000,
    deposit: '55.7',
    redeem: '-18.8',
  },
  {
    date: 1671231600000,
    deposit: '64.2',
    redeem: '-18.7',
  },
  {
    date: 1671318000000,
    deposit: '58.8',
    redeem: '-17.0',
  },
  {
    date: 1671404400000,
    deposit: '57.9',
    redeem: '-106.7',
  },
];

export default cityTemperature;