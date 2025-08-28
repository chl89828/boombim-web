export interface District {
  id: string;
  name: string;
  nameEn: string;
  gridPosition: {
    row: number;
    col: number;
  };
  populationData?: {
    current: number;
    density: number;
    change: number;
  };
}

export interface PictogramMapProps {
  districts: District[];
  selectedDistrict?: string;
  onDistrictClick: (districtId: string) => void;
  onDistrictHover: (districtId: string | null) => void;
  colorScale?: 'population' | 'density' | 'change';
  showLabels?: boolean;
  showTooltips?: boolean;
}

export interface DistrictTileProps {
  district: District;
  isSelected: boolean;
  isHovered: boolean;
  colorIntensity: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  showLabel?: boolean;
}

export interface PictogramLayoutConfig {
  gridSize: {
    rows: number;
    cols: number;
  };
  tileSize: {
    width: number;
    height: number;
  };
  spacing: number;
}

export type ColorScale = {
  min: string;
  max: string;
  steps: string[];
};