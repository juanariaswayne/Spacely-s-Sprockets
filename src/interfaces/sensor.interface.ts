export interface Sensor {
  name: string;
  type: string;
  registerValues: number[];
  standardDeviation: number;
  quality: string
}
