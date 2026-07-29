export type { CatalogRepository } from "./application/ports";
export { listCatalogProducts } from "./application/list-products";
export {
  getCatalogProductByHandle,
  getCatalogProductById,
} from "./application/get-product";
export { catalogRepository } from "./infrastructure/supabase-catalog-repository";
