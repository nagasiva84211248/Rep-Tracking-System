export interface Ilocations{
    id:number,
    location:string,
    latitude: number,
    longitude: number,
    sector: number,
    distance:number,
    checkInTime?:string,
    checkOutTime?:string
}

export interface IStartTimeEndTimeDistance{
  startTime:string,
  endTime:string,
  distance:number
}

export interface IcenterLoc{
    latitude: number,
    longitude: number
}

export const locations:Ilocations[] = [
  {
    id: 1,
    location: 'Waypoint 1 - Sector 45 Market',
    latitude: 28.45165873386783,
    longitude: 77.03906983482838,
    sector: 45,
    distance: 2
  },
  {
    id: 2,
    location: 'Waypoint 2 - Sector 33 Market',
    latitude: 28.458108351338204,
    longitude: 77.02172566205263,
    sector: 33,
    distance: 4
  },
  {
    id: 3,
    location: 'Waypoint 3 - Sector 21 Market',
    latitude: 28.458000467919785,
    longitude: 77.03242231160402,
    sector: 21,
    distance: 5
  },
  {
    id: 4,
    location: 'Waypoint 4 - Sector 12 Market',
    latitude: 28.46733197644282,
    longitude: 77.03307811170816,
    sector: 12,
    distance: 5
  },
  {
    id: 5,
    location: 'Waypoint 5 - Sector 36 Market',
    latitude: 28.468665066039076,
    longitude: 77.02869269996881,
    sector: 36,
    distance: 5
  },
  {
    id: 6,
    location: 'Waypoint 6 - Sector 49 Market',
    latitude: 28.470718751521993,
    longitude: 77.02234022319317,
    sector: 49,
    distance: 1
  },
  {
    id: 7,
    location: 'Waypoint 7 - Sector 28 Market',
    latitude: 28.46553081983455,
    longitude: 77.01762724667788,
    sector: 28,
    distance: 1
  },
  {
    id: 8,
    location: 'Waypoint 8 - Sector 17 Market',
    latitude: 28.460846961569818,
    longitude: 77.01426643878222,
    sector: 17,
    distance: 3
  },
  {
    id: 9,
    location: 'Waypoint 9 - Sector 41 Market',
    latitude: 28.453244055654505,
    longitude: 77.01520923525095,
    sector: 41,
    distance: 2
  },
  {
    id: 10,
    location: 'Waypoint 10 - Sector 9 Market',
    latitude: 28.451226288860138,
    longitude: 77.03578278422356,
    sector: 9,
    distance: 4
  }
];

export const centerLoc:IcenterLoc = {
    latitude: 28.448304707250134,
    longitude: 77.02926676183739,
  }