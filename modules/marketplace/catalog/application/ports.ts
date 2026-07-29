import type {
  CatalogListParams,
  CatalogListResult,
  CatalogProductDetail,
} from "../../shared/types";

export interface CatalogRepository {
  listProducts(params: CatalogListParams): Promise<CatalogListResult>;
  getProductByHandle(handle: string): Promise<CatalogProductDetail | null>;
  getProductById(id: string): Promise<CatalogProductDetail | null>;
}
