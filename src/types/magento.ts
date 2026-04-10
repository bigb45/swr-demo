export interface MagentoMediaEntry {
  media_type: string;
  label: string | null;
  position: number;
  disabled: boolean;
  types: string[];
  file: string;
}

export interface MagentoCustomAttribute {
  attribute_code: string;
  value: string | string[];
}

export interface MagentoProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: number;
  visibility: number;
  type_id: string;
  weight?: number;
  media_gallery_entries?: MagentoMediaEntry[];
  custom_attributes?: MagentoCustomAttribute[];
}

export interface MagentoProductList {
  items: MagentoProduct[];
  search_criteria: {
    filter_groups: unknown[];
    page_size: number;
    current_page: number;
  };
  total_count: number;
}

export interface MagentoCategory {
  id: number;
  parent_id: number;
  name: string;
  is_active: boolean;
  position: number;
  level: number;
  children_data: MagentoCategory[];
  children?: string;
}

export interface MagentoCategoryTree extends MagentoCategory {
  children_data: MagentoCategory[];
}
